import { create } from 'zustand';
import { api } from '@/lib/api-client';
import { enqueueSync } from '@/lib/sync-queue';

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export interface PomodoroSession {
  id: string;
  taskId?: string;
  taskTitle?: string;
  mode: PomodoroMode;
  duration: number; // in seconds
  completedAt: string;
  completed: boolean; // se completou ou cancelou
}

export interface PomodoroState {
  // Timer state
  timeLeft: number; // in seconds
  isRunning: boolean;
  isPaused: boolean;
  mode: PomodoroMode;
  
  // Settings
  focusDuration: number; // 25 minutes default
  shortBreakDuration: number; // 5 minutes default
  longBreakDuration: number; // 15 minutes default
  sessionsUntilLongBreak: number; // 4 sessions default
  
  // Current session
  currentTaskId?: string;
  currentTaskTitle?: string;
  currentSessionNumber: number; // quantos pomodoros completos hoje
  
  // History
  sessions: PomodoroSession[];
  todaySessions: PomodoroSession[];
  
  // Stats
  totalFocusTime: number; // total seconds focused today
}

interface PomodoroStore extends PomodoroState {
  // Timer controls
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skip: () => void;
  
  // Settings
  setFocusDuration: (minutes: number) => void;
  setShortBreakDuration: (minutes: number) => void;
  setLongBreakDuration: (minutes: number) => void;
  setSessionsUntilLongBreak: (count: number) => void;
  
  // Task management
  setCurrentTask: (taskId?: string, taskTitle?: string) => void;
  
  // Internal
  tick: () => void;
  completeSession: () => void;
  loadTodaySessions: () => void;
  loadFromAPI: () => Promise<void>;
}

const DEFAULT_FOCUS = 25 * 60; // 25 minutes
const DEFAULT_SHORT_BREAK = 5 * 60; // 5 minutes
const DEFAULT_LONG_BREAK = 15 * 60; // 15 minutes

// Load from localStorage
const loadFromStorage = (): Partial<PomodoroState> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem('pomodoro-storage');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading pomodoro storage:', error);
  }
  return {};
};

// Save to localStorage
const saveToStorage = (state: Partial<PomodoroState>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('pomodoro-storage', JSON.stringify(state));
  } catch (error) {
    console.error('Error saving pomodoro storage:', error);
  }
};

const stored = loadFromStorage();

