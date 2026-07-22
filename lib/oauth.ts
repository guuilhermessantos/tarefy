export type OAuthProvider = 'github' | 'google';

/** OAuth no NextAuth v4 exige POST com CSRF — GET em /api/auth/signin/github gera ?error=github */
export async function startOAuthSignIn(provider: OAuthProvider, callbackUrl: string) {
  const response = await fetch('/api/auth/csrf');
  if (!response.ok) {
    throw new Error('Não foi possível obter o token CSRF.');
  }

  const { csrfToken } = (await response.json()) as { csrfToken: string };

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = `/api/auth/signin/${provider}`;
  form.style.display = 'none';

  const csrfInput = document.createElement('input');
  csrfInput.type = 'hidden';
  csrfInput.name = 'csrfToken';
  csrfInput.value = csrfToken;
  form.appendChild(csrfInput);

  const callbackInput = document.createElement('input');
  callbackInput.type = 'hidden';
  callbackInput.name = 'callbackUrl';
  callbackInput.value = callbackUrl;
  form.appendChild(callbackInput);

  document.body.appendChild(form);
  form.submit();
}

export function getAbsoluteCallbackUrl(path: string): string {
  const normalized = normalizeCallback(path);
  if (typeof window === 'undefined') return normalized;
  return `${window.location.origin}${normalized}`;
}

export function getAuthErrorMessage(error: string): string {
  const messages: Record<string, string> = {
    github:
      'Falha ao iniciar login GitHub. Tente novamente — se persistir, confira NEXTAUTH_URL e callback URL.',
    google:
      'Google OAuth não configurado no servidor. Confira GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET na Vercel e faça redeploy.',
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
