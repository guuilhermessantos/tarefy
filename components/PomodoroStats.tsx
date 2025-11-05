'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePomodoroStore } from '@/lib/pomodoro-store';
import { Target, Clock, Flame } from 'lucide-react';

export function PomodoroStats() {
  const {
    todaySessions,
    totalFocusTime,
    currentSessionNumber,
    loadTodaySessions,
  } = usePomodoroStore();

  useEffect(() => {
    loadTodaySessions();
    // Reload stats every minute
    const interval = setInterval(loadTodaySessions, 60000);
    return () => clearInterval(interval);
  }, [loadTodaySessions]);

  const completedSessions = todaySessions.filter(
    (s) => s.mode === 'focus' && s.completed
  ).length;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const stats = [
    {
      icon: Target,
      label: 'Sessões Hoje',
      value: completedSessions.toString(),
      color: 'text-primary',
    },
    {
      icon: Clock,
      label: 'Tempo Focado',
      value: formatTime(totalFocusTime),
      color: 'text-blue-400',
    },
    {
      icon: Flame,
      label: 'Sequência',
      value: currentSessionNumber.toString(),
      color: 'text-orange-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg bg-muted p-2 ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

