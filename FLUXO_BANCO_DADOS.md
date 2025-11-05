# 📊 Fluxo de Insert e Update no Banco de Dados

## 🏗️ Arquitetura Atual

O projeto utiliza uma arquitetura híbrida com:
- **Frontend**: Zustand (estado) + PouchDB (IndexedDB local)
- **Backend**: Next.js API Routes + Prisma + PostgreSQL
- **Sincronização**: Parcialmente implementada (TODO)

---

## 📋 Estrutura do Banco de Dados (Prisma Schema)

### Modelos Principais:

```
User
  ├── id (cuid)
  ├── email (unique)
  ├── passwordHash
  └── Relations:
      ├── boards (Board[])
      ├── prompts (Prompt[])
      └── pomodoroSessions (PomodoroSession[])

Board
  ├── id (cuid)
  ├── userId (FK → User)
  ├── name
  └── Relations:
      └── columns (KanbanColumn[])

KanbanColumn
  ├── id (cuid)
  ├── boardId (FK → Board)
  ├── title
  ├── color
  ├── position
  └── Relations:
      └── cards (KanbanCard[])

KanbanCard
  ├── id (cuid)
  ├── columnId (FK → KanbanColumn)
  ├── title
  ├── description
  ├── tags (String[])
  ├── priority
  └── position
```

---

## 🔄 Fluxo Completo de Dados

### 1️⃣ **INSERT (Criação)**

#### **A) Boards (Quadros)**

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND                                                    │
├─────────────────────────────────────────────────────────────┤
│ 1. Componente chama: useBoardsStore().addBoard(name)      │
│ 2. Zustand Store cria objeto Board localmente              │
│ 3. Salva no localStorage                                    │
│                                                             │
│ ⚠️ ATUAL: Não sincroniza com API ainda                     │
│ ✅ API PRONTA: POST /api/boards                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ API ROUTE: /api/boards/route.ts (POST)                      │
├─────────────────────────────────────────────────────────────┤
│ 1. Verifica autenticação (getServerSession)                 │
│ 2. Busca usuário: prisma.user.findUnique({ email })         │
│ 3. Valida dados: name.trim()                                │
│ 4. INSERT: prisma.board.create({                            │
│      data: { userId: user.id, name }                        │
│    })                                                        │
│ 5. Retorna: { board } (status 201)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ PRISMA CLIENT                                                │
├─────────────────────────────────────────────────────────────┤
│ 1. Converte para SQL: INSERT INTO "Board" (...)             │
│ 2. Executa no PostgreSQL (Neon)                             │
│ 3. Retorna objeto criado                                    │
└─────────────────────────────────────────────────────────────┘
```

**Código da API:**
```typescript
// app/api/boards/route.ts
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json();
  const name = (body?.name || '').toString().trim();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  // ✅ INSERT NO BANCO
  const board = await prisma.board.create({ 
    data: { userId: user.id, name } 
  });
  
  return NextResponse.json({ board }, { status: 201 });
}
```

#### **B) Kanban Cards (Cartões)**

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND - KanbanBoard.tsx                                  │
├─────────────────────────────────────────────────────────────┤
│ 1. Usuário adiciona card: handleAddCard(columnId, title)    │
│ 2. Store: useKanbanStore().addCard({ title, columnId })     │
│ 3. Atualiza estado local (Zustand)                          │
│ 4. Auto-save (debounce 1s): saveBoard() → PouchDB           │
│ 5. syncWithAPI() → ⚠️ TODO (não implementado)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ (quando implementado)
┌─────────────────────────────────────────────────────────────┐
│ API ROUTE: /api/kanban/[boardId]/cards/route.ts (POST)      │
├─────────────────────────────────────────────────────────────┤
│ 1. Verifica autenticação                                    │
│ 2. Valida boardId pertence ao usuário                        │
│ 3. Busca column: prisma.kanbanColumn.findFirst()            │
│ 4. Calcula position: max(position) + 1                       │
│ 5. INSERT: prisma.kanbanCard.create({                       │
│      data: {                                                │
│        columnId, title, description,                        │
│        tags, priority, position                             │
│      }                                                       │
│    })                                                        │
│ 6. Retorna: { card } (status 201)                          │
└─────────────────────────────────────────────────────────────┘
```

