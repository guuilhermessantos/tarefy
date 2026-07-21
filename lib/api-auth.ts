import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function getAuthUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return null;

  return { session, user };
}

export async function getOwnedBoard(boardId: string, userId: string) {
  return prisma.board.findFirst({ where: { id: boardId, userId } });
}
