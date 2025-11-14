// Initialize PouchDB with IndexedDB adapter for browser
let db: any = null;
let PouchDB: any = null;

const getPouchDB = async () => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!PouchDB) {
    PouchDB = (await import('pouchdb')).default;
  }
  
  return PouchDB;
};

export const initDB = async (): Promise<any> => {
  if (typeof window === 'undefined') {
    // Server-side: return a mock
    return {} as any;
  }

  if (!db) {
    const PouchDBClass = await getPouchDB();
    if (PouchDBClass) {
      db = new PouchDBClass('tarefy_boards', {
        adapter: 'idb',
      });
    }
  }

  return db;
};

export const saveBoard = async (boardId: string, data: any): Promise<void> => {
  const database = await initDB();
  
  try {
    const doc = {
      _id: boardId,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Try to get existing doc to update _rev
    try {
      const existing = await database.get(boardId);
      doc._rev = existing._rev;
    } catch (err) {
      // Document doesn't exist, will create new one
    }

    await database.put(doc);
  } catch (error) {
    console.error('Error saving board:', error);
    throw error;
  }
};

export const loadBoard = async (boardId: string): Promise<any | null> => {
  const database = await initDB();
  
  try {
    const doc = await database.get(boardId);
    return doc;
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    console.error('Error loading board:', error);
    throw error;
  }
};

export const getAllBoards = async (): Promise<any[]> => {
  const database = await initDB();
  
  try {
    const result = await database.allDocs({
      include_docs: true,
    });
    return result.rows.map((row: any) => row.doc);
  } catch (error) {
    console.error('Error loading all boards:', error);
    return [];
  }
};

// API Functions
export interface APIKanbanColumn {
  id: string;
  title: string;
  color?: string;
  position: number;
  cards?: APIKanbanCard[];
}

export interface APIKanbanCard {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  tags?: string[];
  priority?: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

// Load boards from API
export const loadBoardsFromAPI = async (): Promise<any[]> => {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return [];
  }

  try {
    const response = await fetch('/api/boards', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.log('Unauthorized - user not logged in');
        return [];
      }
      throw new Error(`Failed to load boards: ${response.status}`);
    }

    const data = await response.json();
    return data.boards || [];
  } catch (error) {
    console.error('Error loading boards from API:', error);
    return [];
  }
};

// Load kanban data from API
export const loadKanbanFromAPI = async (boardId: string): Promise<{ columns: APIKanbanColumn[]; cards: APIKanbanCard[] } | null> => {
  if (typeof window === 'undefined' || !navigator.onLine) {
    console.log('[loadKanbanFromAPI] Offline or server-side, skipping');
    return null;
  }

  if (!boardId || boardId.startsWith('kanban-') || boardId === 'default') {
    console.log('[loadKanbanFromAPI] Invalid boardId:', boardId);
    return null;
  }

  try {
    console.log('[loadKanbanFromAPI] Attempting to load board:', boardId);
    const response = await fetch(`/api/kanban/${boardId}/columns`, {
      method: 'GET',
      credentials: 'include',
    });

    console.log('[loadKanbanFromAPI] Response status:', response.status);

    if (!response.ok) {
      if (response.status === 401 || response.status === 404) {
        console.log('[loadKanbanFromAPI] Board not found or unauthorized');
        return null;
      }
      throw new Error(`Failed to load: ${response.status}`);
    }

    const data = await response.json();
    const columns = data.columns || [];
    
    console.log('[loadKanbanFromAPI] Loaded:', { columnsCount: columns.length, cardsCount: columns.reduce((acc: number, col: any) => acc + (col.cards?.length || 0), 0) });

    // Extract all cards from columns
    const cards: APIKanbanCard[] = [];
    columns.forEach((column: APIKanbanColumn) => {
      if (column.cards) {
        cards.push(...column.cards);
      }
    });

    return {
      columns: columns.map((col: any) => ({
        id: col.id,
        title: col.title,
        color: col.color,
        position: col.position,
      })),
      cards: cards.map((card: any) => ({
        id: card.id,
        title: card.title,
        description: card.description,
        columnId: card.columnId,
        tags: card.tags || [],
        priority: card.priority,
        position: card.position,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
      })),
    };
  } catch (error) {
    console.error('Error loading from API:', error);
    return null;
  }
};

