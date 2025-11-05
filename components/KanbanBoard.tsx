'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useKanbanStore, KanbanCard as KanbanCardType } from '@/lib/kanban-store';
import { KanbanColumn } from './KanbanColumn';
import { saveBoard, loadBoard, syncWithAPI } from '@/lib/pouchdb';
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

  // Load board on mount
  useEffect(() => {
    const loadData = async () => {
      const saved = await loadBoard(boardId);
      if (saved && saved.columns && saved.cards) {
        setColumns(saved.columns);
        setCards(saved.cards);
      }
    };
    loadData();
  }, [boardId, setColumns, setCards]);

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

  const handleAddCard = (columnId: string, title: string) => {
    addCard({
      title,
      columnId,
      description: '',
    });
  };

  const handleDrop = (cardId: string, newColumnId: string) => {
    moveCard(cardId, newColumnId);
  };

  const handleDeleteCard = (id: string) => {
    deleteCard(id);
  };

  const handleUpdateCard = (id: string, data: Partial<KanbanCardType>) => {
    updateCard(id, data);
  };

  // Group cards by column
  const cardsByColumn = columns.reduce((acc, column) => {
    acc[column.id] = cards.filter((card) => card.columnId === column.id);
    return acc;
  }, {} as Record<string, KanbanCardType[]>);

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

