'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

export type JsonCodeEditorHandle = {
  formatDocument: () => Promise<void>;
  focus: () => void;
};

type JsonCodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  tabSize?: 2 | 4;
  className?: string;
};

export const JsonCodeEditor = forwardRef<JsonCodeEditorHandle, JsonCodeEditorProps>(
  function JsonCodeEditor({ value, onChange, onBlur, tabSize = 2, className = '' }, ref) {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    useImperativeHandle(ref, () => ({
      async formatDocument() {
        await editorRef.current?.getAction('editor.action.formatDocument')?.run();
      },
      focus() {
        editorRef.current?.focus();
      },
    }));

    useEffect(() => {
      editorRef.current?.getModel()?.updateOptions({ tabSize, insertSpaces: true });
    }, [tabSize]);

    const handleMount: OnMount = (editorInstance) => {
      editorRef.current = editorInstance;
      editorInstance.getModel()?.updateOptions({ tabSize, insertSpaces: true });
      editorInstance.onDidBlurEditorWidget(() => onBlur?.());
    };

    return (
      <div className={`h-full min-h-[420px] overflow-hidden rounded-xl ${className}`}>
        <Editor
          height="100%"
          language="json"
          theme="vs-dark"
          value={value}
          onChange={(nextValue) => onChange(nextValue ?? '')}
          onMount={handleMount}
          loading={
            <div className="flex h-full min-h-[420px] items-center justify-center text-sm text-muted-foreground">
              Carregando editor…
            </div>
          }
          options={{
            minimap: { enabled: true, scale: 1 },
            fontSize: 14,
            fontFamily: 'var(--font-geist-mono), Consolas, monospace',
            tabSize,
            insertSpaces: true,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            formatOnPaste: true,
            bracketPairColorization: { enabled: true },
            folding: true,
            foldingHighlight: true,
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            padding: { top: 12, bottom: 12 },
            scrollbar: {
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
          }}
        />
      </div>
    );
  },
);
