const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }

  const parsed = new URL(url);
  parsed.searchParams.set('schema', 'public_tarefy');
  return parsed.toString();
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
});

const TEST_USER_EMAIL = 'teste@tarefy.local';

async function resetDatabase() {
  await prisma.verificationToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.kanbanCard.deleteMany();
  await prisma.kanbanColumn.deleteMany();
  await prisma.board.deleteMany();
  await prisma.prompt.deleteMany();
  await prisma.pomodoroSession.deleteMany();
  await prisma.user.deleteMany();
}

async function seedDemoData(userId) {
  await prisma.account.create({
    data: {
      userId,
      type: 'oauth',
      provider: 'github',
      providerAccountId: 'github-12345',
      token_type: 'bearer',
      scope: 'read:user',
    },
  });

  const expires = new Date();
  expires.setDate(expires.getDate() + 30);
  await prisma.session.create({
    data: {
      userId,
      sessionToken: 'session-token-123',
      expires,
    },
  });

  const vtExpires = new Date();
  vtExpires.setHours(vtExpires.getHours() + 2);
  await prisma.verificationToken.create({
    data: {
      identifier: TEST_USER_EMAIL,
      token: 'verification-token-abc',
      expires: vtExpires,
    },
  });

  const board = await prisma.board.create({
    data: {
      userId,
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

  await prisma.prompt.createMany({
    data: [
      {
        userId,
        title: 'Ideias para foco',
        content: 'Liste 5 formas de melhorar o foco hoje.',
        tags: ['foco', 'produtividade'],
      },
      {
        userId,
        title: 'Revisão diária',
        content: 'Quais foram os 3 maiores aprendizados do dia?',
        tags: ['reflexão'],
      },
    ],
  });

  const now = new Date();
  await prisma.pomodoroSession.createMany({
    data: [
      {
        userId,
        taskId: null,
        taskTitle: 'Leitura de documentação',
        mode: 'focus',
        duration: 25,
        completedAt: now,
        completed: true,
      },
      {
        userId,
        taskId: null,
        taskTitle: 'Pausa curta',
        mode: 'shortBreak',
        duration: 5,
        completedAt: now,
        completed: true,
      },
    ],
  });
}

async function main() {
  const existingUser = await prisma.user.findUnique({
    where: { email: TEST_USER_EMAIL },
  });

  if (existingUser) {
    console.log('Seed: usuário de teste já existe, nada a fazer.');
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    await resetDatabase();
  }

  const user = await prisma.user.create({
    data: {
      name: 'Usuário de Teste',
      email: TEST_USER_EMAIL,
      image: null,
      passwordHash: await hash('senha123', 10),
    },
  });

  await seedDemoData(user.id);

  console.log('Seed concluído com sucesso.');
  console.log(`Login: ${TEST_USER_EMAIL} / senha123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
