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
  const { activeBoardId, loadBoards, addBoard, isLoading } = useBoardsStore();
  const { setBoardId } = useBoardStore();

  useEffect(() => {
    void loadBoards();
  }, [loadBoards]);

  useEffect(() => {
    if (activeBoardId) {
      setBoardId(activeBoardId);
    }
  }, [activeBoardId, setBoardId]);

  const handleCreateFirstBoard = async () => {
    const name = window.prompt('Nome do fluxo:');
    if (!name?.trim()) return;
    const id = await addBoard(name.trim());
    if (id) setBoardId(id);
  };

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
              {activeBoardId ? (
                <FlowBoard key={activeBoardId} />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">
                      {isLoading ? 'Carregando fluxos...' : 'Nenhum fluxo criado ainda'}
                    </p>
                    {!isLoading && (
                      <button
                        onClick={() => void handleCreateFirstBoard()}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Criar primeiro fluxo
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