// Sync individual card to API
export const syncCardToAPI = async (boardId: string, card: any, isNew: boolean = false): Promise<APIKanbanCard | null> => {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return null;
  }

  try {
    if (isNew) {
      // Create new card
      const response = await fetch(`/api/kanban/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: card.title,
          description: card.description,
          columnId: card.columnId,
          tags: card.tags || [],
          priority: card.priority,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create card: ${response.status}`);
      }

      const data = await response.json();
      return data.card;
    } else {
      // Update existing card
      const response = await fetch(`/api/kanban/${boardId}/cards`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: card.id,
          title: card.title,
          description: card.description,
          tags: card.tags || [],
          priority: card.priority,
          newColumnId: card.columnId, // For moving between columns
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update card: ${response.status}`);
      }

      const data = await response.json();
      return data.card;
    }
  } catch (error) {
    console.error('Error syncing card to API:', error);
    return null;
  }
};

// Delete card from API
export const deleteCardFromAPI = async (boardId: string, cardId: string): Promise<boolean> => {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return false;
  }

  try {
    const response = await fetch(`/api/kanban/${boardId}/cards?id=${cardId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete card: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting card from API:', error);
    return false;
  }
};

// Sync column to API
export const syncColumnToAPI = async (boardId: string, column: any, isNew: boolean = false): Promise<APIKanbanColumn | null> => {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return null;
  }

  try {
    if (isNew) {
      const response = await fetch(`/api/kanban/${boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: column.title,
          color: column.color,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create column: ${response.status}`);
      }

      const data = await response.json();
      return data.column;
    } else {
      // Note: API doesn't have PATCH for columns yet, but we can add it if needed
      console.log('Column update not implemented in API yet');
      return null;
    }
  } catch (error) {
    console.error('Error syncing column to API:', error);
    return null;
  }
};

// Full sync function - syncs all cards and columns to API
// Optimized to load API data only once instead of multiple times
export const syncWithAPI = async (boardId: string, data: { columns?: any[]; cards?: any[] }): Promise<void> => {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return;
  }

  if (!boardId || boardId.startsWith('kanban-') || boardId === 'default') {
    return;
  }

  try {
    const { columns, cards } = data;

    // Load API data ONCE at the beginning to check what exists
    let apiData: { columns: APIKanbanColumn[]; cards: APIKanbanCard[] } | null = null;
    if ((columns && columns.length > 0) || (cards && cards.length > 0)) {
      apiData = await loadKanbanFromAPI(boardId);
    }

    const existingColumnIds = new Set(apiData?.columns.map((c) => c.id) || []);
    const existingCardIds = new Set(apiData?.cards.map((c) => c.id) || []);

    // Sync columns first (they need to exist for cards)
    if (columns && columns.length > 0) {
      for (const column of columns) {
        // Skip temporary IDs (they will be synced individually)
        if (column.id.startsWith('col-')) {
          continue;
        }

        const columnExists = existingColumnIds.has(column.id);
        if (!columnExists) {
          // New column - create it
          await syncColumnToAPI(boardId, column, true);
        }
      }
    }

    // Sync cards
    if (cards && cards.length > 0) {
      for (const card of cards) {
        // Skip temporary IDs (they will be synced individually via the useEffect)
        if (card.id.startsWith('card-')) {
          continue;
        }

        const cardExists = existingCardIds.has(card.id);
        if (!cardExists) {
          // New card - create it
          await syncCardToAPI(boardId, card, true);
        } else {
          // Existing card - update it (only if it changed)
          await syncCardToAPI(boardId, card, false);
        }
      }
    }
  } catch (error) {
    console.error('Error syncing with API:', error);
  }
};

