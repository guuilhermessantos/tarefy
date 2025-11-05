import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ boards: [] });

  const boards = await prisma.board.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } });
  return NextResponse.json({ boards });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json();
  const name = (body?.name || '').toString().trim();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const board = await prisma.board.create({ data: { userId: user.id, name } });
  return NextResponse.json({ board }, { status: 201 });
}
