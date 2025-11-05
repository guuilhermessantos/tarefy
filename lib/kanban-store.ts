import { create } from 'zustand';

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
}

export interface KanbanColumn {
  id: string;
  title: string;
  color?: string;
}

export interface KanbanState {
  columns: KanbanColumn[];
  cards: KanbanCard[];
  boardId: string;
  isSaving: boolean;
}

interface KanbanStore extends KanbanState {
  setColumns: (columns: KanbanColumn[]) => void;
  setCards: (cards: KanbanCard[]) => void;
  addColumn: (column: KanbanColumn) => void;
  updateColumn: (id: string, data: Partial<KanbanColumn>) => void;
  deleteColumn: (id: string) => void;
  addCard: (card: Omit<KanbanCard, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCard: (id: string, data: Partial<KanbanCard>) => void;
  deleteCard: (id: string) => void;
  moveCard: (cardId: string, newColumnId: string, newIndex?: number) => void;
  setBoardId: (id: string) => void;
  setIsSaving: (isSaving: boolean) => void;
  reset: () => void;
}

const defaultColumns: KanbanColumn[] = [
  { id: 'todo', title: 'A Fazer', color: '#3B82F6' },
  { id: 'doing', title: 'Em Progresso', color: '#F59E0B' },
  { id: 'done', title: 'Concluído', color: '#10B981' },
];

const defaultCards: KanbanCard[] = [];

export const useKanbanStore = create<KanbanStore>((set, get) => ({
  columns: defaultColumns,
  cards: defaultCards,
  boardId: 'kanban-default',
  isSaving: false,

  setColumns: (columns) => set({ columns }),
  setCards: (cards) => set({ cards }),

  addColumn: (column) =>
    set((state) => ({
      columns: [...state.columns, column],
    })),

  updateColumn: (id, data) =>
    set((state) => ({
      columns: state.columns.map((col) =>
        col.id === id ? { ...col, ...data } : col
      ),
    })),

  deleteColumn: (id) =>
    set((state) => ({
      columns: state.columns.filter((col) => col.id !== id),
      cards: state.cards.filter((card) => card.columnId !== id),
    })),

  addCard: (cardData) => {
    const newCard: KanbanCard = {
      ...cardData,
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      cards: [...state.cards, newCard],
    }));
  },

  updateCard: (id, data) =>
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === id
          ? { ...card, ...data, updatedAt: new Date().toISOString() }
          : card
      ),
    })),

  deleteCard: (id) =>
    set((state) => ({
      cards: state.cards.filter((card) => card.id !== id),
    })),

  moveCard: (cardId, newColumnId, newIndex) => {
    const state = get();
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;

    const cardsInColumn = state.cards.filter(
      (c) => c.columnId === newColumnId && c.id !== cardId
    );

    let updatedCards = state.cards.filter((c) => c.id !== cardId);

    if (newIndex !== undefined && newIndex >= 0) {
      cardsInColumn.splice(newIndex, 0, { ...card, columnId: newColumnId });
      updatedCards = [
        ...state.cards.filter((c) => c.columnId !== newColumnId || c.id === cardId),
        ...cardsInColumn,
      ];
    } else {
      updatedCards = [
        ...updatedCards,
        { ...card, columnId: newColumnId, updatedAt: new Date().toISOString() },
      ];
    }

    set({ cards: updatedCards });
  },

  setBoardId: (id) => set({ boardId: id }),
  setIsSaving: (isSaving) => set({ isSaving }),
  reset: () =>
    set({
      columns: defaultColumns,
      cards: defaultCards,
      boardId: 'kanban-default',
    }),
}));

