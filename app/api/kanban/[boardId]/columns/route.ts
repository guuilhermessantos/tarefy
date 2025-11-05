import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: { boardId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const board = await prisma.board.findFirst({ where: { id: params.boardId, userId: session.user.id } });
  if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 });

  const columns = await prisma.kanbanColumn.findMany({
    where: { boardId: board.id },
    orderBy: { position: 'asc' },
    include: { cards: { orderBy: { position: 'asc' } } },
  });

  return NextResponse.json({ columns });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { boardId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const board = await prisma.board.findFirst({ where: { id: params.boardId, userId: session.user.id } });
  if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 });

  const body = await req.json();
  const title = (body?.title || '').toString().trim();
  const color = body?.color ? String(body.color) : null;
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

  const maxPosition = await prisma.kanbanColumn.aggregate({
    where: { boardId: board.id },
    _max: { position: true },
  });

  const column = await prisma.kanbanColumn.create({
    data: {
      boardId: board.id,
      title,
      color: color || undefined,
      position: (maxPosition._max.position ?? -1) + 1,
    },
  });

  return NextResponse.json({ column }, { status: 201 });
}
