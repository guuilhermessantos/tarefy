import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hash } from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email: string | undefined = body?.email;
    const password: string | undefined = body?.password;
    const name: string | undefined = body?.name;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email já cadastrado.' }, { status: 409 });
    }

    const passwordHash = await hash(password, 10);
    await prisma.user.create({ data: { email, name, passwordHash } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Falha ao registrar usuário.' }, { status: 500 });
  }
}




