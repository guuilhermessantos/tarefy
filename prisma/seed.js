 
const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Clean existing data for a deterministic seed
  await prisma.verificationToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.kanbanCard.deleteMany();
  await prisma.kanbanColumn.deleteMany();
  await prisma.board.deleteMany();
  await prisma.prompt.deleteMany();
  await prisma.pomodoroSession.deleteMany();
  await prisma.user.deleteMany();

  // Create base user with credentials (password: "senha123")
  const user = await prisma.user.create({
    data: {
      name: 'Usuário de Teste',
      email: 'teste@tarefy.local',
      image: null,
      passwordHash: await hash('senha123', 10),
    },
  });

  // Create an auth account (mock)
  await prisma.account.create({
    data: {
      userId: user.id,
      type: 'oauth',
      provider: 'github',
      providerAccountId: 'github-12345',
      token_type: 'bearer',
      scope: 'read:user',
    },
  });

  // Create a session (expires in 30 days)
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);
  await prisma.session.create({
    data: {
      userId: user.id,
      sessionToken: 'session-token-123',
      expires,
    },
  });

  // Create a verification token (example)
  const vtExpires = new Date();
  vtExpires.setHours(vtExpires.getHours() + 2);
  await prisma.verificationToken.create({
    data: {
      identifier: 'teste@tarefy.local',
      token: 'verification-token-abc',
      expires: vtExpires,
    },
  });

  // Create Board with Columns and Cards
  const board = await prisma.board.create({
    data: {
      userId: user.id,
      name: 'Board de Teste',
    },
  });

  const todoColumn = await prisma.kanbanColumn.create({
    data: {
      boardId: board.id,
      title: 'A Fazer',
      color: '#ef4444',
      position: 0,
    },
  });

  const doingColumn = await prisma.kanbanColumn.create({
    data: {
      boardId: board.id,
      title: 'Fazendo',
      color: '#f59e0b',
      position: 1,
    },
  });

  const doneColumn = await prisma.kanbanColumn.create({
    data: {
      boardId: board.id,
      title: 'Feito',
      color: '#10b981',
      position: 2,
    },
  });

  await prisma.kanbanCard.createMany({
    data: [
      {
        columnId: todoColumn.id,
        title: 'Configurar ambiente',
        description: 'Instalar dependências e configurar variáveis de ambiente',
        tags: ['setup', 'dev'],
        priority: 'alta',
        position: 0,
      },
      {
        columnId: doingColumn.id,
        title: 'Implementar autenticação',
        description: 'Integrar NextAuth com Prisma',
        tags: ['auth'],
        priority: 'média',
        position: 0,
      },
      {
        columnId: doneColumn.id,
        title: 'Criar estrutura inicial',
        description: 'Criar projeto Next.js com Tailwind',
        tags: ['scaffold'],
        priority: 'baixa',
        position: 0,
      },
    ],
  });

  // Create Prompts
  await prisma.prompt.createMany({
    data: [
      {
        userId: user.id,
        title: 'Ideias para foco',
        content: 'Liste 5 formas de melhorar o foco hoje.',
        tags: ['foco', 'produtividade'],
      },
      {
        userId: user.id,
        title: 'Revisão diária',
        content: 'Quais foram os 3 maiores aprendizados do dia?',
        tags: ['reflexão'],
      },
    ],
  });

  // Create Pomodoro Sessions
  const now = new Date();
  await prisma.pomodoroSession.createMany({
    data: [
      {
        userId: user.id,
        taskId: null,
        taskTitle: 'Leitura de documentação',
        mode: 'focus',
        duration: 25,
        completedAt: now,
        completed: true,
      },
      {
        userId: user.id,
        taskId: null,
        taskTitle: 'Pausa curta',
        mode: 'shortBreak',
        duration: 5,
        completedAt: now,
        completed: true,
      },
    ],
  });

  console.log('Seed concluído com sucesso.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


