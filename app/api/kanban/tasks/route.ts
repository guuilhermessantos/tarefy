import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/api-auth';

export const runtime = 'nodejs';

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const boards = await prisma.board.findMany({
    where: { userId: auth.user.id },
    include: {
      columns: {
        orderBy: { position: 'asc' },
        include: {
          cards: { orderBy: { position: 'asc' } },
        },
      },
    },
  });

  const cards = boards.flatMap((board) =>
    board.columns.flatMap((column) =>
      column.cards.map((card) => ({
        id: card.id,
        title: card.title,
        description: card.description,
        columnId: column.id,
        columnTitle: column.title,
        isDone: /feito|done|conclu/i.test(column.title),
      }))
    )
  );

  return NextResponse.json({ cards });
}
