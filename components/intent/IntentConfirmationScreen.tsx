'use client';

import Link from 'next/link';

import type { IntentConfirmationData } from '@/utils/intent/intent-confirmation';

type IntentConfirmationScreenProps = {
  intent: IntentConfirmationData;
  onStart: () => void;
  starting?: boolean;
};

export function IntentConfirmationScreen({
  intent,
  onStart,
  starting = false,
}: IntentConfirmationScreenProps) {
  return (
    <section className="mx-auto w-full max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
          I think I understood your goal.
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Here&apos;s what I&apos;m going to prepare for you.
        </p>
      </header>

      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 space-y-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
            You selected
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{intent.goalTitle}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
            What I understood
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--text-primary)]">{intent.understood}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
            What I will analyze
          </p>
          <ul className="mt-2 space-y-1 text-sm text-[var(--text-primary)]">
            {intent.willAnalyze.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span aria-hidden="true" className="text-[var(--accent)]">
                  •
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
            What you will receive
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-[var(--text-primary)]">
            {intent.willReceive.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span aria-hidden="true" className="text-emerald-400">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
            Estimated time
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{intent.estimatedTime}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={starting}
          onClick={onStart}
          className="inline-flex flex-1 items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-white hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
        >
          {starting ? 'Starting...' : 'Start'}
        </button>
        <Link
          href="/home"
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-0)]"
        >
          Change Goal
        </Link>
      </div>
    </section>
  );
}
