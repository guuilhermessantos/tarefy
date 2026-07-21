'use client';

import { useEffect, useState } from 'react';
import { Plus, Columns3 } from 'lucide-react';
import { loadBoardsFromAPI, createBoardInAPI } from '@/lib/pouchdb';
import { useKanbanStore } from '@/lib/kanban-store';
import { syncColumnToAPI } from '@/lib/pouchdb';

interface KanbanToolbarProps {
  boards: Array<{ id: string; name: string }>;
  onBoardsChange: (boards: Array<{ id: string; name: string }>) => void;
}

export function KanbanToolbar({ boards, onBoardsChange }: KanbanToolbarProps) {
  const { boardId, setBoardId, addColumn, columns } = useKanbanStore();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const load = async () => {
      const apiBoards = await loadBoardsFromAPI();
      if (apiBoards.length) onBoardsChange(apiBoards);
    };
    void load();
  }, [onBoardsChange]);

  const handleCreateBoard = async () => {
    const name = window.prompt('Nome do board Kanban:');
    if (!name?.trim()) return;
    setCreating(true);
    const board = await createBoardInAPI(name.trim());
    if (board) {
      onBoardsChange([...boards, board]);
      setBoardId(board.id);
    }
    setCreating(false);
  };

  const handleAddColumn = async () => {
    const title = window.prompt('Nome da coluna:');
    if (!title?.trim() || !boardId) return;

    const tempColumn = {
      id: `col-${Date.now()}`,
      title: title.trim(),
      color: '#7B61FF',
    };
    addColumn(tempColumn);

    if (navigator.onLine && !boardId.startsWith('kanban-')) {
      const apiColumn = await syncColumnToAPI(boardId, tempColumn, true);
      if (apiColumn) {
        useKanbanStore.getState().updateColumn(tempColumn.id, {
          id: apiColumn.id,
          title: apiColumn.title,
          color: apiColumn.color || tempColumn.color,
        });
      }
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-border/50 bg-card/50 px-6 py-3">
      <div className="flex items-center gap-3">
        <select
          value={boardId}
          onChange={(e) => setBoardId(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          {boards.length === 0 && <option value="">Selecione ou crie um board</option>}
          {boards.map((board) => (
            <option key={board.id} value={board.id}>
              {board.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => void handleCreateBoard()}
          disabled={creating}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-accent disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          Novo board
        </button>
      </div>
      <button
        onClick={() => void handleAddColumn()}
        disabled={!boardId || columns.length === 0 && boards.length === 0}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        <Columns3 className="h-4 w-4" />
        Nova coluna
      </button>
    </div>
  );
}
