'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { useKanbanStore } from '@/lib/kanban-store';
import { usePomodoroStore } from '@/lib/pomodoro-store';
import { CheckCircle2, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskOption {
  id: string;
  title: string;
  description?: string | null;
}

export function TaskSelector() {
  const { cards } = useKanbanStore();
  const { currentTaskTitle, setCurrentTask } = usePomodoroStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [apiTasks, setApiTasks] = useState<TaskOption[]>([]);

  useEffect(() => {
    const loadTasks = async () => {
      const result = await api.getKanbanTasks();
      if (result?.cards) {
        setApiTasks(
          result.cards
            .filter((card) => !card.isDone)
            .map((card) => ({
              id: card.id,
              title: card.title,
              description: card.description,
            }))
        );
      }
    };
    void loadTasks();
  }, []);

  const localTasks = cards.filter((card) => {
    const column = useKanbanStore.getState().columns.find((c) => c.id === card.columnId);
    return column ? !/feito|done|conclu/i.test(column.title) : true;
  });

  const mergedTasks = [
    ...apiTasks,
    ...localTasks
      .filter((local) => !apiTasks.some((api) => api.id === local.id))
      .map((task) => ({ id: task.id, title: task.title, description: task.description })),
  ];

  const availableTasks = mergedTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectTask = (taskId: string, taskTitle: string) => {
    setCurrentTask(taskId, taskTitle);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClearTask = () => {
    setCurrentTask(undefined, undefined);
  };

  return (
    <div className="w-full max-w-md">
      {currentTaskTitle ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Tarefa Atual</p>
              <p className="text-sm text-muted-foreground">{currentTaskTitle}</p>
            </div>
          </div>
          <button
            onClick={handleClearTask}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            title="Remover tarefa"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      ) : (
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent hover:border-primary"
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Selecionar tarefa para focar</span>
            </div>
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full z-50 mt-2 w-full rounded-lg border border-border bg-card shadow-lg"
              >
                <div className="p-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar tarefa..."
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {availableTasks.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {searchQuery ? 'Nenhuma tarefa encontrada' : 'Nenhuma tarefa disponível'}
                    </div>
                  ) : (
                    availableTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => handleSelectTask(task.id, task.title)}
                        className="w-full border-t border-border p-3 text-left transition-colors hover:bg-accent"
                      >
                        <p className="font-medium text-foreground">{task.title}</p>
                        {task.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
