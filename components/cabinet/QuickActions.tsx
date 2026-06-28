import Link from 'next/link';

import { CABINET_LAYOUT, CABINET_QUICK_ACTIONS } from '@/utils/cabinet/cabinet-config';

export function QuickActions() {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Quick Actions</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Shortcuts to core operating system flows
        </p>
      </header>

      <div className={CABINET_LAYOUT.quickActions}>
        {CABINET_QUICK_ACTIONS.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <span aria-hidden="true">{action.icon}</span>
            <span className="truncate">{action.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
