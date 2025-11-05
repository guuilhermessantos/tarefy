'use client';

import { Home, LayoutGrid, Settings, Plus, Columns, Timer } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: LayoutGrid, label: 'Boards', href: '/board' },
  { icon: Columns, label: 'Kanban', href: '/kanban' },
  { icon: Timer, label: 'Pomodoro', href: '/pomodoro' },
  { icon: Settings, label: 'Config', href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 bottom-0 z-40 w-16 border-r border-border/50 bg-card/80 backdrop-blur-md">
      <div className="flex h-full flex-col items-center gap-2 py-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`group relative flex h-12 w-12 items-center justify-center rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
                title={item.label}
              >
                <Icon className="h-5 w-5" />
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute inset-0 rounded-xl bg-primary"
                    initial={false}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            </Link>
          );
        })}
        
        <div className="mt-auto">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground transition-all hover:bg-secondary/80"
            title="Novo Quadro"
          >
            <Plus className="h-5 w-5" />
          </motion.button>
        </div>
      </div>
    </aside>
  );
}

