'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Github,
  KanbanSquare,
  Timer,
  Workflow,
  MessageSquare,
  Shield,
  Database,
  Cloud,
} from 'lucide-react';
import { GitHubProfile } from '@/components/GitHubProfile';

export default function Home() {
  return (
    <div className="railway-gradient min-h-screen w-full relative">
      {/* Hero */}
      <section className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 pb-8 pt-20 md:px-8 md:pt-28">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center text-5xl font-bold tracking-tight text-foreground md:text-6xl"
        >
          Tarefy
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 max-w-2xl text-center text-lg text-muted-foreground md:text-xl"
        >
          Um dashboard para visualizar e gerenciar seu fluxo de trabalho.
          Offline-first, visual e simples de usar.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link href="/board" className="group">
            <span className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90">
              Abrir Flow Board
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
          <Link href="/kanban" className="group">
            <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-base font-semibold text-foreground transition-all hover:bg-card/80">
              Ver Kanban
              <KanbanSquare className="h-4 w-4" />
            </span>
          </Link>
        </motion.div>
        <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
          <span className="rounded-lg border border-border/50 bg-card/60 px-3 py-1">Offline-first</span>
          <span className="rounded-lg border border-border/50 bg-card/60 px-3 py-1">Canvas Visual</span>
          <span className="rounded-lg border border-border/50 bg-card/60 px-3 py-1">React Flow</span>
          <span className="rounded-lg border border-border/50 bg-card/60 px-3 py-1">Next.js 16</span>
        </div>
      </section>

      {/* Quick Apps */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-8 md:px-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <CardLink href="/board" title="Flow Board" description="Organize ideias em nós e conexões" icon={<Workflow className="h-5 w-5" />} />
          <CardLink href="/kanban" title="Kanban" description="Planeje com colunas e cartões" icon={<KanbanSquare className="h-5 w-5" />} />
          <CardLink href="/pomodoro" title="Pomodoro" description="Foco com sessões cronometradas" icon={<Timer className="h-5 w-5" />} />
          <CardLink href="/prompts" title="Prompts" description="Guarde e reutilize prompts úteis" icon={<MessageSquare className="h-5 w-5" />} />
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-12 md:px-8">
        <h2 className="mb-4 text-2xl font-semibold">Funcionalidades</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Feature title="Offline-first" description="Seus dados funcionam mesmo sem internet, sincronizando depois." icon={<Database className="h-5 w-5" />} />
          <Feature title="Fluxo visual" description="Arraste, conecte e reorganize nós para mapear processos." icon={<Workflow className="h-5 w-5" />} />
          <Feature title="Kanban simples" description="Quadros por colunas para execução do dia a dia." icon={<KanbanSquare className="h-5 w-5" />} />
          <Feature title="Foco com Pomodoro" description="Timers para manter ritmo e medir produtividade." icon={<Timer className="h-5 w-5" />} />
          <Feature title="Prompts salvos" description="Centralize prompts e snippets de texto para reuso." icon={<MessageSquare className="h-5 w-5" />} />
          <Feature title="Seguro por padrão" description="Arquitetado para privacidade local e mínima superfície de risco." icon={<Shield className="h-5 w-5" />} />
          <Feature title="Next.js + React" description="Stack moderna, rápida e familiar para contribuir." icon={<Cloud className="h-5 w-5" />} />
        </div>
      </section>

      {/* GitHub Profile */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-8 md:px-8">
        <h2 className="mb-4 text-2xl font-semibold">Desenvolvedor</h2>
        <GitHubProfile username="guuilhermessantos" />
      </section>

      {/* Open Source Callout */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20 md:px-8">
        <div className="rounded-2xl border border-border bg-card/80 p-6 md:p-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h3 className="text-xl font-semibold">Projeto Open Source</h3>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Este projeto será open source para ajudar outras pessoas a construírem seus próprios fluxos e melhorarem sua produtividade. Contribuições são bem-vindas!
              </p>
            </div>
            <a
              href="#"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold transition-colors hover:bg-muted/40"
            >
              <Github className="h-4 w-4" />
              Ver no GitHub (em breve)
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

type CardLinkProps = {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

function CardLink({ href, title, description, icon }: CardLinkProps) {
  return (
    <Link href={href} className="group">
      <div className="h-full rounded-2xl border border-border bg-card/80 p-5 transition-colors group-hover:bg-card">
        <div className="flex items-center gap-2 text-foreground">
          {icon}
          <span className="font-semibold">{title}</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}

type FeatureProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

function Feature({ title, description, icon }: FeatureProps) {
  return (
    <div className="rounded-2xl border border-border bg-card/80 p-5">
      <div className="flex items-center gap-2 text-foreground">
        {icon}
        <span className="font-semibold">{title}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
