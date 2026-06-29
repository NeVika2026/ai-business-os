import Link from 'next/link';

import type { ResultAction } from '@/utils/results/result-mappers';

type ResultActionsProps = {
  actions: ResultAction[];
};

export function ResultActions({ actions }: ResultActionsProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Actions</h2>
        <p className="text-sm text-[var(--text-secondary)]">Manage this result</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {actions.map((action) =>
          action.href && !action.disabled ? (
            <Link
              key={action.id}
              href={action.href}
              className="inline-flex items-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-0)]"
            >
              {action.label}
            </Link>
          ) : (
            <span
              key={action.id}
              aria-disabled="true"
              className="inline-flex cursor-not-allowed items-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] opacity-60"
            >
              {action.label}
            </span>
          ),
        )}
      </div>
    </section>
  );
}
