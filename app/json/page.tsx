'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { JsonCodeEditor } from '@/components/JsonCodeEditor';
import { Braces, Check, Copy, Minimize2, Trash2, Wand2 } from 'lucide-react';

const STORAGE_KEY = 'tarefy-json-editor';

const DEFAULT_JSON = `{
  "nome": "Tarefy",
  "ativo": true,
  "tags": ["json", "ferramentas"]
}`;

function parseJsonError(message: string, input: string): string {
  const match = message.match(/position (\d+)/i);
  if (!match) return message;

  const position = Number(match[1]);
  const before = input.slice(0, position);
  const lines = before.split('\n');
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;
  return `${message} (linha ${line}, coluna ${column})`;
}

export default function JsonPage() {
  const [input, setInput] = useState(DEFAULT_JSON);
  const [indent, setIndent] = useState<2 | 4>(2);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setInput(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, input);
  }, [input]);

  const stats = useMemo(() => {
    const lines = input.split('\n').length;
    const chars = input.length;
    return { lines, chars };
  }, [input]);

  const validate = useCallback((value: string) => {
    try {
      JSON.parse(value);
      setError(null);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'JSON inválido';
      setError(parseJsonError(message, value));
      return false;
    }
  }, []);

  const formatJson = () => {
    if (!validate(input)) return;
    const parsed = JSON.parse(input);
    setInput(JSON.stringify(parsed, null, indent));
  };

  const minifyJson = () => {
    if (!validate(input)) return;
    const parsed = JSON.parse(input);
    setInput(JSON.stringify(parsed));
  };

  const copyJson = async () => {
    await navigator.clipboard.writeText(input);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const clearJson = () => {
    setInput('');
    setError(null);
  };

  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <ParticlesBackground />
      <Header />
      <div className="relative z-10 flex flex-1 pt-16">
        <Sidebar />
        <main className="flex min-h-0 flex-1 flex-col pl-16">
          <div className="flex min-h-0 flex-1 flex-col px-6 py-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="flex items-center gap-2 text-3xl font-bold">
                  <Braces className="h-8 w-8 text-primary" />
                  JSON Editor
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cole, edite, valide e formate JSON no navegador.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 rounded-xl border border-border bg-card/80 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Indentação</span>
                  <select
                    value={indent}
                    onChange={(e) => setIndent(Number(e.target.value) as 2 | 4)}
                    className="rounded-md border border-border bg-background px-2 py-1 outline-none"
                  >
                    <option value={2}>2 espaços</option>
                    <option value={4}>4 espaços</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={formatJson}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Wand2 className="h-4 w-4" />
                  Formatar
                </button>
                <button
                  type="button"
                  onClick={minifyJson}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/40"
                >
                  <Minimize2 className="h-4 w-4" />
                  Minificar
                </button>
                <button
                  type="button"
                  onClick={() => void copyJson()}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/40"
                >
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
                <button
                  type="button"
                  onClick={clearJson}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/40"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpar
                </button>
              </div>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>{stats.lines} linhas</span>
              <span>{stats.chars} caracteres</span>
              {error ? (
                <span className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-red-400">
                  {error}
                </span>
              ) : input.trim() ? (
                <span className="rounded-lg border border-green-500/30 bg-green-500/10 px-2 py-1 text-green-400">
                  JSON válido
                </span>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 rounded-2xl border border-border bg-card/80 p-1 backdrop-blur">
              <JsonCodeEditor
                value={input}
                onChange={(value) => {
                  setInput(value);
                  if (error) validate(value);
                }}
                onBlur={() => {
                  if (input.trim()) validate(input);
                }}
                placeholder='Cole seu JSON aqui, ex: { "hello": "world" }'
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
