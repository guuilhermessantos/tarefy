'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePromptsStore } from '@/lib/prompts-store';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ParticlesBackground } from '@/components/ParticlesBackground';

export default function PromptsPage() {
  const { prompts, addPrompt, deletePrompt, updatePrompt, load } = usePromptsStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');

  useEffect(() => {
    load();
  }, [load]);

  const allTags = useMemo(() => {
    const counter = new Map<string, number>();
    for (const p of prompts) {
      for (const t of p.tags || []) {
        counter.set(t, (counter.get(t) || 0) + 1);
      }
    }
    return Array.from(counter.entries()).sort((a, b) => b[1] - a[1]);
  }, [prompts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return prompts.filter((p) => {
      const matchesQuery = q
        ? p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q))
        : true;
      const matchesTag = selectedTag ? (p.tags || []).includes(selectedTag) : true;
      return matchesQuery && matchesTag;
    });
  }, [prompts, query, selectedTag]);

  const handleAdd = () => {
    if (!title.trim() || !content.trim()) return;
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    addPrompt({ title, content, tags });
    setTitle('');
    setContent('');
    setTagsInput('');
    setDrawerOpen(false);
  };

  const startEdit = (id: string) => {
    const p = prompts.find((x) => x.id === id);
    if (!p) return;
    setEditingId(id);
    setEditTitle(p.title);
    setEditContent(p.content);
    setEditTags((p.tags || []).join(', '));
  };

  const saveEdit = () => {
    if (!editingId) return;
    updatePrompt(editingId, {
      title: editTitle.trim(),
      content: editContent.trim(),
      tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
    setEditTags('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
    setEditTags('');
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyingId(id);
      setTimeout(() => setCopyingId(null), 1000);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  const selectedPrompt = useMemo(() => prompts.find(p => p.id === selectedId) || null, [prompts, selectedId]);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <ParticlesBackground />
      <Header />
      <div className="relative flex flex-1 flex-col pt-16 z-10">
        <Sidebar />
        <main className="flex-1 pl-16 overflow-hidden">
          <div className="flex h-full">
            <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-card/40 p-4 md:block">
              <div className="mb-4">
                <h2 className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Tags</h2>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                    selectedTag === null ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'
                  }`}
                >
                  <span>Todas</span>
                  <span className="text-xs text-muted-foreground">{prompts.length}</span>
                </button>
                {allTags.map(([tag, count]) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                      selectedTag === tag ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'
                    }`}
                  >
                    <span>#{tag}</span>
                    <span className="text-xs text-muted-foreground">{count}</span>
                  </button>
                ))}
              </div>
            </aside>

            <section className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-6xl p-6 md:p-8">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por título, conteúdo ou tag"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <div className="flex items-center gap-2">
                    <span className="hidden whitespace-nowrap rounded-md border border-border/60 bg-card/50 px-3 py-2 text-xs text-muted-foreground md:inline-block">
                      {filtered.length} resultado{filtered.length === 1 ? '' : 's'}
                    </span>
                    <button
                      onClick={() => {
                        setDrawerOpen(true);
                        setEditingId(null);
                        setTitle('');
                        setContent('');
                        setTagsInput('');
                      }}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Novo prompt
                    </button>
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
                    Sem resultados.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((p) => (
                      <div
                        key={p.id}
                        className={`group relative overflow-hidden rounded-xl border border-border/60 bg-card/50 p-4 transition hover:border-primary/60 ${
                          selectedId === p.id ? 'ring-2 ring-primary/50' : ''
                        }`}
                        onClick={() => setSelectedId(p.id)}
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <h3 className="line-clamp-1 text-base font-semibold">{p.title}</h3>
                          <div className="opacity-0 transition group-hover:opacity-100">
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(p.content, p.id);
                                }}
                                className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
                              >
                                {copyingId === p.id ? 'Copiado!' : 'Copiar'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEdit(p.id);
                                  setDrawerOpen(true);
                                }}
                                className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
                              >
                                Editar
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deletePrompt(p.id);
                                  if (selectedId === p.id) setSelectedId(null);
                                }}
                                className="rounded-md border border-destructive text-destructive px-2 py-1 text-xs hover:bg-destructive/10"
                              >
                                Excluir
                              </button>
                            </div>
                          </div>
                        </div>
                        {p.tags && p.tags.length > 0 && (
                          <div className="mb-3 flex flex-wrap gap-2">
                            {p.tags.slice(0, 3).map((t) => (
                              <span key={t} className="rounded-md border border-border/60 bg-background px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                                #{t}
                              </span>
                            ))}
                            {p.tags.length > 3 && (
                              <span className="rounded-md border border-border/60 bg-background px-2 py-1 text-[10px] text-muted-foreground">+{p.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                        <pre className="line-clamp-6 whitespace-pre-wrap rounded-lg border border-border/60 bg-background/70 p-3 text-xs">{p.content}</pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <aside className="hidden w-[380px] shrink-0 border-l border-border/60 bg-card/40 p-5 lg:block">
              {selectedPrompt ? (
                <div className="sticky top-20">
                  <div className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">Preview</div>
                  <h2 className="mb-3 text-xl font-semibold">{selectedPrompt.title}</h2>
                  {selectedPrompt.tags && selectedPrompt.tags.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {selectedPrompt.tags.map((t) => (
                        <span key={t} className="rounded-md border border-border/60 bg-background px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">#{t}</span>
                      ))}
                    </div>
                  )}
                  <pre className="whitespace-pre-wrap rounded-lg border border-border/60 bg-background/70 p-3 text-sm">{selectedPrompt.content}</pre>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => copyToClipboard(selectedPrompt.content, selectedPrompt.id)}
                      className="rounded-lg border border-border px-3 py-2 text-xs hover:bg-accent"
                    >
                      Copiar
                    </button>
                    <button
                      onClick={() => {
                        startEdit(selectedPrompt.id);
                        setDrawerOpen(true);
                      }}
                      className="rounded-lg border border-border px-3 py-2 text-xs hover:bg-accent"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="sticky top-20 text-sm text-muted-foreground">Selecione um prompt para visualizar.</div>
              )}
            </aside>
          </div>
        </main>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] flex">
          <div
            className="h-full w-full bg-background/60 backdrop-blur-sm"
            onClick={() => {
              setDrawerOpen(false);
              setEditingId(null);
            }}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-xl border-l border-border/60 bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingId ? 'Editar prompt' : 'Novo prompt'}</h3>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  setEditingId(null);
                }}
                className="rounded-md border border-border px-3 py-1 text-sm hover:bg-accent"
              >
                Fechar
              </button>
            </div>
            {editingId ? (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm text-muted-foreground">Título</label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm text-muted-foreground">Conteúdo</label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={12}
                    className="resize-y rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm text-muted-foreground">Tags (separadas por vírgula)</label>
                  <input
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={cancelEdit} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent">Cancelar</button>
                  <button onClick={saveEdit} className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Salvar</button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm text-muted-foreground">Título</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Esboço de e-mail de follow-up"
                    className="rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm text-muted-foreground">Conteúdo</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Cole ou escreva seu prompt aqui"
                    rows={12}
                    className="resize-y rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm text-muted-foreground">Tags (separadas por vírgula)</label>
                  <input
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="ex: email, vendas, pt-br"
                    className="rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setTitle('');
                      setContent('');
                      setTagsInput('');
                    }}
                    className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent"
                  >
                    Limpar
                  </button>
                  <button
                    onClick={handleAdd}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Salvar prompt
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


