# Tarefy

Gerenciador de tarefas offline-first com canvas visual interativo, Kanban, Pomodoro e Prompts — com sincronização via PostgreSQL + NextAuth.

## Características

- **Flow Board**: canvas React Flow com nós, conexões e export JSON
- **Kanban**: colunas, cards, drag-and-drop e sync com API
- **Pomodoro**: timer, stats e integração com tarefas do Kanban
- **Prompts**: biblioteca de prompts com tags e busca
- **Offline-first**: PouchDB/localStorage com fila de sync ao reconectar
- **Auth**: login por email/senha + OAuth (GitHub/Google)

## Stack

- Next.js 16 (App Router) + TypeScript
- Prisma + PostgreSQL
- NextAuth.js
- Zustand + PouchDB
- React Flow + TailwindCSS 4

## Setup local

### 1. Variáveis de ambiente

Copie `.env.example` para `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public_tarefy"
AUTH_SECRET="sua-string-secreta"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Node.js 20+

```bash
nvm use 20
```

### 3. Instalar e migrar

```bash
npm install
npm run prisma:migrate
npm run seed
```

### 4. Rodar

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

### Login de teste (após seed)

- Email: `teste@tarefy.local`
- Senha: `senha123`

## Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Landing |
| `/board` | Flow Board (canvas) |
| `/kanban` | Kanban |
| `/pomodoro` | Timer Pomodoro |
| `/prompts` | Biblioteca de prompts |
| `/settings` | Configurações do Pomodoro |
| `/login`, `/register` | Autenticação |

## APIs

- `/api/boards` — CRUD de boards (+ flowData JSON)
- `/api/kanban/[boardId]/columns` — colunas Kanban
- `/api/kanban/[boardId]/cards` — cards Kanban
- `/api/kanban/tasks` — tarefas para o Pomodoro
- `/api/prompts` — CRUD de prompts
- `/api/pomodoro/sessions` — histórico Pomodoro

## Deploy (Vercel)

1. Configure as envs (`DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`)
2. Use Neon ou outro PostgreSQL
3. O `postinstall` roda `prisma generate` automaticamente
4. Rode `prisma migrate deploy` no banco de produção
