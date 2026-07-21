type SyncJob = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

const QUEUE_KEY = 'tarefy-sync-queue';
const pendingSyncListeners = new Set<() => void>();

function notifyPendingSyncListeners() {
  pendingSyncListeners.forEach((listener) => listener());
}

function readQueue(): SyncJob[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as SyncJob[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(jobs: SyncJob[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(jobs));
  notifyPendingSyncListeners();
}

export function enqueueSync(type: string, payload: object) {
  const jobs = readQueue();
  jobs.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload: payload as Record<string, unknown>,
    createdAt: new Date().toISOString(),
  });
  writeQueue(jobs);
}

export async function flushSyncQueue(
  handlers: Record<string, (payload: Record<string, unknown>) => Promise<boolean>>
) {
  if (typeof window === 'undefined' || !navigator.onLine) return;

  const jobs = readQueue();
  const remaining: SyncJob[] = [];

  for (const job of jobs) {
    const handler = handlers[job.type];
    if (!handler) {
      remaining.push(job);
      continue;
    }
    try {
      const ok = await handler(job.payload);
      if (!ok) remaining.push(job);
    } catch {
      remaining.push(job);
    }
  }

  writeQueue(remaining);
}

export function getPendingSyncCount() {
  return readQueue().length;
}

export function subscribePendingSyncCount(callback: () => void) {
  pendingSyncListeners.add(callback);
  const interval = setInterval(callback, 3000);
  return () => {
    pendingSyncListeners.delete(callback);
    clearInterval(interval);
  };
}
