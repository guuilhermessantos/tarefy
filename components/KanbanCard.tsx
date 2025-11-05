'use client';

import { motion } from 'framer-motion';
import { KanbanCard as KanbanCardType } from '@/lib/kanban-store';
import { X, Edit2, Tag } from 'lucide-react';
import { useState } from 'react';

interface KanbanCardProps {
  card: KanbanCardType;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<KanbanCardType>) => void;
  isDragging?: boolean;
  isNew?: boolean;
}

export function KanbanCard({ card, onDelete, onUpdate, isDragging, isNew = false }: KanbanCardProps) {
  const [isEditing, setIsEditing] = useState(isNew || card.title === 'Novo Card');
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');

  const handleSave = () => {
    onUpdate(card.id, { title, description });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(card.title);
    setDescription(card.description || '');
    setIsEditing(false);
  };

  const priorityColors = {
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`group relative rounded-lg border border-border/50 bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-border ${
        isDragging ? 'cursor-grabbing' : isEditing ? 'cursor-default' : 'cursor-grab'
      }`}
    >
      <div
        draggable={!isEditing}
        onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
          if (!isEditing) {
            e.dataTransfer.setData('cardId', card.id);
            e.dataTransfer.effectAllowed = 'move';
          } else {
            e.preventDefault();
          }
        }}
        className="w-full"
      >
      {isEditing ? (
        <div className="space-y-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              } else if (e.key === 'Escape') {
                handleCancel();
              }
            }}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
            placeholder="Descrição (opcional)"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
            >
              Salvar
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <h3 className="flex-1 font-medium text-foreground">{card.title}</h3>
            <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => setIsEditing(true)}
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                title="Editar"
              >
                <Edit2 className="h-3 w-3" />
              </button>
              <button
                onClick={() => onDelete(card.id)}
                className="rounded p-1 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                title="Excluir"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>

          {card.description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {card.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-1">
            {card.priority && (
              <span
                className={`rounded-full border px-2 py-0.5 text-xs ${priorityColors[card.priority]}`}
              >
                {card.priority === 'low' ? 'Baixa' : card.priority === 'medium' ? 'Média' : 'Alta'}
              </span>
            )}
            {card.tags && card.tags.length > 0 && (
              <>
                {card.tags.slice(0, 2).map((tag, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 rounded-full border border-border/50 bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    <Tag className="h-2.5 w-2.5" />
                    {tag}
                  </span>
                ))}
                {card.tags.length > 2 && (
                  <span className="rounded-full border border-border/50 bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                    +{card.tags.length - 2}
                  </span>
                )}
              </>
            )}
          </div>
        </>
      )}
      </div>
    </motion.div>
  );
}

