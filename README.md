# Tarefy

Gerenciador de tarefas offline-first com canvas visual interativo.

## 🚀 Características

- **Canvas Visual Interativo**: Crie e conecte tarefas visualmente usando React Flow
- **Offline-First**: Funciona completamente offline com PouchDB (IndexedDB)
- **Design Moderno**: Interface dark com cores neon sutis
- **Persistência Automática**: Salva automaticamente todas as mudanças
- **Exportação**: Exporte seus fluxos em JSON

## 🛠️ Tecnologias

- **Next.js 14** (App Router)
- **TypeScript**
- **React Flow** - Canvas visual
- **PouchDB** - Armazenamento offline
- **Zustand** - Gerenciamento de estado
- **Framer Motion** - Animações
- **TailwindCSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Lucide Icons** - Ícones

## 📦 Instalação

```bash
npm install
```

## 🏃 Executar

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 🎨 Design

- **Fundo**: `#0F0F10` (cinza escuro)
- **Primário**: `#00E091` (verde neon)
- **Secundário**: `#7B61FF` (roxo elegante)
- **Tipografia**: Geist Sans (peso médio)

## 📝 Funcionalidades

1. **Dashboard**: Página inicial minimalista
2. **Canvas Board**: Crie, edite e conecte tarefas
3. **Persistência Local**: Tudo salvo automaticamente no IndexedDB
4. **Status Online/Offline**: Indicador de conexão
5. **Exportação**: Baixe seus fluxos em JSON

## 🔮 Próximos Passos

- [ ] Sincronização com API/Backend
- [ ] Múltiplos quadros
- [ ] Drag & drop de arquivos
- [ ] Notificações
- [ ] Compartilhamento de quadros

## ☁️ Neon + Prisma + Auth.js (NextAuth) Setup

1. Crie um banco no Neon e copie o `DATABASE_URL` (use sslmode=require).
2. Configure variáveis de ambiente (Vercel/Local):
   - `DATABASE_URL`
   - `AUTH_SECRET` (use uma string aleatória forte)
   - `NEXTAUTH_URL` (ex.: http://localhost:3000 em dev)
   - `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` (opcional)
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (opcional)
3. Instale dependências e gere o client Prisma:

```bash
npm install
npm run prisma:generate
```

4. Rode as migrações (em dev):

```bash
npm run prisma:migrate
```

5. Inicie a aplicação:

```bash
npm run dev
```

### Deploy na Vercel
- Adicione as mesmas envs no projeto Vercel.
- O `postinstall` roda `prisma generate` automaticamente.
- Rotas que tocam o banco rodam com `runtime = 'nodejs'`.
