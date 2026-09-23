import '@/lib/normalize-nextauth-url';
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const nextAuthHandler = NextAuth(authOptions);

export const runtime = 'nodejs';

async function withCallbackDiagnostics(req: Request, context: unknown) {
  const url = new URL(req.url);
  const isGithubCallback = url.pathname.includes('/callback/github');

  if (isGithubCallback) {
    const cookieHeader = req.headers.get('cookie') ?? '';
    const cookieNames = cookieHeader
      .split(';')
      .map((part) => part.trim().split('=')[0])
      .filter(Boolean);

    console.error('[auth:callback:in]', {
      search: url.search,
      hasCode: url.searchParams.has('code'),
      hasStateParam: url.searchParams.has('state'),
      githubError: url.searchParams.get('error'),
      githubErrorDescription: url.searchParams.get('error_description'),
      hasStateCookie: cookieNames.some((name) => name.includes('next-auth.state')),
      cookieNames,
    });
  }

  // next-auth App Router handler
  const response = await (nextAuthHandler as (req: Request, ctx: unknown) => Promise<Response>)(
    req,
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
    const redirectUrl = new URL(location, url.origin);
    const cookieHeader = req.headers.get('cookie') ?? '';
    const hasStateCookie = cookieHeader.includes('next-auth.state');

    redirectUrl.searchParams.set('hasStateCookie', hasStateCookie ? '1' : '0');
    redirectUrl.searchParams.set('hasCode', url.searchParams.has('code') ? '1' : '0');
    const ghError = url.searchParams.get('error');
    const ghErrorDescription = url.searchParams.get('error_description');
    if (ghError) redirectUrl.searchParams.set('ghError', ghError);
    if (ghErrorDescription) {
      redirectUrl.searchParams.set('ghErrorDescription', ghErrorDescription);
    }

    console.error('[auth:callback:out]', {
      status: response.status,
      location: redirectUrl.toString(),
    });

    return Response.redirect(redirectUrl.toString(), response.status as 301 | 302 | 303 | 307 | 308);
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
