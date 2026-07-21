'use client';

import { useEffect } from 'react';
import { flushSyncQueue } from '@/lib/sync-queue';
import { api } from '@/lib/api-client';
import { createBoardInAPI, deleteBoardFromAPI, updateBoardInAPI } from '@/lib/pouchdb';
import { useBoardStore } from '@/lib/store';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const setIsOnline = useBoardStore((s) => s.setIsOnline);

  useEffect(() => {
    const flush = () => {
      void flushSyncQueue({
        'create-board': async (payload) => !!(await createBoardInAPI(String(payload.name))),
        'update-board': async (payload) =>
          !!(await updateBoardInAPI(String(payload.id), { name: String(payload.name) })),
        'delete-board': async (payload) => await deleteBoardFromAPI(String(payload.id)),
        'create-prompt': async (payload) =>
          !!(await api.createPrompt({
            title: String(payload.title),
            content: String(payload.content),
            tags: Array.isArray(payload.tags) ? (payload.tags as string[]) : [],
          })),
        'update-prompt': async (payload) =>
          !!(await api.updatePrompt(String(payload.id), {
            title: payload.title ? String(payload.title) : undefined,
            content: payload.content ? String(payload.content) : undefined,
            tags: Array.isArray(payload.tags) ? (payload.tags as string[]) : undefined,
          })),
        'delete-prompt': async (payload) => !!(await api.deletePrompt(String(payload.id))),
        'create-pomodoro-session': async (payload) =>
          !!(await api.createPomodoroSession({
            taskId: payload.taskId ? String(payload.taskId) : undefined,
            taskTitle: payload.taskTitle ? String(payload.taskTitle) : undefined,
            mode: String(payload.mode),
            duration: Number(payload.duration),
            completedAt: String(payload.completedAt),
            completed: payload.completed !== false,
          })),
      });
    };

    const handleOnline = () => {
      setIsOnline(true);
      flush();
    };
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    if (navigator.onLine) flush();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline]);

  return <>{children}</>;
}
