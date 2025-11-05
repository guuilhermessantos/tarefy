'use client';

import { useEffect } from 'react';
import { FlowBoard } from '@/components/FlowBoard';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { BoardTabs } from '@/components/BoardTabs';
import { useBoardsStore } from '@/lib/boards-store';
import { useBoardStore } from '@/lib/store';

export default function BoardPage() {
  const { activeBoardId, loadBoards } = useBoardsStore();
  const { setBoardId } = useBoardStore();

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  useEffect(() => {
    if (activeBoardId) {
      setBoardId(activeBoardId);
    }
  }, [activeBoardId, setBoardId]);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <ParticlesBackground />
      <Header />
      <div className="relative flex flex-1 flex-col pt-16 z-10">
        <Sidebar />
        <div className="flex flex-1 pl-16 overflow-hidden">
          <main className="flex flex-1 flex-col overflow-hidden">
            <BoardTabs />
            <div className="flex-1 overflow-hidden">
              {activeBoardId && <FlowBoard />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

