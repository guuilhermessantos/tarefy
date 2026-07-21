'use client';

import { useEffect } from 'react';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { TaskSelector } from '@/components/TaskSelector';
import { PomodoroStats } from '@/components/PomodoroStats';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { usePomodoroStore } from '@/lib/pomodoro-store';

export default function PomodoroPage() {
  const { loadTodaySessions, loadFromAPI } = usePomodoroStore();

  useEffect(() => {
    loadTodaySessions();
    void loadFromAPI();
    
    // Request notification permission
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [loadTodaySessions, loadFromAPI]);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <ParticlesBackground />
      <Header />
      <div className="relative flex flex-1 flex-col pt-16 z-10">
        <Sidebar />
        <main className="flex-1 pl-16 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            <div className="mb-8">
              <h1 className="mb-2 text-4xl font-bold text-foreground">Pomodoro Timer</h1>
              <p className="text-muted-foreground">
                Técnica de gerenciamento de tempo para aumentar sua produtividade
              </p>
            </div>

            {/* Stats */}
            <div className="mb-8">
              <PomodoroStats />
            </div>

            {/* Task Selector */}
            <div className="mb-8 flex justify-center">
              <TaskSelector />
            </div>

            {/* Timer */}
            <div className="flex justify-center">
              <PomodoroTimer />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

