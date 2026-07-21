import { create } from 'zustand';
import { createBoardInAPI, deleteBoardFromAPI, loadBoardsFromAPI, updateBoardInAPI } from '@/lib/pouchdb';
import { enqueueSync } from '@/lib/sync-queue';

export interface Board {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface BoardsStore {
  boards: Board[];
  activeBoardId: string | null;
  isLoading: boolean;
  setBoards: (boards: Board[]) => void;
  addBoard: (name: string) => Promise<string | null>;
  updateBoard: (id: string, name: string) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;
  setActiveBoard: (id: string | null) => void;
  loadBoards: () => Promise<void>;
}

const STORAGE_KEY = 'boards-storage';

const loadFromStorage = (): { boards: Board[]; activeBoardId: string | null } => {
  if (typeof window === 'undefined') {
    return { boards: [], activeBoardId: null };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading boards storage:', error);
  }
  return { boards: [], activeBoardId: null };
};

const saveToStorage = (boards: Board[], activeBoardId: string | null) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ boards, activeBoardId }));
  } catch (error) {
    console.error('Error saving boards storage:', error);
  }
};

const stored = loadFromStorage();

export const useBoardsStore = create<BoardsStore>((set, get) => ({
  boards: stored.boards,
  activeBoardId: stored.activeBoardId,
  isLoading: false,

  setBoards: (boards) => {
    const state = get();
    set({ boards });
    saveToStorage(boards, state.activeBoardId);
  },

  addBoard: async (name: string) => {
    const apiBoard = await createBoardInAPI(name.trim());
    if (apiBoard) {
      const newBoard: Board = {
        id: apiBoard.id,
        name: apiBoard.name,
        createdAt: apiBoard.createdAt,
        updatedAt: apiBoard.updatedAt,
      };
      set((state) => {
        const boards = [...state.boards, newBoard];
        saveToStorage(boards, newBoard.id);
        return { boards, activeBoardId: newBoard.id };
      });
      return newBoard.id;
    }

    enqueueSync('create-board', { name: name.trim() });
    const localBoard: Board = {
      id: `board-${Date.now()}`,
      name: name.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => {
      const boards = [...state.boards, localBoard];
      saveToStorage(boards, localBoard.id);
      return { boards, activeBoardId: localBoard.id };
    });
    return localBoard.id;
  },

  updateBoard: async (id: string, name: string) => {
    const trimmed = name.trim();
    set((state) => {
      const boards = state.boards.map((board) =>
        board.id === id ? { ...board, name: trimmed, updatedAt: new Date().toISOString() } : board
      );
      saveToStorage(boards, state.activeBoardId);
      return { boards };
    });

    if (!id.startsWith('board-')) {
      await updateBoardInAPI(id, { name: trimmed });
    } else {
      enqueueSync('update-board', { id, name: trimmed });
    }
  },

  deleteBoard: async (id: string) => {
    set((state) => {
      const boards = state.boards.filter((board) => board.id !== id);
      const activeBoardId =
        state.activeBoardId === id ? (boards[0]?.id ?? null) : state.activeBoardId;
      saveToStorage(boards, activeBoardId);
      return { boards, activeBoardId };
    });

    if (!id.startsWith('board-')) {
      await deleteBoardFromAPI(id);
    } else {
      enqueueSync('delete-board', { id });
    }
  },

  setActiveBoard: (id: string | null) => {
    set({ activeBoardId: id });
    const state = get();
    saveToStorage(state.boards, id);
  },

  loadBoards: async () => {
    set({ isLoading: true });
    const apiBoards = await loadBoardsFromAPI();
    if (apiBoards.length > 0) {
      const boards: Board[] = apiBoards.map((board: Board) => ({
        id: board.id,
        name: board.name,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
      }));
      const currentActive = get().activeBoardId;
      const activeBoardId = boards.some((b) => b.id === currentActive) ? currentActive : boards[0].id;
      set({ boards, activeBoardId, isLoading: false });
      saveToStorage(boards, activeBoardId);
      return;
    }

    const local = loadFromStorage();
    set({ boards: local.boards, activeBoardId: local.activeBoardId, isLoading: false });
  },
}));
