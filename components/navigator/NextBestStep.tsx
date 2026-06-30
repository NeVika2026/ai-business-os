'use client';

import { useState } from 'react';

import type { NavigatorStep, NavigatorStepId } from '@/types/navigator';
import { DEFAULT_NEXT_BEST_STEP } from '@/utils/navigator/default-next-steps';

type NextBestStepProps = {
  title?: string;
  subtitle?: string;
  steps?: NavigatorStep[];
  onSelect?: (step: NavigatorStep) => void;
};

export function NextBestStep({
  title = DEFAULT_NEXT_BEST_STEP.title,
  subtitle = DEFAULT_NEXT_BEST_STEP.subtitle,
  steps = DEFAULT_NEXT_BEST_STEP.steps,
  onSelect,
}: NextBestStepProps) {
  const [selectedId, setSelectedId] = useState<NavigatorStepId | null>(null);

  const handleSelect = (step: NavigatorStep) => {
    setSelectedId(step.id);
    onSelect?.(step);
  };

  return (
    <section
      className="mt-10"
      aria-labelledby="next-best-step-heading"
      aria-describedby="next-best-step-subtitle"
    >
      <div className="text-center">
        <h2
          id="next-best-step-heading"
          className="text-xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-2xl"
        >
          {title}
        </h2>
        <p
          id="next-best-step-subtitle"
          className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base"
        >
          {subtitle}
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {steps.map((step) => {
          const isSelected = selectedId === step.id;

          return (
            <article
              key={step.id}
              className={`flex h-full flex-col rounded-xl border px-5 py-6 transition ${
                isSelected
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                  : 'border-[var(--border-subtle)] bg-[var(--surface-0)] hover:border-[var(--accent)] hover:bg-[var(--surface-1)]'
              }`}
            >
              <p className="text-2xl" aria-hidden="true">
                {step.emoji}
              </p>

              <h3 className="mt-4 text-sm font-medium text-[var(--text-primary)]">{step.title}</h3>

              <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                {step.description}
              </p>

              <button
                type="button"
                onClick={() => handleSelect(step)}
                aria-pressed={isSelected}
                className={`mt-6 w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-0)] ${
                  isSelected
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-white hover:opacity-90'
                    : 'border-[var(--border-subtle)] bg-[var(--surface-0)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--surface-1)]'
                }`}
              >
                {step.buttonLabel}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
