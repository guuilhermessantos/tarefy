'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="railway-gradient flex min-h-screen items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex max-w-2xl flex-col items-center gap-8 text-center"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className="text-6xl font-bold text-foreground md:text-7xl">
            Tarefy
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-muted-foreground md:text-xl"
        >
          Gerenciador de tarefas offline-first com canvas visual interativo.
          <br />
          Crie fluxos de trabalho conectados, estilo Railway.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Link href="/board">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground transition-all hover:bg-primary/90"
            >
              Começar
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </motion.button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground"
        >
          <span className="rounded-lg border border-border/50 bg-card/50 px-4 py-2">
            Offline-first
          </span>
          <span className="rounded-lg border border-border/50 bg-card/50 px-4 py-2">
            Canvas Visual
          </span>
          <span className="rounded-lg border border-border/50 bg-card/50 px-4 py-2">
            React Flow
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
