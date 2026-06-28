import Link from 'next/link';

import { CABINET_LAYOUT } from '@/utils/cabinet/cabinet-config';
import type { QuickActionWithCount } from '@/utils/cabinet/dashboard-mappers';

type QuickActionsProps = {
  actions: QuickActionWithCount[];
};

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Quick Actions</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Shortcuts with live platform counts
        </p>
      </header>

      <div className={CABINET_LAYOUT.quickActions}>
        {actions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span aria-hidden="true">{action.icon}</span>
              <span className="truncate">{action.label}</span>
            </span>
            <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
              {action.count}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
