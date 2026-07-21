'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Github, ArrowLeft, ArrowRight, Chrome } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const handleSignIn = (provider: 'github' | 'google') => () => {
    const callbackUrl = typeof window !== 'undefined'
      ? normalizeCallback(new URLSearchParams(window.location.search).get('callbackUrl'))
      : '/board';
    void signIn(provider, { callbackUrl });
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const callbackUrl = typeof window !== 'undefined'
      ? normalizeCallback(new URLSearchParams(window.location.search).get('callbackUrl'))
      : '/board';
    const result = await signIn('credentials', { email, password, callbackUrl, redirect: false });
    if (result?.ok && !result.error) {
      window.location.assign(result.url ?? callbackUrl);
      return;
    }

    setError('Email ou senha inválidos.');
    setSubmitting(false);
  };

  function normalizeCallback(param: string | null): string {
    try {
      if (!param) return '/board';
      // If absolute URL and same origin, convert to path+search; otherwise fallback
      if (param.includes('://')) {
        const u = new URL(param);
        if (typeof window !== 'undefined' && u.origin === window.location.origin) {
          return u.pathname + u.search;
        }
        return '/board';
      }
      // Ensure leading slash
      return param.startsWith('/') ? param : `/${param}`;
    } catch {
      return '/board';
    }
  }

  return (
    <div className="railway-gradient flex min-h-screen items-center justify-center px-6 py-12 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold">Entrar</h1>
            <p className="mt-1 text-sm text-muted-foreground">Bem-vindo de volta ao Tarefy</p>
          </div>

          <form onSubmit={handleCredentials} className="mb-4 flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu email"
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-0 transition-colors placeholder:text-muted-foreground/70"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-0 transition-colors placeholder:text-muted-foreground/70"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? 'Entrando…' : 'Entrar com email e senha'}
            </button>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </form>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleSignIn('github')}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/40"
            >
              <Github className="h-4 w-4" />
              Continuar com GitHub
            </button>
            <button
              onClick={handleSignIn('google')}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/40"
            >
              <Chrome className="h-4 w-4" />
              Continuar com Google
            </button>
          </div>

          <div className="mt-5 text-center text-xs text-muted-foreground">
            Ao continuar, você concorda com nossos Termos e Política de Privacidade.
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Novo por aqui?</span>{' '}
            <Link href="/register" className="inline-flex items-center gap-1 font-medium text-foreground hover:underline">
              Criar conta
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


