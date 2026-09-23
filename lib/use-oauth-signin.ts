'use client';

import { useCallback, useState } from 'react';
import { normalizeCallback, type OAuthProvider } from '@/lib/oauth';

/**
 * Inicia OAuth com POST de formulário (navegação real do browser).
 * Evita o bug do next-auth/react (fetch + json) em que o cookie `state`
 * às vezes não é gravado e o callback volta com error=OAuthCallback.
 */
async function startOAuthWithForm(provider: OAuthProvider, callbackUrl: string) {
  const response = await fetch('/api/auth/csrf', { credentials: 'same-origin' });
  if (!response.ok) {
    throw new Error('csrf');
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
        // Absolute URL no mesmo origin — NextAuth valida e seta cookies no 302.
        const absoluteCallback = `${window.location.origin}${callbackUrl}`;
        await startOAuthWithForm(provider, absoluteCallback);
      } catch {
        setLoadingProvider(null);
        setError('Não foi possível iniciar o login OAuth. Tente novamente.');
      }
    },
    [defaultDestination],
  );

  return { signIn: signInWithProvider, loadingProvider, error, setError };
}
