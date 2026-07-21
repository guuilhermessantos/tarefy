'use client';

import { SessionProvider } from 'next-auth/react';
import { SyncProvider } from '@/components/SyncProvider';

export function SessionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SyncProvider>{children}</SyncProvider>
    </SessionProvider>
  );
}