**Código da API:**
```typescript
// app/api/kanban/[boardId]/cards/route.ts
export async function POST(req: NextRequest, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { boardId } = await params;
  const { title, description, columnId, tags, priority } = await req.json();
  
  // Validação de segurança: verifica se column pertence ao board do usuário
  const column = await prisma.kanbanColumn.findFirst({
    where: { 
      id: String(columnId), 
      board: { id: boardId, userId: session.user.id } 
    },
  });
  if (!column) return NextResponse.json({ error: 'Column not found' }, { status: 404 });

  // Calcula próxima posição
  const maxPos = await prisma.kanbanCard.aggregate({
    where: { columnId: column.id },
    _max: { position: true },
  });

  // ✅ INSERT NO BANCO
  const card = await prisma.kanbanCard.create({
    data: {
      columnId: column.id,
      title: String(title),
      description: description ? String(description) : undefined,
      tags: Array.isArray(tags) ? tags.map((t: any) => String(t)) : [],
      priority: priority ? String(priority) : undefined,
      position: (maxPos._max.position ?? -1) + 1,
    },
  });

  return NextResponse.json({ card }, { status: 201 });
}
```

#### **C) Kanban Columns (Colunas)**

```
┌─────────────────────────────────────────────────────────────┐
│ API ROUTE: /api/kanban/[boardId]/columns/route.ts (POST)    │
├─────────────────────────────────────────────────────────────┤
│ 1. Verifica board pertence ao usuário                        │
│ 2. Valida: title.trim()                                      │
│ 3. Calcula position: max(position) + 1                       │
│ 4. INSERT: prisma.kanbanColumn.create({                     │
│      data: { boardId, title, color, position }               │
│    })                                                        │
└─────────────────────────────────────────────────────────────┘
```

---

### 2️⃣ **UPDATE (Atualização)**

#### **A) Kanban Cards - PATCH**

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND                                                     │
├─────────────────────────────────────────────────────────────┤
│ 1. Usuário edita card: handleUpdateCard(id, data)           │
│ 2. Store: useKanbanStore().updateCard(id, data)             │
│ 3. Auto-save → PouchDB                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ API ROUTE: /api/kanban/[boardId]/cards/route.ts (PATCH)     │
├─────────────────────────────────────────────────────────────┤
│ 1. Busca card: prisma.kanbanCard.findUnique({ id })          │
│ 2. Valida segurança: verifica se pertence ao board do user   │
│ 3. Prepara updates: { title?, description?, tags?, ... }    │
│ 4. Se mudou coluna (newColumnId):                            │
│    - Valida nova column                                       │
│    - Recalcula position                                       │
│ 5. UPDATE: prisma.kanbanCard.update({                        │
│      where: { id },                                          │
│      data: updates                                           │
│    })                                                        │
└─────────────────────────────────────────────────────────────┘
```

**Código da API:**
```typescript
export async function PATCH(req: NextRequest, { params }) {
  const session = await getServerSession(authOptions);
  const { boardId } = await params;
  const body = await req.json();
  const id = String(body?.id || '');

  // Busca card existente
  const card = await prisma.kanbanCard.findUnique({ where: { id } });
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  // Valida segurança
  const column = await prisma.kanbanColumn.findFirst({
    where: { id: card.columnId, board: { id: boardId, userId: session.user.id } },
  });
  if (!column) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  // Prepara updates
  const updates: any = {};
  if (body.title !== undefined) updates.title = String(body.title);
  if (body.description !== undefined) updates.description = body.description ? String(body.description) : null;
  if (body.tags !== undefined) updates.tags = Array.isArray(body.tags) ? body.tags.map((t: any) => String(t)) : [];
  if (body.priority !== undefined) updates.priority = body.priority ? String(body.priority) : null;

  // Se mudou de coluna
  if (body.newColumnId) {
    const newColumn = await prisma.kanbanColumn.findFirst({
      where: { id: String(body.newColumnId), boardId: boardId },
    });
    if (!newColumn) return NextResponse.json({ error: 'New column not found' }, { status: 404 });

    updates.columnId = newColumn.id;
    const maxPos = await prisma.kanbanCard.aggregate({ 
      where: { columnId: newColumn.id }, 
      _max: { position: true } 
    });
    updates.position = (maxPos._max.position ?? -1) + 1;
  }

  // ✅ UPDATE NO BANCO
  const updated = await prisma.kanbanCard.update({ 
    where: { id }, 
    data: updates 
  });
  
  return NextResponse.json({ card: updated });
}
```

---

### 3️⃣ **SELECT (Leitura)**

#### **A) GET Boards**

```
┌─────────────────────────────────────────────────────────────┐
│ API ROUTE: /api/boards/route.ts (GET)                       │
├─────────────────────────────────────────────────────────────┤
│ 1. Verifica autenticação                                    │
│ 2. Busca user: prisma.user.findUnique({ email })             │
│ 3. SELECT: prisma.board.findMany({                          │
│      where: { userId: user.id },                            │
│      orderBy: { createdAt: 'asc' }                          │
│    })                                                        │
│ 4. Retorna: { boards }                                      │
└─────────────────────────────────────────────────────────────┘
```

#### **B) GET Columns + Cards**

```
┌─────────────────────────────────────────────────────────────┐
│ API ROUTE: /api/kanban/[boardId]/columns/route.ts (GET)     │
├─────────────────────────────────────────────────────────────┤
│ 1. Valida board pertence ao usuário                          │
│ 2. SELECT com JOIN: prisma.kanbanColumn.findMany({          │
│      where: { boardId },                                    │
│      orderBy: { position: 'asc' },                           │
│      include: {                                             │
│        cards: { orderBy: { position: 'asc' } }             │
│      }                                                       │
│    })                                                        │
│ 3. Retorna: { columns } (com cards aninhados)               │
└─────────────────────────────────────────────────────────────┘
```

---

### 4️⃣ **DELETE (Exclusão)**

```
┌─────────────────────────────────────────────────────────────┐
│ API ROUTE: /api/kanban/[boardId]/cards/route.ts (DELETE)    │
├─────────────────────────────────────────────────────────────┤
│ 1. Busca card com relations:                               │
│    prisma.kanbanCard.findUnique({                            │
│      include: { column: { include: { board: true } } }      │
│    })                                                        │
│ 2. Valida: card.column.board.id === boardId                 │
│    && card.column.board.userId === session.user.id          │
│ 3. DELETE: prisma.kanbanCard.delete({ where: { id } })      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Segurança e Validações

