'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  isOAuthPopupMessage,
  normalizeCallback,
  OAUTH_POPUP_NAME,
  openOAuthPopup,
  type OAuthProvider,
} from '@/lib/oauth';

const POPUP_BLOCKED_MESSAGE =
  'Não foi possível abrir a janela de login. Verifique se o navegador está bloqueando pop-ups.';

/**
 * Abre o login/cadastro OAuth (GitHub/Google) numa janela popup.
 * O OAuth começa em `/auth/popup-start` (dentro do popup) para cookies CSRF/state
 * ficarem corretos; termina em `/auth/popup-callback`, que avisa esta janela via
 * `postMessage` e se fecha.
 */
export function useOAuthSignIn(defaultDestination = '/board') {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState('');
  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<number | null>(null);

  const stopWatchingPopup = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    popupRef.current = null;
    setLoadingProvider(null);
  }, []);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || !isOAuthPopupMessage(event.data)) return;

      stopWatchingPopup();

      if (event.data.error) {
        setError(event.data.error);
        return;
      }
      window.location.assign(event.data.next || defaultDestination);
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [defaultDestination, stopWatchingPopup]);

  useEffect(() => stopWatchingPopup, [stopWatchingPopup]);

  const signIn = useCallback(
    (provider: OAuthProvider) => () => {
      setError('');
      setLoadingProvider(provider);

      const popup = openOAuthPopup();
      if (!popup) {
        setLoadingProvider(null);
        setError(POPUP_BLOCKED_MESSAGE);
        return;
      }
      popupRef.current = popup;

      const requestedCallback = new URLSearchParams(window.location.search).get('callbackUrl');
      const destination = normalizeCallback(requestedCallback, defaultDestination);
      const startUrl =
        `/auth/popup-start?provider=${encodeURIComponent(provider)}` +
        `&next=${encodeURIComponent(destination)}`;

      // Navega o popup no mesmo gesto do clique (evita bloqueio e CSRF cruzado entre janelas).
      popup.location.href = startUrl;
      popup.focus();

      pollRef.current = window.setInterval(() => {
        if (popup.closed) stopWatchingPopup();
      }, 500);
    },
    [defaultDestination, stopWatchingPopup],
  );

  return { signIn, loadingProvider, error, setError };
}
