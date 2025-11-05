'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBoardsStore } from '@/lib/boards-store';
import { useBoardStore } from '@/lib/store';
import { Plus, X, Edit2, Check, X as XIcon } from 'lucide-react';

export function BoardTabs() {
  const { boards, activeBoardId, addBoard, updateBoard, deleteBoard, setActiveBoard } =
    useBoardsStore();
  const { setBoardId } = useBoardStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showNewBoardInput, setShowNewBoardInput] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

  const handleTabClick = (boardId: string) => {
    setActiveBoard(boardId);
    setBoardId(boardId);
  };

  const handleAddBoard = () => {
    if (newBoardName.trim()) {
      const newId = addBoard(newBoardName.trim());
      setBoardId(newId);
      setNewBoardName('');
      setShowNewBoardInput(false);
    }
  };

  const handleStartEdit = (board: { id: string; name: string }) => {
    setEditingId(board.id);
    setEditingName(board.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      updateBoard(editingId, editingName.trim());
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDeleteBoard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (boards.length > 1) {
      deleteBoard(id);
      if (activeBoardId === id && boards.length > 1) {
        const remainingBoards = boards.filter((b) => b.id !== id);
        if (remainingBoards.length > 0) {
          setBoardId(remainingBoards[0].id);
        }
      }
    }
  };

  return (
    <div className="flex items-center gap-2 border-b border-border bg-card/50 px-4 py-2">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {boards.map((board) => (
          <div
            key={board.id}
            className={`group relative flex items-center gap-2 rounded-t-lg px-4 py-2 transition-colors ${
              activeBoardId === board.id
                ? 'bg-background text-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            {editingId === board.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveEdit();
                    } else if (e.key === 'Escape') {
                      handleCancelEdit();
                    }
                  }}
                  className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveEdit();
                  }}
                  className="rounded p-1 text-primary hover:bg-accent"
                  title="Salvar"
                >
                  <Check className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelEdit();
                  }}
                  className="rounded p-1 text-muted-foreground hover:bg-accent"
                  title="Cancelar"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleTabClick(board.id)}
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <span>{board.name}</span>
                </button>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(board);
                    }}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    title="Renomear"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  {boards.length > 1 && (
                    <button
                      onClick={(e) => handleDeleteBoard(board.id, e)}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                      title="Excluir"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {activeBoardId === board.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    initial={false}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex-shrink-0">
        {showNewBoardInput ? (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5">
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddBoard();
                } else if (e.key === 'Escape') {
                  setShowNewBoardInput(false);
                  setNewBoardName('');
                }
              }}
              placeholder="Nome do fluxo"
              className="w-32 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleAddBoard}
              className="rounded p-1 text-primary hover:bg-accent"
              title="Criar"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              onClick={() => {
                setShowNewBoardInput(false);
                setNewBoardName('');
              }}
              className="rounded p-1 text-muted-foreground hover:bg-accent"
              title="Cancelar"
            >
              <XIcon className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewBoardInput(true)}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            title="Novo Fluxo"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline">Novo Fluxo</span>
          </button>
        )}
      </div>
    </div>
  );
}

