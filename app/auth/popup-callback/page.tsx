'use client';

import { useEffect } from 'react';
import { notifyOpenerAndClose } from '@/lib/oauth';

/**
 * Página intermediária carregada dentro do popup de OAuth depois que o NextAuth conclui o login
 * com sucesso. Ela só existe para avisar a janela principal (via `postMessage`) e se fechar —
 * o usuário nunca deveria "ver" essa tela por mais que um instante.
 */
export default function OAuthPopupCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next') || '/board';
    const notified = notifyOpenerAndClose({ next });

    if (!notified) {
      window.location.replace(next);
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Finalizando login…
    </div>
  );
}
