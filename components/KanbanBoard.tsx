'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useKanbanStore, KanbanCard as KanbanCardType } from '@/lib/kanban-store';
import { KanbanColumn } from './KanbanColumn';
import { saveBoard, loadBoard, syncWithAPI, loadKanbanFromAPI, syncCardToAPI, deleteCardFromAPI } from '@/lib/pouchdb';
import { useDebouncedCallback } from 'use-debounce';
import { useBoardStore } from '@/lib/store';

export function KanbanBoard() {
  const {
    columns,
    cards,
    boardId,
    isSaving,
    setColumns,
    setCards,
    addCard,
    moveCard,
    deleteCard,
    updateCard,
    setIsSaving,
  } = useKanbanStore();

  const { isOnline } = useBoardStore();
  const [isLoading, setIsLoading] = useState(true);

  // Load board on mount - try API first, then local
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      console.log('[KanbanBoard] Loading data for boardId:', boardId, 'isOnline:', isOnline);
      
      try {
        // Try to load from API first (only if boardId is valid and online)
        if (isOnline && boardId && boardId !== 'kanban-default' && boardId !== 'default' && !boardId.startsWith('kanban-')) {
          console.log('[KanbanBoard] Attempting to load from API...');
          const apiData = await loadKanbanFromAPI(boardId);
          
          if (apiData) {
            console.log('[KanbanBoard] API data loaded successfully');
            // Always set data, even if empty (columns or cards might be empty)
            setColumns(apiData.columns || []);
            setCards(apiData.cards || []);
            // Save to local storage for offline access
            await saveBoard(boardId, { columns: apiData.columns || [], cards: apiData.cards || [] });
            setIsLoading(false);
            return;
          } else {
            console.log('[KanbanBoard] API returned no data, trying local...');
          }
        } else {
          console.log('[KanbanBoard] Skipping API load - boardId:', boardId, 'isOnline:', isOnline);
        }

        // Fallback to local storage
        console.log('[KanbanBoard] Loading from local storage...');
        const saved = await loadBoard(boardId);
        if (saved) {
          console.log('[KanbanBoard] Local data found');
          if (saved.columns) setColumns(saved.columns);
          if (saved.cards) setCards(saved.cards);
        } else {
          console.log('[KanbanBoard] No local data found');
        }
      } catch (error) {
        console.error('[KanbanBoard] Error loading board:', error);
        // Final fallback to local
        try {
          const saved = await loadBoard(boardId);
          if (saved) {
            if (saved.columns) setColumns(saved.columns);
            if (saved.cards) setCards(saved.cards);
          }
        } catch (localError) {
          console.error('[KanbanBoard] Error loading local data:', localError);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [boardId, setColumns, setCards, isOnline]);

  // Auto-save with debounce
  const debouncedSave = useDebouncedCallback(async (columns, cards) => {
    setIsSaving(true);
    try {
      await saveBoard(boardId, { columns, cards });
      if (isOnline) {
        await syncWithAPI(boardId, { columns, cards });
      }
    } catch (error) {
      console.error('Error saving kanban board:', error);
    } finally {
      setIsSaving(false);
    }
  }, 1000);

  useEffect(() => {
    if (columns.length > 0 || cards.length > 0) {
      debouncedSave(columns, cards);
    }
  }, [columns, cards, debouncedSave, isOnline]);

  // Sync new cards to API (cards with temporary IDs starting with 'card-')
  useEffect(() => {
    if (!isOnline || !boardId || boardId.startsWith('kanban-')) return;

    const syncNewCards = async () => {
      // Only sync cards that have temporary IDs (not yet synced)
      const newCards = cards.filter((c) => c.id.startsWith('card-'));
      
      for (const card of newCards) {
        try {
          const apiCard = await syncCardToAPI(boardId, card, true);
          if (apiCard) {
            // Update local card with API response (with real ID from server)
            updateCard(card.id, { id: apiCard.id, ...apiCard });
          }
        } catch (error) {
          console.error('Error syncing new card to API:', error);
        }
      }
    };

    // Debounce to avoid multiple syncs
    const timeoutId = setTimeout(() => {
      if (cards.some((c) => c.id.startsWith('card-'))) {
        syncNewCards();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [cards, isOnline, boardId, updateCard]);

  const handleAddCard = (columnId: string, title: string) => {
    // Add to local store immediately (store generates ID)
    addCard({
      title,
      columnId,
      description: '',
    });
    // Sync will happen automatically via useEffect above
  };

  const handleDrop = async (cardId: string, newColumnId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    // Update local store immediately
    moveCard(cardId, newColumnId);
    
    // Sync to API if online
    if (isOnline && boardId && !boardId.startsWith('kanban-')) {
      try {
        await syncCardToAPI(boardId, { ...card, columnId: newColumnId }, false);
      } catch (error) {
        console.error('Error syncing card move to API:', error);
      }
    }
  };

  const handleDeleteCard = async (id: string) => {
    // Delete from local store immediately
    deleteCard(id);
    
    // Delete from API if online
    if (isOnline && boardId && !boardId.startsWith('kanban-')) {
      try {
        await deleteCardFromAPI(boardId, id);
      } catch (error) {
        console.error('Error deleting card from API:', error);
      }
    }
  };

  const handleUpdateCard = async (id: string, data: Partial<KanbanCardType>) => {
    const card = cards.find((c) => c.id === id);
    if (!card) return;

    // Update local store immediately
    updateCard(id, data);
    
    // Sync to API if online
    if (isOnline && boardId && !boardId.startsWith('kanban-')) {
      try {
        await syncCardToAPI(boardId, { ...card, ...data }, false);
      } catch (error) {
        console.error('Error syncing card update to API:', error);
      }
    }
  };

  // Group cards by column
  const cardsByColumn = columns.reduce((acc, column) => {
    acc[column.id] = cards.filter((card) => card.columnId === column.id);
    return acc;
  }, {} as Record<string, KanbanCardType[]>);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Carregando board...</div>
      </div>
    );
  }

  // Show message if no boardId is set or it's invalid
  if (!boardId || boardId === 'kanban-default' || boardId === 'default' || boardId.startsWith('kanban-')) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">Nenhum board selecionado</p>
          <p className="text-sm text-muted-foreground">Crie um board primeiro ou selecione um existente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Board Container */}
      <div className="flex h-full gap-4 overflow-x-auto overflow-y-hidden p-6 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            cards={cardsByColumn[column.id] || []}
            onAddCard={handleAddCard}
            onDeleteCard={handleDeleteCard}
            onUpdateCard={handleUpdateCard}
            onDrop={handleDrop}
          />
        ))}
      </div>

      {/* Saving Indicator */}
      {isSaving && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-4 right-4 rounded-lg border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-lg"
        >
          Salvando...
        </motion.div>
      )}
    </div>
  );
}

