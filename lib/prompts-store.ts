import { create } from 'zustand';

export interface PromptItem {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface PromptsStore {
  prompts: PromptItem[];
  addPrompt: (data: { title: string; content: string; tags?: string[] }) => void;
  updatePrompt: (id: string, data: Partial<Omit<PromptItem, 'id' | 'createdAt'>>) => void;
  deletePrompt: (id: string) => void;
  load: () => void;
}

const STORAGE_KEY = 'prompts-storage';

const loadFromStorage = (): PromptItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as PromptItem[];
    return [];
  } catch (e) {
    console.error('Error loading prompts:', e);
    return [];
  }
};

const saveToStorage = (prompts: PromptItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
  } catch (e) {
    console.error('Error saving prompts:', e);
  }
};

export const usePromptsStore = create<PromptsStore>((set, get) => ({
  prompts: loadFromStorage(),

  addPrompt: ({ title, content, tags }) => {
    const newPrompt: PromptItem = {
      id: `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim(),
      content: content.trim(),
      tags: (tags || []).map((t) => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => {
      const prompts = [newPrompt, ...state.prompts];
      saveToStorage(prompts);
      return { prompts };
    });
  },

  updatePrompt: (id, data) => {
    set((state) => {
      const prompts = state.prompts.map((p) =>
        p.id === id
          ? {
              ...p,
              ...data,
              tags: data.tags ? data.tags.filter(Boolean) : p.tags,
              updatedAt: new Date().toISOString(),
            }
          : p
      );
      saveToStorage(prompts);
      return { prompts };
    });
  },

  deletePrompt: (id) => {
    set((state) => {
      const prompts = state.prompts.filter((p) => p.id !== id);
      saveToStorage(prompts);
      return { prompts };
    });
  },

  load: () => {
    const prompts = loadFromStorage();
    set({ prompts });
  },
}));


