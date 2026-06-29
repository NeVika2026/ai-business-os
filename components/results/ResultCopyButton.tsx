'use client';

import { useState } from 'react';

type ResultCopyButtonProps = {
  text: string;
  label?: string;
};

export function ResultCopyButton({ text, label = 'Copy message' }: ResultCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="inline-flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    >
      {copied ? 'Copied' : label}
    </button>
  );
}
