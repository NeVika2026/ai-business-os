'use client';

import Link from 'next/link';

import type { IntentClarification } from '@/utils/intent/intent-confirmation';

type IntentClarificationQuestionProps = {
  clarification: IntentClarification;
  onSelect: (optionId: string) => void;
};

export function IntentClarificationQuestion({
  clarification,
  onSelect,
}: IntentClarificationQuestionProps) {
  return (
    <section className="mx-auto w-full max-w-xl space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
          One quick question
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          This helps me prepare the right result for you.
        </p>
      </header>

      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6 text-center">
        <p className="text-base text-[var(--text-primary)]">{clarification.question}</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {clarification.options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-5 py-3 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/10"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/home"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] hover:underline"
        >
          Change Goal
        </Link>
      </div>
    </section>
  );
}
