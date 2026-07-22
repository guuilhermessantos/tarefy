export type OAuthProvider = 'github' | 'google';

export function getOAuthSignInUrl(provider: OAuthProvider, callbackUrl: string) {
  const params = new URLSearchParams({ callbackUrl });
  return `/api/auth/signin/${provider}?${params.toString()}`;
}

export function getAbsoluteCallbackUrl(path: string): string {
  const normalized = normalizeCallback(path);
  if (typeof window === 'undefined') return normalized;
  return `${window.location.origin}${normalized}`;
}

export function getAuthErrorMessage(error: string): string {
  const messages: Record<string, string> = {
    Configuration:
      'OAuth mal configurado. Confira NEXTAUTH_URL (URL da Vercel), GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET.',
    AccessDenied: 'Login cancelado ou acesso negado.',
    Verification: 'Link de verificação inválido ou expirado.',
    OAuthSignin: 'Não foi possível iniciar o login OAuth.',
    OAuthCallback:
      'Erro no retorno do GitHub. A callback URL deve ser: https://SEU-DOMINIO.vercel.app/api/auth/callback/github',
    OAuthCreateAccount:
      'Não foi possível criar a conta OAuth. Verifique se o banco (migrations) está OK na Vercel.',
    OAuthAccountNotLinked:
      'Este email já existe com outro método de login. Entre com email/senha ou use o mesmo provider.',
    OAuthEmailRequired:
      'O GitHub/Google não retornou email. Torne seu email público no GitHub ou autorize o escopo de email.',
    EmailSignin: 'Erro ao enviar email de login.',
    Callback: 'Erro no callback de autenticação.',
    CredentialsSignin: 'Email ou senha inválidos.',
    Signin: 'Erro ao iniciar login. Verifique NEXTAUTH_URL e as credenciais OAuth na Vercel.',
    Default:
      'Erro ao entrar. Confira NEXTAUTH_URL, callback URL do GitHub e se o banco de produção está migrado.',
  };

  return messages[error] ?? `${messages.Default} (código: ${error})`;
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
