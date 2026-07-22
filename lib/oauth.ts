export type OAuthProvider = 'github' | 'google';

export function getOAuthSignInUrl(provider: OAuthProvider, callbackUrl: string) {
  const params = new URLSearchParams({ callbackUrl });
  return `/api/auth/signin/${provider}?${params.toString()}`;
}

export function getAuthErrorMessage(error: string): string {
  const messages: Record<string, string> = {
    Configuration:
      'OAuth mal configurado. Confira NEXTAUTH_URL, GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET na Vercel.',
    AccessDenied: 'Login cancelado ou acesso negado.',
    Verification: 'Link de verificação inválido ou expirado.',
    OAuthSignin: 'Não foi possível iniciar o login OAuth.',
    OAuthCallback:
      'Erro no retorno do GitHub/Google. Verifique se a callback URL no OAuth App bate com NEXTAUTH_URL.',
    OAuthCreateAccount: 'Não foi possível criar a conta com OAuth.',
    Callback: 'Erro no callback de autenticação.',
    CredentialsSignin: 'Email ou senha inválidos.',
    Default: 'Erro ao entrar. Tente novamente.',
  };

  return messages[error] ?? messages.Default;
}

export function normalizeCallback(param: string | null, fallback = '/board'): string {
  try {
    if (!param) return fallback;
    if (param.includes('://')) {
      const url = new URL(param);
      if (typeof window !== 'undefined' && url.origin === window.location.origin) {
        return url.pathname + url.search;
      }
      return fallback;
    }
    return param.startsWith('/') ? param : `/${param}`;
  } catch {
    return fallback;
  }
}
