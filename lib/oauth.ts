export type OAuthProvider = 'github' | 'google';

/** Nome da janela popup de OAuth — usado para abrir/focar a mesma janela. */
export const OAUTH_POPUP_NAME = 'tarefy-oauth-popup';

/** Identifica mensagens de `postMessage` trocadas entre o popup de OAuth e a janela principal. */
const OAUTH_MESSAGE_SOURCE = 'tarefy-oauth';

export interface OAuthPopupMessage {
  source: typeof OAUTH_MESSAGE_SOURCE;
  error?: string | null;
  next: string;
}

/** Abre (ou foca, se já existir) a janela pequena onde o fluxo de OAuth vai rodar. */
export function openOAuthPopup(): Window | null {
  const width = 480;
  const height = 640;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  return window.open(
    '',
    OAUTH_POPUP_NAME,
    `width=${width},height=${height},left=${Math.max(left, 0)},top=${Math.max(top, 0)},resizable=yes,scrollbars=yes`,
  );
}

/**
 * Chamado pela janela popup (na página de callback ou de erro) para avisar a janela que a abriu
 * que o login terminou, e então se fechar. Retorna `false` quando a página não está numa popup
 * (ex.: usuário abriu o link direto), permitindo o caller seguir com um fallback normal.
 */
export function notifyOpenerAndClose(payload: { error?: string | null; next: string }): boolean {
  if (typeof window === 'undefined' || !window.opener || window.opener === window) {
    return false;
  }

  const message: OAuthPopupMessage = { source: OAUTH_MESSAGE_SOURCE, ...payload };
  window.opener.postMessage(message, window.location.origin);
  window.close();
  return true;
}

export function isOAuthPopupMessage(data: unknown): data is OAuthPopupMessage {
  return typeof data === 'object' && data !== null && (data as { source?: unknown }).source === OAUTH_MESSAGE_SOURCE;
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
      'Falha ao trocar o código OAuth (quase sempre GITHUB_CLIENT_SECRET errado na Vercel). Regenere o secret no GitHub → cole em GITHUB_CLIENT_SECRET → Redeploy. Confira também /api/auth/health',
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
