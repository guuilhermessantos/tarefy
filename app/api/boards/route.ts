import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/api-auth';

export const runtime = 'nodejs';

const DEFAULT_COLUMNS = [
  { title: 'A Fazer', color: '#ef4444', position: 0 },
  { title: 'Fazendo', color: '#f59e0b', position: 1 },
  { title: 'Feito', color: '#10b981', position: 2 },
];

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const boards = await prisma.board.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ boards });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const name = (body?.name || '').toString().trim();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const board = await prisma.board.create({
    data: {
      userId: auth.user.id,
      name,
      columns: {
        create: DEFAULT_COLUMNS,
      },
    },
    include: { columns: true },
  });

  return NextResponse.json({ board }, { status: 201 });
}
