'use client';

import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { usePomodoroStore } from '@/lib/pomodoro-store';

export default function SettingsPage() {
  const {
    focusDuration,
    shortBreakDuration,
    longBreakDuration,
    sessionsUntilLongBreak,
    setFocusDuration,
    setShortBreakDuration,
    setLongBreakDuration,
    setSessionsUntilLongBreak,
  } = usePomodoroStore();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <ParticlesBackground />
      <Header />
      <div className="relative flex flex-1 pt-16 z-10">
        <Sidebar />
        <main className="flex-1 pl-16 overflow-y-auto">
          <div className="container mx-auto max-w-2xl px-6 py-8">
            <h1 className="mb-2 text-3xl font-bold">Configurações</h1>
            <p className="mb-8 text-muted-foreground">Preferências do Pomodoro e notificações.</p>

            <div className="space-y-6 rounded-2xl border border-border bg-card/80 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium">Foco (minutos)</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={Math.round(focusDuration / 60)}
                  onChange={(e) => setFocusDuration(Number(e.target.value) || 25)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Pausa curta (minutos)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={Math.round(shortBreakDuration / 60)}
                  onChange={(e) => setShortBreakDuration(Number(e.target.value) || 5)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Pausa longa (minutos)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={Math.round(longBreakDuration / 60)}
                  onChange={(e) => setLongBreakDuration(Number(e.target.value) || 15)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Pomodoros até pausa longa</label>
                <input
                  type="number"
                  min={2}
                  max={10}
                  value={sessionsUntilLongBreak}
                  onChange={(e) => setSessionsUntilLongBreak(Number(e.target.value) || 4)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