export const usePomodoroStore = create<PomodoroStore>((set, get) => ({
      // Initial state
      timeLeft: DEFAULT_FOCUS,
      isRunning: false,
      isPaused: false,
      mode: (stored.mode as PomodoroMode) || 'focus',
      focusDuration: stored.focusDuration || DEFAULT_FOCUS,
      shortBreakDuration: stored.shortBreakDuration || DEFAULT_SHORT_BREAK,
      longBreakDuration: stored.longBreakDuration || DEFAULT_LONG_BREAK,
      sessionsUntilLongBreak: stored.sessionsUntilLongBreak || 4,
      currentTaskId: stored.currentTaskId,
      currentTaskTitle: stored.currentTaskTitle,
      currentSessionNumber: stored.currentSessionNumber || 0,
      sessions: stored.sessions || [],
      todaySessions: stored.todaySessions || [],
      totalFocusTime: stored.totalFocusTime || 0,

      start: () => {
        const state = get();
        if (state.isRunning) return;
        
        set({ isRunning: true, isPaused: false });
      },

      pause: () => {
        set({ isRunning: false, isPaused: true });
      },

      resume: () => {
        set({ isRunning: true, isPaused: false });
      },

      reset: () => {
        const state = get();
        const duration =
          state.mode === 'focus'
            ? state.focusDuration
            : state.mode === 'shortBreak'
            ? state.shortBreakDuration
            : state.longBreakDuration;
        
        set({
          timeLeft: duration,
          isRunning: false,
          isPaused: false,
        });
      },

      skip: () => {
        const state = get();
        const nextMode: PomodoroMode =
          state.mode === 'focus'
            ? state.currentSessionNumber % state.sessionsUntilLongBreak === 0
              ? 'longBreak'
              : 'shortBreak'
            : 'focus';
        
        const nextDuration =
          nextMode === 'focus'
            ? state.focusDuration
            : nextMode === 'shortBreak'
            ? state.shortBreakDuration
            : state.longBreakDuration;
        
        set({
          mode: nextMode,
          timeLeft: nextDuration,
          isRunning: false,
          isPaused: false,
          currentSessionNumber: nextMode === 'focus' ? state.currentSessionNumber + 1 : state.currentSessionNumber,
        });
      },

      tick: () => {
        const state = get();
        if (!state.isRunning || state.timeLeft <= 0) return;

        if (state.timeLeft === 1) {
          // Timer completed
          get().completeSession();
        } else {
          set({ timeLeft: state.timeLeft - 1 });
          
          // Update total focus time if in focus mode
          if (state.mode === 'focus') {
            set({ totalFocusTime: state.totalFocusTime + 1 });
          }
        }
      },

      completeSession: () => {
        const state = get();
        const session: PomodoroSession = {
          id: `session-${Date.now()}`,
          taskId: state.currentTaskId,
          taskTitle: state.currentTaskTitle,
          mode: state.mode,
          duration: state.mode === 'focus' ? state.focusDuration : state.mode === 'shortBreak' ? state.shortBreakDuration : state.longBreakDuration,
          completedAt: new Date().toISOString(),
          completed: true,
        };

        const nextMode: PomodoroMode =
          state.mode === 'focus'
            ? (state.currentSessionNumber + 1) % state.sessionsUntilLongBreak === 0
              ? 'longBreak'
              : 'shortBreak'
            : 'focus';

        const nextDuration =
          nextMode === 'focus'
            ? state.focusDuration
            : nextMode === 'shortBreak'
            ? state.shortBreakDuration
            : state.longBreakDuration;

        const newSessionNumber = state.mode === 'focus' ? state.currentSessionNumber + 1 : state.currentSessionNumber;

        const newState = {
          sessions: [session, ...state.sessions],
          mode: nextMode,
          timeLeft: nextDuration,
          isRunning: false,
          isPaused: false,
          currentSessionNumber: newSessionNumber,
        };

        set(newState);
        const updatedState = get();
        saveToStorage({
          sessions: updatedState.sessions,
          focusDuration: updatedState.focusDuration,
          shortBreakDuration: updatedState.shortBreakDuration,
          longBreakDuration: updatedState.longBreakDuration,
          sessionsUntilLongBreak: updatedState.sessionsUntilLongBreak,
          currentTaskId: updatedState.currentTaskId,
          currentTaskTitle: updatedState.currentTaskTitle,
          currentSessionNumber: updatedState.currentSessionNumber,
          totalFocusTime: updatedState.totalFocusTime,
        });
        get().loadTodaySessions();

        void api.createPomodoroSession({
          taskId: session.taskId,
          taskTitle: session.taskTitle,
          mode: session.mode,
          duration: session.duration,
          completedAt: session.completedAt,
          completed: session.completed,
        }).then((result) => {
          if (!result) enqueueSync('create-pomodoro-session', { ...session });
        });
        
        // Trigger notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(
            state.mode === 'focus' ? 'Pomodoro Concluído! 🎉' : 'Pausa Concluída! ⏰',
            {
              body: state.mode === 'focus' 
                ? 'Hora de uma pausa!' 
                : 'Hora de voltar ao trabalho!',
              icon: '/favicon.ico',
            }
          );
        }
      },

      setFocusDuration: (minutes: number) => {
        const seconds = minutes * 60;
        set({ focusDuration: seconds });
        const state = get();
        if (state.mode === 'focus' && !state.isRunning) {
          set({ timeLeft: seconds });
        }
        saveToStorage({
          sessions: state.sessions,
          focusDuration: seconds,
          shortBreakDuration: state.shortBreakDuration,
          longBreakDuration: state.longBreakDuration,
          sessionsUntilLongBreak: state.sessionsUntilLongBreak,
          currentTaskId: state.currentTaskId,
          currentTaskTitle: state.currentTaskTitle,
          currentSessionNumber: state.currentSessionNumber,
          totalFocusTime: state.totalFocusTime,
        });
      },

      setShortBreakDuration: (minutes: number) => {
        const seconds = minutes * 60;
        set({ shortBreakDuration: seconds });
        const state = get();
        if (state.mode === 'shortBreak' && !state.isRunning) {
          set({ timeLeft: seconds });
        }
        saveToStorage({
          sessions: state.sessions,
          focusDuration: state.focusDuration,
          shortBreakDuration: seconds,
          longBreakDuration: state.longBreakDuration,
          sessionsUntilLongBreak: state.sessionsUntilLongBreak,
          currentTaskId: state.currentTaskId,
          currentTaskTitle: state.currentTaskTitle,
          currentSessionNumber: state.currentSessionNumber,
          totalFocusTime: state.totalFocusTime,
        });
      },

      setLongBreakDuration: (minutes: number) => {
        const seconds = minutes * 60;
        set({ longBreakDuration: seconds });
        const state = get();
        if (state.mode === 'longBreak' && !state.isRunning) {
          set({ timeLeft: seconds });
        }
        saveToStorage({
          sessions: state.sessions,
          focusDuration: state.focusDuration,
          shortBreakDuration: state.shortBreakDuration,
          longBreakDuration: seconds,
          sessionsUntilLongBreak: state.sessionsUntilLongBreak,
          currentTaskId: state.currentTaskId,
          currentTaskTitle: state.currentTaskTitle,
          currentSessionNumber: state.currentSessionNumber,
          totalFocusTime: state.totalFocusTime,
        });
      },

      setSessionsUntilLongBreak: (count: number) => {
        set({ sessionsUntilLongBreak: count });
        const state = get();
        saveToStorage({
          sessions: state.sessions,
          focusDuration: state.focusDuration,
          shortBreakDuration: state.shortBreakDuration,
          longBreakDuration: state.longBreakDuration,
          sessionsUntilLongBreak: count,
          currentTaskId: state.currentTaskId,
          currentTaskTitle: state.currentTaskTitle,
          currentSessionNumber: state.currentSessionNumber,
          totalFocusTime: state.totalFocusTime,
        });
      },

      setCurrentTask: (taskId?: string, taskTitle?: string) => {
        set({ currentTaskId: taskId, currentTaskTitle: taskTitle });
        const state = get();
        saveToStorage({
          sessions: state.sessions,
          focusDuration: state.focusDuration,
          shortBreakDuration: state.shortBreakDuration,
          longBreakDuration: state.longBreakDuration,
          sessionsUntilLongBreak: state.sessionsUntilLongBreak,
          currentTaskId: taskId,
          currentTaskTitle: taskTitle,
          currentSessionNumber: state.currentSessionNumber,
          totalFocusTime: state.totalFocusTime,
        });
      },

      loadTodaySessions: () => {
        const state = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todaySessions = state.sessions.filter((session) => {
          const sessionDate = new Date(session.completedAt);
          sessionDate.setHours(0, 0, 0, 0);
          return sessionDate.getTime() === today.getTime();
        });

        const todayFocusTime = todaySessions
          .filter((s) => s.mode === 'focus' && s.completed)
          .reduce((sum, s) => sum + s.duration, 0);

        set({ todaySessions, totalFocusTime: todayFocusTime });
        const updatedState = get();
        saveToStorage({
          sessions: updatedState.sessions,
          focusDuration: updatedState.focusDuration,
          shortBreakDuration: updatedState.shortBreakDuration,
          longBreakDuration: updatedState.longBreakDuration,
          sessionsUntilLongBreak: updatedState.sessionsUntilLongBreak,
          currentTaskId: updatedState.currentTaskId,
          currentTaskTitle: updatedState.currentTaskTitle,
          currentSessionNumber: updatedState.currentSessionNumber,
          totalFocusTime: todayFocusTime,
        });
      },

      loadFromAPI: async () => {
        const result = await api.getPomodoroSessions();
        if (!result?.sessions) return;

        const sessions: PomodoroSession[] = result.sessions.map((s) => ({
          id: s.id,
          taskId: s.taskId ?? undefined,
          taskTitle: s.taskTitle ?? undefined,
          mode: s.mode as PomodoroMode,
          duration: s.duration,
          completedAt: s.completedAt,
          completed: s.completed,
        }));

        set({ sessions });
        get().loadTodaySessions();
      },
    })
);

