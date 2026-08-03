'use client';

import { signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Github, ArrowLeft, ArrowRight, Chrome } from 'lucide-react';
import { getAuthErrorMessage, normalizeCallback, notifyOpenerAndClose, type OAuthProvider } from '@/lib/oauth';
import { useOAuthSignIn } from '@/lib/use-oauth-signin';

type ProviderMap = Partial<Record<OAuthProvider, { id: string; name: string }>>;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [oauthStatus, setOauthStatus] = useState<ProviderMap>({});
  const { signIn: signInWithOAuth, loadingProvider, error: oauthError } = useOAuthSignIn();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('error');
    if (!authError) return;

    const message = getAuthErrorMessage(authError);
    // Se o NextAuth redirecionou o erro para /login *dentro do popup* (ex.: conta já vinculada a
    // outro provider), avisamos a janela principal e fechamos, em vez de mostrar o formulário
    // de login inteiro dentro da janelinha pequena.
    if (!notifyOpenerAndClose({ error: message, next: '/board' })) {
      setError(message);
    }
  }, []);

  useEffect(() => {
    if (oauthError) setError(oauthError);
  }, [oauthError]);

  useEffect(() => {
    void fetch('/api/auth/providers')
      .then((response) => response.json())
      .then((data: ProviderMap) => setOauthStatus(data))
      .catch(() => setOauthStatus({}));
  }, []);

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const callbackUrl = normalizeCallback(
      new URLSearchParams(window.location.search).get('callbackUrl'),
    );
    const result = await signIn('credentials', { email, password, callbackUrl, redirect: false });
    if (result?.ok && !result.error) {
      window.location.assign(result.url ?? callbackUrl);
      return;
    }

    setError('Email ou senha inválidos.');
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
            <img src="/logo.png" alt="Tarefy" className="mx-auto mb-4 h-14 w-14 rounded-xl" />
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
          </form>

          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

          {!oauthStatus.google && Object.keys(oauthStatus).length > 0 && (
            <p className="mb-4 text-xs text-amber-400">
              Google ainda não aparece no servidor. Confira GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e faça redeploy na Vercel.
            </p>
          )}

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={signInWithOAuth('github')}
              disabled={loadingProvider !== null}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/40 disabled:opacity-60"
            >
              <Github className="h-4 w-4" />
              {loadingProvider === 'github' ? 'Aguardando login…' : 'Continuar com GitHub'}
            </button>
            <button
              type="button"
              onClick={signInWithOAuth('google')}
              disabled={loadingProvider !== null}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/40 disabled:opacity-60"
            >
              <Chrome className="h-4 w-4" />
              {loadingProvider === 'google' ? 'Aguardando login…' : 'Continuar com Google'}
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
