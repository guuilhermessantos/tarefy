'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { KanbanColumn as KanbanColumnType, KanbanCard as KanbanCardType } from '@/lib/kanban-store';
import { KanbanCard } from './KanbanCard';
import { Plus, MoreVertical } from 'lucide-react';
import { useState } from 'react';

interface KanbanColumnProps {
  column: KanbanColumnType;
  cards: KanbanCardType[];
  onAddCard: (columnId: string, title: string) => void;
  onDeleteCard: (id: string) => void;
  onUpdateCard: (id: string, data: Partial<KanbanCardType>) => void;
  onDrop: (cardId: string, columnId: string) => void;
}

export function KanbanColumn({
  column,
  cards,
  onAddCard,
  onDeleteCard,
  onUpdateCard,
  onDrop,
}: KanbanColumnProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const cardId = e.dataTransfer.getData('cardId');
    if (cardId) {
      onDrop(cardId, column.id);
    }
  };

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      onAddCard(column.id, newCardTitle.trim());
      setNewCardTitle('');
      setShowAddCard(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex h-full w-80 flex-shrink-0 flex-col rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div
        className="flex items-center justify-between border-b border-border/50 p-4"
        style={{ borderTopColor: column.color, borderTopWidth: '3px' }}
      >
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-foreground">{column.title}</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {cards.length}
          </span>
        </div>
        <button className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Cards Container */}
      <div
        className={`flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-4 transition-colors scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent ${
          isDraggingOver ? 'bg-primary/5' : ''
        }`}
      >
        <AnimatePresence mode="popLayout">
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              onDelete={onDeleteCard}
              onUpdate={onUpdateCard}
            />
          ))}
        </AnimatePresence>

        {/* Add Card Form */}
        {showAddCard ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg border border-border bg-background p-3"
          >
            <input
              type="text"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="Título do card"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newCardTitle.trim()) {
                  handleAddCard();
                } else if (e.key === 'Escape') {
                  setShowAddCard(false);
                  setNewCardTitle('');
                }
              }}
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleAddCard}
                disabled={!newCardTitle.trim()}
                className="flex-1 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Adicionar
              </button>
              <button
                onClick={() => {
                  setShowAddCard(false);
                  setNewCardTitle('');
                }}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        ) : (
          <button
            onClick={() => setShowAddCard(true)}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border/50 bg-transparent p-3 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-accent/50 hover:text-accent-foreground"
          >
            <Plus className="h-4 w-4" />
            Adicionar card
          </button>
        )}
      </div>
    </motion.div>
  );
}

