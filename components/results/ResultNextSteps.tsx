import Link from 'next/link';

import type { ResultNextStep } from '@/utils/results/result-mappers';

type ResultNextStepsProps = {
  steps: ResultNextStep[];
};

export function ResultNextSteps({ steps }: ResultNextStepsProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Next steps</h2>
        <p className="text-sm text-[var(--text-secondary)]">Keep momentum after this result</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {steps.map((step) => (
          <Link
            key={step.id}
            href={step.href}
            className={
              step.primary
                ? 'inline-flex items-center rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90'
                : 'inline-flex items-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-0)]'
            }
          >
            {step.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
