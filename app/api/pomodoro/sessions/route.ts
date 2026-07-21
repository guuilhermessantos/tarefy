import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/api-auth';
import { PomodoroMode } from '@prisma/client';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessions = await prisma.pomodoroSession.findMany({
    where: { userId: auth.user.id },
    orderBy: { completedAt: 'desc' },
    take: 200,
  });

  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const mode = String(body.mode || 'focus') as PomodoroMode;
  const duration = Number(body.duration || 0);
  const completedAt = body.completedAt ? new Date(body.completedAt) : new Date();

  if (!duration) return NextResponse.json({ error: 'Duration is required' }, { status: 400 });

  const session = await prisma.pomodoroSession.create({
    data: {
      userId: auth.user.id,
      taskId: body.taskId ? String(body.taskId) : null,
      taskTitle: body.taskTitle ? String(body.taskTitle) : null,
      mode,
      duration,
      completedAt,
      completed: body.completed !== false,
    },
  });

  return NextResponse.json({ session }, { status: 201 });
}
