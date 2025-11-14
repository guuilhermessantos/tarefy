'use client';

import { useEffect, useRef } from 'react';
import { KanbanBoard } from '@/components/KanbanBoard';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { loadBoardsFromAPI } from '@/lib/pouchdb';
import { useKanbanStore } from '@/lib/kanban-store';

export default function KanbanPage() {
  const { setBoardId, boardId } = useKanbanStore();
  const hasLoadedRef = useRef(false);
  const boardIdRef = useRef(boardId);

  // Update ref when boardId changes
  useEffect(() => {
    boardIdRef.current = boardId;
  }, [boardId]);

  // Load boards from API and set first board as active (only once on mount)
  useEffect(() => {
    // Prevent multiple calls - only run once
    if (hasLoadedRef.current) return;
    
    const loadBoards = async () => {
      // Only load if we're online
      if (typeof window === 'undefined' || !navigator.onLine) {
        hasLoadedRef.current = true; // Mark as attempted even if offline
        return;
      }

      // Mark as loading immediately to prevent concurrent calls
      hasLoadedRef.current = true;
      
      try {
        console.log('[KanbanPage] Loading boards from API (one time only)...');
        const boards = await loadBoardsFromAPI();
        console.log('[KanbanPage] Loaded boards from API:', boards);
        
        if (boards && boards.length > 0) {
          // Get current boardId from ref
          const currentBoardId = boardIdRef.current;
          
          // Use the first board if no board is selected or if current is invalid
          if (!currentBoardId || currentBoardId === 'kanban-default' || currentBoardId === 'default' || currentBoardId.startsWith('kanban-')) {
            console.log('[KanbanPage] Setting boardId to first board:', boards[0].id);
            setBoardId(boards[0].id);
          } else {
            // Verify current boardId exists in loaded boards
            const boardExists = boards.some((b: any) => b.id === currentBoardId);
            if (!boardExists) {
              console.log('[KanbanPage] Current boardId not found in loaded boards, using first board');
              setBoardId(boards[0].id);
            } else {
              console.log('[KanbanPage] Current boardId is valid:', currentBoardId);
            }
          }
        } else {
          console.log('[KanbanPage] No boards found in API. User may need to create a board first.');
        }
      } catch (error) {
        console.error('[KanbanPage] Error loading boards:', error);
      }
    };

    loadBoards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

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

