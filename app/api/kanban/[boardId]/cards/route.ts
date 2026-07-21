import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { boardId } = await params;
  const { title, description, columnId, tags, priority } = await req.json();
  if (!title || !columnId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const column = await prisma.kanbanColumn.findFirst({
    where: { id: String(columnId), board: { id: boardId, userId: session.user.id } },
  });
  if (!column) return NextResponse.json({ error: 'Column not found' }, { status: 404 });

  const maxPos = await prisma.kanbanCard.aggregate({
    where: { columnId: column.id },
    _max: { position: true },
  });

  const card = await prisma.kanbanCard.create({
    data: {
      columnId: column.id,
      title: String(title),
      description: description ? String(description) : undefined,
      tags: Array.isArray(tags) ? tags.map((t: unknown) => String(t)) : [],
      priority: priority ? String(priority) : undefined,
      position: (maxPos._max.position ?? -1) + 1,
    },
  });

  return NextResponse.json({ card }, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ boardId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { boardId } = await params;
  const body = await req.json();
  const id = String(body?.id || '');
  if (!id) return NextResponse.json({ error: 'Card id required' }, { status: 400 });

  const card = await prisma.kanbanCard.findUnique({ where: { id } });
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  const column = await prisma.kanbanColumn.findFirst({
    where: { id: card.columnId, board: { id: boardId, userId: session.user.id } },
  });
  if (!column) return NextResponse.json({ error: 'Unauthorized for this board' }, { status: 403 });

  const updates: Prisma.KanbanCardUpdateInput = {};
  if (body.title !== undefined) updates.title = String(body.title);
  if (body.description !== undefined) updates.description = body.description ? String(body.description) : null;
  if (body.tags !== undefined) updates.tags = Array.isArray(body.tags) ? body.tags.map((t: unknown) => String(t)) : [];
  if (body.priority !== undefined) updates.priority = body.priority ? String(body.priority) : null;

  if (body.newColumnId) {
    const newColumn = await prisma.kanbanColumn.findFirst({
      where: { id: String(body.newColumnId), boardId: boardId },
    });
    if (!newColumn) return NextResponse.json({ error: 'New column not found' }, { status: 404 });

    updates.column = { connect: { id: newColumn.id } };
    const maxPos = await prisma.kanbanCard.aggregate({ where: { columnId: newColumn.id }, _max: { position: true } });
    updates.position = (maxPos._max.position ?? -1) + 1;
  }

  const updated = await prisma.kanbanCard.update({ where: { id }, data: updates });
  return NextResponse.json({ card: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ boardId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { boardId } = await params;
  const { searchParams } = new URL(req.url);
  const id = String(searchParams.get('id') || '');
  if (!id) return NextResponse.json({ error: 'Card id required' }, { status: 400 });

  const card = await prisma.kanbanCard.findUnique({ where: { id }, include: { column: { include: { board: true } } } });
  if (!card || card.column.board.id !== boardId || card.column.board.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.kanbanCard.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
