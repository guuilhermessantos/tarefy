import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/api-auth';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const prompts = await prisma.prompt.findMany({
    where: { userId: auth.user.id },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ prompts });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const title = (body?.title || '').toString().trim();
  const content = (body?.content || '').toString().trim();
  if (!title || !content) return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });

  const prompt = await prisma.prompt.create({
    data: {
      userId: auth.user.id,
      title,
      content,
      tags: Array.isArray(body.tags) ? body.tags.map((t: unknown) => String(t)) : [],
    },
  });

  return NextResponse.json({ prompt }, { status: 201 });
}
