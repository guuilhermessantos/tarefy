export function isValidBoardId(boardId: string | null | undefined) {
  if (!boardId) return false;
  return !boardId.startsWith('kanban-') && !boardId.startsWith('board-') && boardId !== 'default' && boardId !== 'kanban-default';
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T | null> {
  if (typeof window === 'undefined' || !navigator.onLine) return null;

  try {
    const response = await fetch(url, { credentials: 'include', ...init });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export const api = {
  getBoards: () => apiFetch<{ boards: Array<{ id: string; name: string; createdAt: string; updatedAt: string }> }>('/api/boards'),
  createBoard: (name: string) =>
    apiFetch<{ board: { id: string; name: string; createdAt: string; updatedAt: string } }>('/api/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),
  getBoard: (boardId: string) =>
    apiFetch<{ board: { id: string; name: string; flowData?: { nodes: unknown[]; edges: unknown[] } | null } }>(
      `/api/boards/${boardId}`
    ),
  updateBoard: (boardId: string, data: { name?: string; flowData?: unknown }) =>
    apiFetch<{ board: unknown }>(`/api/boards/${boardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteBoard: (boardId: string) =>
    apiFetch<{ ok: boolean }>(`/api/boards/${boardId}`, { method: 'DELETE' }),

  getPrompts: () => apiFetch<{ prompts: Array<{ id: string; title: string; content: string; tags: string[]; createdAt: string; updatedAt: string }> }>('/api/prompts'),
  createPrompt: (data: { title: string; content: string; tags?: string[] }) =>
    apiFetch<{ prompt: unknown }>('/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  updatePrompt: (id: string, data: Partial<{ title: string; content: string; tags: string[] }>) =>
    apiFetch<{ prompt: unknown }>(`/api/prompts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deletePrompt: (id: string) => apiFetch<{ ok: boolean }>(`/api/prompts/${id}`, { method: 'DELETE' }),

  getPomodoroSessions: () =>
    apiFetch<{ sessions: Array<{ id: string; taskId?: string | null; taskTitle?: string | null; mode: string; duration: number; completedAt: string; completed: boolean }> }>(
      '/api/pomodoro/sessions'
    ),
  createPomodoroSession: (data: {
    taskId?: string;
    taskTitle?: string;
    mode: string;
    duration: number;
    completedAt: string;
    completed: boolean;
  }) =>
    apiFetch<{ session: unknown }>('/api/pomodoro/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  getKanbanTasks: () =>
    apiFetch<{ cards: Array<{ id: string; title: string; description?: string | null; columnId: string; columnTitle: string; isDone: boolean }> }>(
      '/api/kanban/tasks'
    ),
};
