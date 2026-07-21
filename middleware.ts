import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET });
  const { pathname } = req.nextUrl;

  const needsAuth =
    pathname.startsWith('/board') ||
    pathname.startsWith('/kanban') ||
    pathname.startsWith('/prompts') ||
    pathname.startsWith('/pomodoro') ||
    pathname.startsWith('/settings');

  if (!needsAuth) return NextResponse.next();

  if (!token) {
    const url = new URL('/login', req.url);
    const back = `${req.nextUrl.pathname}${req.nextUrl.search}`;
    url.searchParams.set('callbackUrl', back || '/');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/board/:path*', '/kanban/:path*', '/prompts/:path*', '/pomodoro/:path*', '/settings/:path*'],
};
