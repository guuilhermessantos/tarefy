import { NextResponse } from 'next/server';

/**
 * Testa se GITHUB_CLIENT_ID/SECRET da Vercel são aceitos pelo GitHub
 * (sem fazer login). Usa um code inválido de propósito:
 * - incorrect_client_credentials → secret/id errados na Vercel
 * - bad_verification_code → credenciais OK (o problema é outro)
 */
export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID?.trim() ?? '';
  const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim() ?? '';
  const nextAuthUrl = process.env.NEXTAUTH_URL?.trim() ?? '';
  const hasAuthSecret = Boolean(
    (process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET)?.trim(),
  );

  if (!clientId || !clientSecret) {
    return NextResponse.json({
      ok: false,
      diagnosis: 'missing_env',
      message: 'GITHUB_CLIENT_ID ou GITHUB_CLIENT_SECRET ausente na Vercel.',
      nextAuthUrl: nextAuthUrl || null,
      hasAuthSecret,
      hasGithubId: Boolean(clientId),
      hasGithubSecret: Boolean(clientSecret),
    });
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code: 'tarefy-invalid-code-probe',
    redirect_uri: 'https://tarefy.vercel.app/api/auth/callback/github',
  });

  let githubStatus = 0;
  let githubError = 'unknown';
  let githubErrorDescription = '';

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    githubStatus = response.status;
    const data = (await response.json()) as {
      error?: string;
      error_description?: string;
    };
    githubError = data.error ?? 'none';
    githubErrorDescription = data.error_description ?? '';
  } catch (error) {
    return NextResponse.json({
      ok: false,
      diagnosis: 'github_unreachable',
      message: error instanceof Error ? error.message : 'Falha ao falar com GitHub',
      nextAuthUrl: nextAuthUrl || null,
      hasAuthSecret,
    });
  }

  const credentialsOk = githubError === 'bad_verification_code';
  const credentialsBad = githubError === 'incorrect_client_credentials';

  return NextResponse.json({
    ok: credentialsOk,
    diagnosis: credentialsOk
      ? 'credentials_ok'
      : credentialsBad
        ? 'credentials_invalid'
        : `github_error:${githubError}`,
    message: credentialsOk
      ? 'Client ID/Secret OK. O problema NÃO é o secret — olhe NEXTAUTH_URL, cookies ou banco.'
      : credentialsBad
        ? 'GITHUB_CLIENT_ID/SECRET rejeitados pelo GitHub. Cole de novo na Vercel (mesmo app Ov23…) e Redeploy.'
        : `Resposta inesperada do GitHub: ${githubError} (${githubErrorDescription})`,
    nextAuthUrl: nextAuthUrl || null,
    nextAuthUrlOk: nextAuthUrl === 'https://tarefy.vercel.app',
    hasAuthSecret,
    githubIdPrefix: clientId.slice(0, 4),
    githubIdLength: clientId.length,
    githubSecretLength: clientSecret.length,
    githubStatus,
    githubError,
  });
}
