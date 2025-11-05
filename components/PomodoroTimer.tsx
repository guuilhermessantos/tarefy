'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { usePomodoroStore } from '@/lib/pomodoro-store';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';

export function PomodoroTimer() {
  const {
    timeLeft,
    isRunning,
    isPaused,
    mode,
    focusDuration,
    shortBreakDuration,
    longBreakDuration,
    currentTaskTitle,
    start,
    pause,
    resume,
    reset,
    skip,
    tick,
  } = usePomodoroStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use a ref to access the latest tick function
  const tickRef = useRef(tick);
  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  // Timer interval
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        tickRef.current();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentDuration = () => {
    return mode === 'focus'
      ? focusDuration
      : mode === 'shortBreak'
      ? shortBreakDuration
      : longBreakDuration;
  };

  const progress = ((getCurrentDuration() - timeLeft) / getCurrentDuration()) * 100;
  const circumference = 2 * Math.PI * 120; // radius = 120
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const modeLabels = {
    focus: 'Foco',
    shortBreak: 'Pausa Curta',
    longBreak: 'Pausa Longa',
  };

  const modeColors = {
    focus: 'text-primary border-primary',
    shortBreak: 'text-blue-400 border-blue-400',
    longBreak: 'text-purple-400 border-purple-400',
  };

  const handlePlayPause = () => {
    if (isRunning && !isPaused) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      start();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      {/* Mode Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-full border px-4 py-2 text-sm font-medium ${modeColors[mode]}`}
      >
        {modeLabels[mode]}
      </motion.div>

      {/* Timer Circle */}
      <div className="relative">
        <svg className="h-64 w-64 -rotate-90 transform" viewBox="0 0 260 260">
          {/* Background circle */}
          <circle
            cx="130"
            cy="130"
            r="120"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-border/20"
          />
          {/* Progress circle */}
          <motion.circle
            cx="130"
            cy="130"
            r="120"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className={mode === 'focus' ? 'text-primary' : mode === 'shortBreak' ? 'text-blue-400' : 'text-purple-400'}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5 }}
          />
        </svg>

        {/* Timer Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            key={timeLeft}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="text-6xl font-bold text-foreground md:text-7xl"
          >
            {formatTime(timeLeft)}
          </motion.div>
          {currentTaskTitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 max-w-xs truncate text-sm text-muted-foreground"
            >
              {currentTaskTitle}
            </motion.p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={reset}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          title="Resetar"
        >
          <RotateCcw className="h-5 w-5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePlayPause}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl"
          title={isRunning && !isPaused ? 'Pausar' : 'Iniciar'}
        >
          {isRunning && !isPaused ? (
            <Pause className="h-7 w-7" />
          ) : (
            <Play className="h-7 w-7 ml-1" />
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={skip}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          title="Pular"
        >
          <SkipForward className="h-5 w-5" />
        </motion.button>
      </div>
    </div>
  );
}

