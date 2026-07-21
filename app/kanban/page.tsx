'use client';

import { useEffect, useRef, useState } from 'react';
import { KanbanBoard } from '@/components/KanbanBoard';
import { KanbanToolbar } from '@/components/KanbanToolbar';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { loadBoardsFromAPI } from '@/lib/pouchdb';
import { useKanbanStore } from '@/lib/kanban-store';
import { isValidBoardId } from '@/lib/api-client';

export default function KanbanPage() {
  const { setBoardId, boardId } = useKanbanStore();
  const [boards, setBoards] = useState<Array<{ id: string; name: string }>>([]);
  const hasLoadedRef = useRef(false);
  const boardIdRef = useRef(boardId);

  useEffect(() => {
    boardIdRef.current = boardId;
  }, [boardId]);

  useEffect(() => {
    if (hasLoadedRef.current) return;

    const loadBoards = async () => {
      if (typeof window === 'undefined' || !navigator.onLine) {
        hasLoadedRef.current = true;
        return;
      }

      hasLoadedRef.current = true;

      try {
        const loadedBoards = await loadBoardsFromAPI();
        setBoards(loadedBoards);

        if (loadedBoards.length > 0) {
          const currentBoardId = boardIdRef.current;
          if (!isValidBoardId(currentBoardId)) {
            setBoardId(loadedBoards[0].id);
          } else if (!loadedBoards.some((b) => b.id === currentBoardId)) {
            setBoardId(loadedBoards[0].id);
          }
        }
      } catch (error) {
        console.error('[KanbanPage] Error loading boards:', error);
      }
    };

    void loadBoards();
  }, [setBoardId]);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <ParticlesBackground />
      <Header />
      <div className="relative flex flex-1 flex-col pt-16 z-10">
        <Sidebar />
        <main className="flex flex-1 flex-col pl-16 overflow-hidden">
          <KanbanToolbar boards={boards} onBoardsChange={setBoards} />
          <KanbanBoard />
        </main>
      </div>
    </div>
  );
}
