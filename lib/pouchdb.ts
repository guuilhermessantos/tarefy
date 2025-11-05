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

// Mock sync function for future API integration
export const syncWithAPI = async (boardId: string, data: any): Promise<void> => {
  // This is a placeholder for future API sync
  // When online, this would sync with a remote CouchDB or custom API
  if (typeof window !== 'undefined' && navigator.onLine) {
    console.log('Syncing board with API...', { boardId, data });
    // TODO: Implement actual API sync
  }
};

