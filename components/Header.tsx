'use client';

import { useEffect } from 'react';
import { useBoardStore } from '@/lib/store';
import { Wifi, WifiOff, LogOut, User, CloudUpload } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { getPendingSyncCount, subscribePendingSyncCount } from '@/lib/sync-queue';

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function Header() {
  const { isOnline, setIsOnline, isSaving } = useBoardStore();
  const { data: session } = useSession();
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const pendingSync = useSyncExternalStore(
    subscribePendingSyncCount,
    getPendingSyncCount,
    () => 0
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground">Tarefy</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {mounted && (
            <div className="flex items-center gap-2 text-sm">
              {isSaving ? (
                <>
                  <CloudUpload className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-muted-foreground">Sincronizando...</span>
                </>
              ) : isOnline ? (
                <>
                  <Wifi className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">
                    Online{pendingSync > 0 ? ` (${pendingSync} pendente${pendingSync > 1 ? 's' : ''})` : ''}
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Offline</span>
                </>
              )}
            </div>
          )}

          {session?.user && (
            <div className="flex items-center gap-3 border-l border-border/50 pl-4">
              <div className="flex items-center gap-2">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
                <span className="text-sm text-foreground">
                  {session.user.name || session.user.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

