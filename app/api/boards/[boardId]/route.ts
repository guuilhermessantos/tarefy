import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getAuthUser, getOwnedBoard } from '@/lib/api-auth';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ boardId: string }> }) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { boardId } = await params;
  const board = await getOwnedBoard(boardId, auth.user.id);
  if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 });

  return NextResponse.json({ board });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ boardId: string }> }) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { boardId } = await params;
  const board = await getOwnedBoard(boardId, auth.user.id);
  if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 });

  const body = await req.json();
  const updates: { name?: string; flowData?: Prisma.InputJsonValue } = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    updates.name = name;
  }

  if (body.flowData !== undefined) {
    updates.flowData = body.flowData as Prisma.InputJsonValue;
  }

  const updated = await prisma.board.update({ where: { id: boardId }, data: updates });
  return NextResponse.json({ board: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ boardId: string }> }) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { boardId } = await params;
  const board = await getOwnedBoard(boardId, auth.user.id);
  if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 });

  await prisma.board.delete({ where: { id: boardId } });
  return NextResponse.json({ ok: true });
}
