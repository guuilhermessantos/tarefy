'use client';

import { useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { getAbsoluteCallbackUrl, normalizeCallback, type OAuthProvider } from '@/lib/oauth';

const PROVIDERS = new Set<OAuthProvider>(['github', 'google']);

/**
 * Roda DENTRO do popup. Inicia o OAuth daqui para que cookies CSRF/state
 * fiquem no mesmo contexto da janela que recebe o retorno do GitHub/Google.
 * (POST com form.target a partir da janela pai quebra o state em produção.)
 */
export default function OAuthPopupStartPage() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.search);
    const providerParam = params.get('provider');
    const provider = PROVIDERS.has(providerParam as OAuthProvider)
      ? (providerParam as OAuthProvider)
      : null;
    const next = normalizeCallback(params.get('next'), '/board');

    if (!provider) {
      window.location.replace(`/login?error=Configuration`);
      return;
    }

    const callbackUrl = getAbsoluteCallbackUrl(
      `/auth/popup-callback?next=${encodeURIComponent(next)}`,
    );

    void signIn(provider, { callbackUrl, redirect: true });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Redirecionando para login…
    </div>
  );
}
