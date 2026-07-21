import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/api-auth';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.prompt.findFirst({ where: { id, userId: auth.user.id } });
  if (!existing) return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });

  const body = await req.json();
  const updates: { title?: string; content?: string; tags?: string[] } = {};

  if (body.title !== undefined) updates.title = String(body.title).trim();
  if (body.content !== undefined) updates.content = String(body.content).trim();
  if (body.tags !== undefined) {
    updates.tags = Array.isArray(body.tags) ? body.tags.map((t: unknown) => String(t)) : [];
  }

  const prompt = await prisma.prompt.update({ where: { id }, data: updates });
  return NextResponse.json({ prompt });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.prompt.findFirst({ where: { id, userId: auth.user.id } });
  if (!existing) return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });

  await prisma.prompt.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
