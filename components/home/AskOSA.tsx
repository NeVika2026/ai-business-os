'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type AskOSAProps = {
  placeholders: string[];
};

export function AskOSA({ placeholders }: AskOSAProps) {
  const [prompt, setPrompt] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    if (placeholders.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % placeholders.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, [placeholders.length]);

  const placeholder =
    placeholders[placeholderIndex] ?? placeholders[0] ?? 'What would you like to achieve?';

  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">What do you need?</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Describe your goal and the platform will prepare the next step.
        </p>
      </header>

      <div className="space-y-3">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={4}
          placeholder={placeholder}
          className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-3 text-sm text-[var(--text-primary)]"
        />
        <div className="flex justify-end">
          <Link
            href="/home"
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
          >
            Continue on Today
          </Link>
        </div>
      </div>
    </section>
  );
}
