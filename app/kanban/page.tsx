'use client';

import { useEffect } from 'react';
import { KanbanBoard } from '@/components/KanbanBoard';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { loadBoardsFromAPI } from '@/lib/pouchdb';
import { useKanbanStore } from '@/lib/kanban-store';

export default function KanbanPage() {
  const { setBoardId, boardId } = useKanbanStore();

  // Load boards from API and set first board as active
  useEffect(() => {
    const loadBoards = async () => {
      try {
        console.log('[KanbanPage] Loading boards from API...');
        const boards = await loadBoardsFromAPI();
        console.log('[KanbanPage] Loaded boards from API:', boards);
        
        if (boards && boards.length > 0) {
          // Use the first board if no board is selected or if current is invalid
          const firstBoard = boards[0];
          if (!boardId || boardId === 'kanban-default' || boardId === 'default' || boardId.startsWith('kanban-')) {
            console.log('[KanbanPage] Setting boardId to first board:', firstBoard.id);
            setBoardId(firstBoard.id);
          } else {
            // Verify current boardId exists in loaded boards
            const boardExists = boards.some((b: any) => b.id === boardId);
            if (!boardExists) {
              console.log('[KanbanPage] Current boardId not found in loaded boards, using first board');
              setBoardId(firstBoard.id);
            } else {
              console.log('[KanbanPage] Current boardId is valid:', boardId);
            }
          }
        } else {
          console.log('[KanbanPage] No boards found in API. User may need to create a board first.');
          // Don't change boardId if no boards found - let user work with local data
        }
      } catch (error) {
        console.error('[KanbanPage] Error loading boards:', error);
      }
    };

    // Only load if we're online and don't have a valid boardId
    if (typeof window !== 'undefined' && navigator.onLine) {
      loadBoards();
    }
  }, [setBoardId, boardId]);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <ParticlesBackground />
      <Header />
      <div className="relative flex flex-1 pt-16 z-10">
        <Sidebar />
        <main className="flex-1 pl-16 overflow-hidden">
          <KanbanBoard />
        </main>
      </div>
    </div>
  );
}

