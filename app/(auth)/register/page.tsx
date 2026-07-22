'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Github, Chrome, ArrowLeft } from 'lucide-react';
import {
  getAbsoluteCallbackUrl,
  getOAuthSignInUrl,
  normalizeCallback,
  type OAuthProvider,
} from '@/lib/oauth';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const handleSignUp = (provider: OAuthProvider) => () => {
    const callbackUrl = getAbsoluteCallbackUrl(
      normalizeCallback(new URLSearchParams(window.location.search).get('callbackUrl'), '/board'),
    );
    window.location.assign(getOAuthSignInUrl(provider, callbackUrl));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (res.ok) {
      const callbackUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('callbackUrl') ?? '/board' : '/board';
      await signIn('credentials', { email, password, callbackUrl, redirect: true });
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Não foi possível criar a conta.');
    }
    setSubmitting(false);
  };

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
            <h1 className="text-2xl font-semibold">Criar conta</h1>
            <p className="mt-1 text-sm text-muted-foreground">Leva menos de um minuto</p>
          </div>

          <form onSubmit={handleRegister} className="mb-4 flex flex-col gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome (opcional)"
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-0 transition-colors placeholder:text-muted-foreground/70"
            />
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
              placeholder="Crie uma senha"
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none ring-0 transition-colors placeholder:text-muted-foreground/70"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? 'Criando conta…' : 'Criar conta com email'}
            </button>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </form>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleSignUp('github')}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/40"
            >
              <Github className="h-4 w-4" />
              Continuar com GitHub
            </button>
            <button
              onClick={handleSignUp('google')}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/40"
            >
              <Chrome className="h-4 w-4" />
              Continuar com Google
            </button>
          </div>

          <div className="mt-5 text-center text-xs text-muted-foreground">
            Criamos sua conta automaticamente no primeiro login.
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Já tem conta?</span>{' '}
            <Link href="/login" className="font-medium text-foreground hover:underline">
              Entrar
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


