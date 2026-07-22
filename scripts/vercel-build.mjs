import { execSync } from 'node:child_process';

function run(cmd, options = {}) {
  console.log(`\n>> ${cmd}\n`);
  execSync(cmd, { stdio: 'inherit', env: process.env, ...options });
}

function tryRun(cmd) {
  try {
    execSync(cmd, { stdio: 'pipe', env: process.env });
    return true;
  } catch {
    return false;
  }
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set in Vercel Environment Variables.');
  process.exit(1);
}

if (!process.env.DIRECT_URL && process.env.DATABASE_URL.includes('-pooler')) {
  process.env.DIRECT_URL = process.env.DATABASE_URL.replace('-pooler', '');
  console.log('Derived DIRECT_URL from DATABASE_URL for Neon migrations.');
}

if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
  console.warn('WARN: DIRECT_URL not set, using DATABASE_URL for migrations.');
}

const cleanupSql = `
DROP TABLE IF EXISTS "public"."PomodoroSession" CASCADE;
DROP TABLE IF EXISTS "public"."Prompt" CASCADE;
DROP TABLE IF EXISTS "public"."KanbanCard" CASCADE;
DROP TABLE IF EXISTS "public"."KanbanColumn" CASCADE;
DROP TABLE IF EXISTS "public"."Board" CASCADE;
DROP TABLE IF EXISTS "public"."VerificationToken" CASCADE;
DROP TABLE IF EXISTS "public"."Session" CASCADE;
DROP TABLE IF EXISTS "public"."Account" CASCADE;
DROP TABLE IF EXISTS "public"."User" CASCADE;
DROP TYPE IF EXISTS "public"."PomodoroMode" CASCADE;
`;

console.log('Cleaning partial objects from failed init migration...');
try {
  run('npx prisma db execute --stdin --schema prisma/schema.prisma', {
    input: cleanupSql,
    stdio: ['pipe', 'inherit', 'inherit'],
  });
} catch {
  console.warn('Cleanup skipped (database may already be clean).');
}

const failedMigrations = ['20260721154207_init'];
for (const migration of failedMigrations) {
  console.log(`Marking failed migration as rolled back: ${migration}`);
  tryRun(`npx prisma migrate resolve --rolled-back ${migration}`);
}

run('npx prisma migrate deploy');
run('npx prisma db seed');
run('npx next build');
