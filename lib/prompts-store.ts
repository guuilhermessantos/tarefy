import { create } from 'zustand';
import { api } from '@/lib/api-client';
import { enqueueSync } from '@/lib/sync-queue';

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
  isLoading: boolean;
  addPrompt: (data: { title: string; content: string; tags?: string[] }) => Promise<void>;
  updatePrompt: (id: string, data: Partial<Omit<PromptItem, 'id' | 'createdAt'>>) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  load: () => Promise<void>;
}

const STORAGE_KEY = 'prompts-storage';

const loadFromStorage = (): PromptItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveToStorage = (prompts: PromptItem[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
};

export const usePromptsStore = create<PromptsStore>((set) => ({
  prompts: loadFromStorage(),
  isLoading: false,

  addPrompt: async ({ title, content, tags }) => {
    const payload = {
      title: title.trim(),
      content: content.trim(),
      tags: (tags || []).map((t) => t.trim()).filter(Boolean),
    };

    const result = await api.createPrompt(payload);
    if (result?.prompt) {
      const prompt = result.prompt as PromptItem;
      set((state) => {
        const prompts = [prompt, ...state.prompts];
        saveToStorage(prompts);
        return { prompts };
      });
      return;
    }

    const localPrompt: PromptItem = {
      id: `prompt-${Date.now()}`,
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    enqueueSync('create-prompt', localPrompt);
    set((state) => {
      const prompts = [localPrompt, ...state.prompts];
      saveToStorage(prompts);
      return { prompts };
    });
  },

  updatePrompt: async (id, data) => {
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

    if (!id.startsWith('prompt-')) {
      await api.updatePrompt(id, data);
    } else {
      enqueueSync('update-prompt', { id, ...data });
    }
  },

  deletePrompt: async (id) => {
    set((state) => {
      const prompts = state.prompts.filter((p) => p.id !== id);
      saveToStorage(prompts);
      return { prompts };
    });

    if (!id.startsWith('prompt-')) {
      await api.deletePrompt(id);
    } else {
      enqueueSync('delete-prompt', { id });
    }
  },

  load: async () => {
    set({ isLoading: true });
    const result = await api.getPrompts();
    if (result?.prompts) {
      set({ prompts: result.prompts, isLoading: false });
      saveToStorage(result.prompts);
      return;
    }
    set({ prompts: loadFromStorage(), isLoading: false });
  },
}));
