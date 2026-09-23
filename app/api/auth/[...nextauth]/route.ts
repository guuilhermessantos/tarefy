import '@/lib/normalize-nextauth-url';
import NextAuth from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { consumeLastOAuthError } from '@/lib/auth-last-error';

const nextAuthHandler = NextAuth(authOptions);

export const runtime = 'nodejs';

/**
 * GitHub devolve `iss=` no callback (RFC 9207). next-auth v4 / openid-client quebra com:
 *   OAuthCallbackError: issuer must be configured on the issuer
 * Reescrever Request não basta (NextAuth lê a URL original). Redirect 307 sem `iss` resolve.
 */
function redirectWithoutGithubIss(req: NextRequest): NextResponse | null {
  if (!req.nextUrl.pathname.includes('/callback/github')) return null;
  if (!req.nextUrl.searchParams.has('iss')) return null;

  const url = req.nextUrl.clone();
  url.searchParams.delete('iss');
  return NextResponse.redirect(url, 307);
}

async function withCallbackDiagnostics(req: NextRequest, context: unknown) {
  const stripRedirect = redirectWithoutGithubIss(req);
  if (stripRedirect) {
    console.error('[auth:callback] stripping iss via redirect', {
      from: req.nextUrl.search,
      to: stripRedirect.headers.get('location'),
    });
    return stripRedirect;
  }

  const isGithubCallback = req.nextUrl.pathname.includes('/callback/github');
  if (isGithubCallback) {
    console.error('[auth:callback:in]', {
      search: req.nextUrl.search,
      hasCode: req.nextUrl.searchParams.has('code'),
      hasIss: req.nextUrl.searchParams.has('iss'),
    });
  }

  const response = await (nextAuthHandler as (
    req: NextRequest,
    ctx: unknown,
  ) => Promise<Response>)(req, context);

  if (!isGithubCallback || !(response instanceof Response)) {
    return response;
  }

  const location = response.headers.get('location');
  if (!location || !location.includes('error=')) {
    return response;
  }

  try {
    const redirectUrl = new URL(location, req.nextUrl.origin);
    const cause = consumeLastOAuthError();
    if (cause) {
      redirectUrl.searchParams.set('authCause', cause);
      const res = NextResponse.redirect(redirectUrl, response.status as 301 | 302 | 303 | 307 | 308);
      res.cookies.set('tarefy-oauth-cause', cause, {
        path: '/',
        maxAge: 300,
        sameSite: 'lax',
        secure: true,
      });
      return res;
    }
    return response;
  } catch (error) {
    console.error('[auth:callback:diag-failed]', error);
    return response;
  }
}

export async function GET(req: NextRequest, context: unknown) {
  return withCallbackDiagnostics(req, context);
}

export async function POST(req: NextRequest, context: unknown) {
  return withCallbackDiagnostics(req, context);
}
