'use client';

import { useCallback, useState } from 'react';
import { signIn } from 'next-auth/react';
import { normalizeCallback, type OAuthProvider } from '@/lib/oauth';

/**
 * Login OAuth na mesma aba (redirect). Mais confiável que popup em produção
 * com NextAuth — evita falha de cookie state/CSRF entre janelas.
 */
export function useOAuthSignIn(defaultDestination = '/board') {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState('');

  const signInWithProvider = useCallback(
    (provider: OAuthProvider) => async () => {
      setError('');
      setLoadingProvider(provider);

      const requestedCallback = new URLSearchParams(window.location.search).get('callbackUrl');
      const callbackUrl = normalizeCallback(requestedCallback, defaultDestination);

      try {
        await signIn(provider, { callbackUrl, redirect: true });
      } catch {
        setLoadingProvider(null);
        setError('Não foi possível iniciar o login OAuth. Tente novamente.');
      }
    },
    [defaultDestination],
  );

  return { signIn: signInWithProvider, loadingProvider, error, setError };
}
