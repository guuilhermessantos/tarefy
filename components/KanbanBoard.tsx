'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useKanbanStore, KanbanCard as KanbanCardType } from '@/lib/kanban-store';
import { KanbanColumn } from './KanbanColumn';
import { saveBoard, loadBoard, syncWithAPI, loadKanbanFromAPI, syncCardToAPI, deleteCardFromAPI } from '@/lib/pouchdb';
import { useDebouncedCallback } from 'use-debounce';
import { useBoardStore } from '@/lib/store';
import { APIKanbanCard } from '@/lib/pouchdb';

// Convert API card to store card format
const convertAPICardToCard = (apiCard: APIKanbanCard): KanbanCardType => {
  const validPriorities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
  const priority = apiCard.priority && validPriorities.includes(apiCard.priority as any)
    ? (apiCard.priority as 'low' | 'medium' | 'high')
    : undefined;

  return {
    id: apiCard.id,
    title: apiCard.title,
    description: apiCard.description,
    columnId: apiCard.columnId,
    tags: apiCard.tags,
    priority,
    createdAt: apiCard.createdAt,
    updatedAt: apiCard.updatedAt,
  };
};

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
  const loadedBoardIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);

  // Load board on mount - try API first, then local (only once per boardId)
  useEffect(() => {
    // Skip if boardId is invalid
    if (!boardId || boardId === 'kanban-default' || boardId === 'default' || boardId.startsWith('kanban-')) {
      setIsLoading(false);
      loadedBoardIdRef.current = null;
      return;
    }

    // Skip if already loading or already loaded this boardId
    if (isLoadingRef.current || loadedBoardIdRef.current === boardId) {
      return;
    }

    const loadData = async () => {
      isLoadingRef.current = true;
      setIsLoading(true);
      console.log('[KanbanBoard] Loading data for boardId:', boardId, 'isOnline:', isOnline);
      
      try {
        // Try to load from API first (only if boardId is valid and online)
        if (isOnline) {
          console.log('[KanbanBoard] Attempting to load from API...');
          const apiData = await loadKanbanFromAPI(boardId);
          
          if (apiData) {
            console.log('[KanbanBoard] API data loaded successfully');
            // Always set data, even if empty (columns or cards might be empty)
            setColumns(apiData.columns || []);
            // Convert API cards to store format
            const convertedCards = (apiData.cards || []).map(convertAPICardToCard);
            setCards(convertedCards);
            // Save to local storage for offline access (save converted cards)
            await saveBoard(boardId, { columns: apiData.columns || [], cards: convertedCards });
            loadedBoardIdRef.current = boardId;
            setIsLoading(false);
            isLoadingRef.current = false;
            return;
          } else {
            console.log('[KanbanBoard] API returned no data, trying local...');
          }
        } else {
          console.log('[KanbanBoard] Skipping API load - offline');
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
        loadedBoardIdRef.current = boardId;
      } catch (error) {
        console.error('[KanbanBoard] Error loading board:', error);
        // Final fallback to local
        try {
          const saved = await loadBoard(boardId);
          if (saved) {
            if (saved.columns) setColumns(saved.columns);
            if (saved.cards) setCards(saved.cards);
          }
          loadedBoardIdRef.current = boardId;
        } catch (localError) {
          console.error('[KanbanBoard] Error loading local data:', localError);
        }
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, isOnline]); // Removed setColumns and setCards from dependencies as they should be stable

  // Reset loaded boardId when boardId changes to invalid
  useEffect(() => {
    if (!boardId || boardId === 'kanban-default' || boardId === 'default' || boardId.startsWith('kanban-')) {
      loadedBoardIdRef.current = null;
    }
  }, [boardId]);

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
    if (!isOnline || !boardId || boardId.startsWith('kanban-') || boardId === 'kanban-default' || boardId === 'default') return;

    // Only sync cards that have temporary IDs (not yet synced)
    const newCards = cards.filter((c) => c.id.startsWith('card-'));
    
    if (newCards.length === 0) return;

    const syncNewCards = async () => {
      for (const card of newCards) {
        try {
          const apiCard = await syncCardToAPI(boardId, card, true);
          if (apiCard) {
            // Convert API card to store format and update local card
            const convertedCard = convertAPICardToCard(apiCard);
            // Update the card with the new ID from server
            const { id: newId, ...cardData } = convertedCard;
            updateCard(card.id, { ...cardData, id: newId });
          }
        } catch (error) {
          console.error('Error syncing new card to API:', error);
        }
      }
    };

    // Debounce to avoid multiple syncs
    const timeoutId = setTimeout(() => {
      syncNewCards();
    }, 1000); // Increased debounce time

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length, isOnline, boardId]); // Only depend on cards.length to avoid re-syncing on every card change

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

