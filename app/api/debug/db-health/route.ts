import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/** Diagnóstico de banco (sem dados sensíveis). */
export async function GET() {
  try {
    const [users, accounts] = await Promise.all([
      prisma.user.count(),
      prisma.account.count(),
    ]);

    return NextResponse.json({
      ok: true,
      users,
      accounts,
      schemaHint: 'public_tarefy',
    });
  } catch (error) {
    console.error('[db-health]', error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : 'erro desconhecido',
        name: error instanceof Error ? error.name : typeof error,
      },
      { status: 500 },
    );
  }
}
