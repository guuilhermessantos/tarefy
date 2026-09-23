import '@/lib/normalize-nextauth-url';
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { consumeLastOAuthError } from '@/lib/auth-last-error';

const nextAuthHandler = NextAuth(authOptions);

export const runtime = 'nodejs';

/**
 * GitHub passou a devolver `iss=https://github.com/login/oauth` no callback (RFC 9207).
 * No next-auth v4 / openid-client isso dispara:
 *   OAuthCallbackError: issuer must be configured on the issuer
 * Google (OIDC completo) não tem o problema. Removemos `iss` só no callback do GitHub.
 */
function requestWithoutGithubIss(req: Request): Request {
  const url = new URL(req.url);
  if (!url.pathname.includes('/callback/github') || !url.searchParams.has('iss')) {
    return req;
  }

  url.searchParams.delete('iss');
  // Callback do GitHub é GET — só precisamos da URL sem `iss`.
  return new Request(url.toString(), {
    method: 'GET',
    headers: req.headers,
  });
}

async function withCallbackDiagnostics(req: Request, context: unknown) {
  const originalUrl = new URL(req.url);
  const isGithubCallback = originalUrl.pathname.includes('/callback/github');
  const patchedReq = requestWithoutGithubIss(req);

  if (isGithubCallback) {
    const cookieHeader = req.headers.get('cookie') ?? '';
    console.error('[auth:callback:in]', {
      search: originalUrl.search,
      strippedIss: originalUrl.searchParams.has('iss'),
      hasCode: originalUrl.searchParams.has('code'),
      githubError: originalUrl.searchParams.get('error'),
      hasStateCookie: cookieHeader.includes('next-auth.state'),
    });
  }

  const response = await (nextAuthHandler as (req: Request, ctx: unknown) => Promise<Response>)(
    patchedReq,
    context,
  );

  if (!isGithubCallback || !(response instanceof Response)) {
    return response;
  }

  const location = response.headers.get('location');
  if (!location || !location.includes('error=')) {
    return response;
  }

  try {
    const redirectUrl = new URL(location, originalUrl.origin);
    const cookieHeader = req.headers.get('cookie') ?? '';
    redirectUrl.searchParams.set(
      'hasStateCookie',
      cookieHeader.includes('next-auth.state') ? '1' : '0',
    );
    redirectUrl.searchParams.set('hasCode', originalUrl.searchParams.has('code') ? '1' : '0');

    const cause = consumeLastOAuthError();
    if (cause) redirectUrl.searchParams.set('authCause', cause);

    // Cookie sobrevive ao redirect /api/auth/error → /login (que descarta query extras)
    const res = Response.redirect(
      redirectUrl.toString(),
      response.status as 301 | 302 | 303 | 307 | 308,
    );
    if (cause) {
      res.headers.append(
        'Set-Cookie',
        `tarefy-oauth-cause=${encodeURIComponent(cause)}; Path=/; Max-Age=300; SameSite=Lax; Secure`,
      );
    }
    return res;
  } catch (error) {
    console.error('[auth:callback:diag-failed]', error);
    return response;
  }
}

export async function GET(req: Request, context: unknown) {
  return withCallbackDiagnostics(req, context);
}

export async function POST(req: Request, context: unknown) {
  return withCallbackDiagnostics(req, context);
}
