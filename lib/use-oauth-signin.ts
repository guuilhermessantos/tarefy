'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getAbsoluteCallbackUrl,
  isOAuthPopupMessage,
  normalizeCallback,
  OAUTH_POPUP_NAME,
  openOAuthPopup,
  startOAuthSignIn,
  type OAuthProvider,
} from '@/lib/oauth';

const POPUP_BLOCKED_MESSAGE =
  'Não foi possível abrir a janela de login. Verifique se o navegador está bloqueando pop-ups.';
const START_FAILED_MESSAGE = 'Não foi possível iniciar o login OAuth. Tente novamente.';

/**
 * Abre o login/cadastro OAuth (GitHub/Google) numa janela popup, mantendo a página atual intacta.
 * A popup termina o fluxo em `/auth/popup-callback`, que avisa esta janela via `postMessage`
 * e se fecha sozinha; então navegamos para o destino final (ex.: /board).
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
    (provider: OAuthProvider) => async () => {
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
      const popupCallbackUrl = getAbsoluteCallbackUrl(
        `/auth/popup-callback?next=${encodeURIComponent(destination)}`,
      );

      try {
        await startOAuthSignIn(provider, popupCallbackUrl, OAUTH_POPUP_NAME);
      } catch {
        popup.close();
        stopWatchingPopup();
        setError(START_FAILED_MESSAGE);
        return;
      }

      pollRef.current = window.setInterval(() => {
        if (popup.closed) stopWatchingPopup();
      }, 500);
    },
    [defaultDestination, stopWatchingPopup],
  );

  return { signIn, loadingProvider, error, setError };
}
