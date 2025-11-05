import { create } from 'zustand';

export interface Board {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface BoardsStore {
  boards: Board[];
  activeBoardId: string | null;
  
  // Actions
  setBoards: (boards: Board[]) => void;
  addBoard: (name: string) => string; // Returns the new board ID
  updateBoard: (id: string, name: string) => void;
  deleteBoard: (id: string) => void;
  setActiveBoard: (id: string | null) => void;
  loadBoards: () => Promise<void>;
}

const defaultBoards: Board[] = [
  {
    id: 'default',
    name: 'Fluxo Principal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Load from localStorage
const loadFromStorage = (): { boards: Board[]; activeBoardId: string | null } => {
  if (typeof window === 'undefined') {
    return { boards: defaultBoards, activeBoardId: 'default' };
  }
  try {
    const stored = localStorage.getItem('boards-storage');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading boards storage:', error);
  }
  return { boards: defaultBoards, activeBoardId: 'default' };
};

// Save to localStorage
const saveToStorage = (boards: Board[], activeBoardId: string | null) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('boards-storage', JSON.stringify({ boards, activeBoardId }));
  } catch (error) {
    console.error('Error saving boards storage:', error);
  }
};

const stored = loadFromStorage();

export const useBoardsStore = create<BoardsStore>((set, get) => ({
  boards: stored.boards.length > 0 ? stored.boards : defaultBoards,
  activeBoardId: stored.activeBoardId || 'default',

  setBoards: (boards) => {
    set({ boards });
    const state = get();
    saveToStorage(state.boards, state.activeBoardId);
  },

  addBoard: (name: string) => {
    const newBoard: Board = {
      id: `board-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    set((state) => {
      const newBoards = [...state.boards, newBoard];
      saveToStorage(newBoards, newBoard.id);
      return { boards: newBoards, activeBoardId: newBoard.id };
    });
    
    return newBoard.id;
  },

  updateBoard: (id: string, name: string) => {
    set((state) => {
      const updatedBoards = state.boards.map((board) =>
        board.id === id
          ? { ...board, name, updatedAt: new Date().toISOString() }
          : board
      );
      saveToStorage(updatedBoards, state.activeBoardId);
      return { boards: updatedBoards };
    });
  },

  deleteBoard: (id: string) => {
    set((state) => {
      const filteredBoards = state.boards.filter((board) => board.id !== id);
      const newActiveBoardId =
        state.activeBoardId === id
          ? filteredBoards.length > 0
            ? filteredBoards[0].id
            : null
          : state.activeBoardId;
      saveToStorage(filteredBoards, newActiveBoardId);
      return { boards: filteredBoards, activeBoardId: newActiveBoardId };
    });
  },

  setActiveBoard: (id: string | null) => {
    set({ activeBoardId: id });
    const state = get();
    saveToStorage(state.boards, id);
  },

  loadBoards: async () => {
    const stored = loadFromStorage();
    set({ boards: stored.boards, activeBoardId: stored.activeBoardId });
  },
}));

