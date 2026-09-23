/** Erro OAuth da requisição atual (mesmo isolate da Vercel). */
let lastOAuthError: string | null = null;

export function setLastOAuthError(message: string) {
  lastOAuthError = message.slice(0, 300);
}

export function consumeLastOAuthError(): string | null {
  const value = lastOAuthError;
  lastOAuthError = null;
  return value;
}
