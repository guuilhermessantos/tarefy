'use client';

import { KanbanBoard } from '@/components/KanbanBoard';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ParticlesBackground } from '@/components/ParticlesBackground';

export default function KanbanPage() {
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

