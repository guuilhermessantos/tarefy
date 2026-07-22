'use client';

import { useCallback, useMemo, useRef } from 'react';

type JsonCodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
};

type TokenKind = 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punctuation' | 'text';

const TOKEN_REGEX =
  /"(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\],:]|\s+/g;

const TOKEN_CLASS: Record<TokenKind, string> = {
  key: 'text-sky-400',
  string: 'text-emerald-400',
  number: 'text-amber-300',
  boolean: 'text-purple-400',
  null: 'text-orange-400',
  punctuation: 'text-zinc-400',
  text: 'text-foreground',
};

function classifyToken(token: string): TokenKind {
  if (/^true$|^false$/.test(token)) return 'boolean';
  if (/^null$/.test(token)) return 'null';
  if (/^-?\d/.test(token)) return 'number';
  if (/^[{}\[\],:]$/.test(token)) return 'punctuation';
  if (/^"(?:\\.|[^"\\])*"$/.test(token)) return 'string';
  return 'text';
}

function tokenizeJson(code: string) {
  const tokens: { value: string; kind: TokenKind }[] = [];
  let match: RegExpExecArray | null;
  let lastIndex = 0;

  while ((match = TOKEN_REGEX.exec(code)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ value: code.slice(lastIndex, match.index), kind: 'text' });
    }

    const value = match[0];
    const rest = code.slice(match.index + value.length);
    const kind =
      /^"(?:\\.|[^"\\])*"$/.test(value) && /^\s*:/.test(rest) ? 'key' : classifyToken(value);

    tokens.push({ value, kind });
    lastIndex = match.index + value.length;
  }

  if (lastIndex < code.length) {
    tokens.push({ value: code.slice(lastIndex), kind: 'text' });
  }

  return tokens;
}

export function JsonCodeEditor({
  value,
  onChange,
  onBlur,
  placeholder,
  className = '',
}: JsonCodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  const highlighted = useMemo(() => tokenizeJson(value), [value]);

  const syncScroll = useCallback(() => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    if (!textarea || !highlight) return;
    highlight.scrollTop = textarea.scrollTop;
    highlight.scrollLeft = textarea.scrollLeft;
  }, []);

  return (
    <div className={`relative min-h-[420px] overflow-hidden rounded-xl bg-background/80 ${className}`}>
      <pre
        ref={highlightRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 m-0 overflow-auto p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words"
      >
        <code>
          {value
            ? highlighted.map((token, index) => (
                <span key={index} className={TOKEN_CLASS[token.kind]}>
                  {token.value}
                </span>
              ))
            : null}
        </code>
      </pre>

      {!value && placeholder ? (
        <div className="pointer-events-none absolute left-4 top-4 font-mono text-sm text-muted-foreground/60">
          {placeholder}
        </div>
      ) : null}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        onScroll={syncScroll}
        spellCheck={false}
        className="relative h-full min-h-[420px] w-full resize-none bg-transparent p-4 font-mono text-sm leading-relaxed text-transparent caret-foreground outline-none selection:bg-primary/30"
      />
    </div>
  );
}
