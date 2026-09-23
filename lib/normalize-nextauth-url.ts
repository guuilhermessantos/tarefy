/** Deve ser importado ANTES de `next-auth` — barra final em NEXTAUTH_URL quebra OAuth. */
const raw = process.env.NEXTAUTH_URL?.trim();
if (raw) {
  const normalized = raw.replace(/\/+$/, '');
  if (normalized !== raw) {
    process.env.NEXTAUTH_URL = normalized;
  }
}

export {};
