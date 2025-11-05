'use client';

import { useBoardStore } from '@/lib/store';
import { Wifi, WifiOff } from 'lucide-react';
import { useEffect } from 'react';

export function Header() {
  const { isOnline, setIsOnline } = useBoardStore();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground">Tarefy</h1>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Offline</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

