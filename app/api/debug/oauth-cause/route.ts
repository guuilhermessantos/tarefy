import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE = 'tarefy-oauth-cause';

/** Lê (e apaga) a causa do último erro OAuth gravada no callback. */
export async function GET(req: NextRequest) {
  const cause = req.cookies.get(COOKIE)?.value ?? null;
  const res = NextResponse.json({ cause });
  if (cause) {
    res.cookies.set(COOKIE, '', { path: '/', maxAge: 0 });
  }
  return res;
}