### ✅ **Autenticação**
- Todas as rotas verificam `getServerSession(authOptions)`
- Retorna `401 Unauthorized` se não autenticado

### ✅ **Autorização**
- Verifica se o recurso pertence ao usuário logado
- Exemplo: `board.userId === session.user.id`

### ✅ **Validação de Dados**
- Campos obrigatórios: `title`, `name`, etc.
- Sanitização: `.trim()`, `String()`, `Array.isArray()`
- Posição automática: calcula `max(position) + 1`

---

## 🔄 Sincronização Frontend ↔ Backend

### **Estado Atual:**

```
Frontend (Zustand Store)
    ↓
PouchDB (IndexedDB Local) ✅ FUNCIONANDO
    ↓
syncWithAPI() ⚠️ TODO - NÃO IMPLEMENTADO
    ↓
API Routes ✅ PRONTAS (mas não conectadas)
    ↓
Prisma → PostgreSQL ✅ FUNCIONANDO
```

### **O que falta:**

1. **Implementar `syncWithAPI()` em `lib/pouchdb.ts`:**
   ```typescript
   export const syncWithAPI = async (boardId: string, data: any) => {
     // Fazer fetch para /api/kanban/[boardId]/columns (POST cards)
     // Fazer fetch para /api/kanban/[boardId]/cards (POST/PATCH)
   }
   ```

2. **Carregar dados do servidor ao iniciar:**
   - Fazer GET /api/boards ao carregar página
   - Fazer GET /api/kanban/[boardId]/columns ao selecionar board

---

## 📝 Exemplos Práticos

### **Criar um Board via API:**

```bash
POST /api/boards
Headers: Cookie: next-auth.session-token=...
Body: { "name": "Meu Novo Board" }

Response: { 
  "board": { 
    "id": "clx123...", 
    "userId": "user123...", 
    "name": "Meu Novo Board",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### **Criar um Card via API:**

```bash
POST /api/kanban/clx123.../cards
Headers: Cookie: next-auth.session-token=...
Body: {
  "title": "Nova Tarefa",
  "description": "Descrição da tarefa",
  "columnId": "col456...",
  "tags": ["urgente", "frontend"],
  "priority": "high"
}

Response: {
  "card": {
    "id": "card789...",
    "columnId": "col456...",
    "title": "Nova Tarefa",
    "position": 0,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### **Atualizar um Card via API:**

```bash
PATCH /api/kanban/clx123.../cards
Headers: Cookie: next-auth.session-token=...
Body: {
  "id": "card789...",
  "title": "Tarefa Atualizada",
  "newColumnId": "col999..."  // Mover para outra coluna
}

Response: {
  "card": {
    "id": "card789...",
    "columnId": "col999...",  // Nova coluna
    "title": "Tarefa Atualizada",
    "position": 0  // Nova posição
  }
}
```

---

## 🎯 Resumo

### ✅ **O que está funcionando:**
- ✅ Prisma schema definido
- ✅ API Routes implementadas (POST, GET, PATCH, DELETE)
- ✅ Autenticação e validação de segurança
- ✅ PouchDB salvando localmente
- ✅ Zustand gerenciando estado

### ⚠️ **O que falta:**
- ⚠️ Conectar frontend com API (syncWithAPI)
- ⚠️ Carregar dados do servidor ao iniciar
- ⚠️ Sincronização bidirecional (local ↔ servidor)

---

## 🚀 Próximos Passos

1. Implementar `syncWithAPI()` para enviar dados locais ao servidor
2. Adicionar `loadFromAPI()` para buscar dados do servidor
3. Implementar resolução de conflitos (local vs servidor)
4. Adicionar indicadores de sincronização na UI

