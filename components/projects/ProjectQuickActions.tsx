import Link from 'next/link';

import type { ProjectQuickAction } from '@/utils/projects/project-types';

type ProjectQuickActionsProps = {
  actions: ProjectQuickAction[];
};

export function ProjectQuickActions({ actions }: ProjectQuickActionsProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Quick actions</h2>
      </header>

      <div className="grid gap-2 sm:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            aria-disabled={!action.enabled}
            className={`flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-sm transition ${
              action.enabled
                ? 'bg-[var(--surface-0)] hover:border-[var(--accent)]'
                : 'pointer-events-none opacity-50'
            }`}
          >
            <span aria-hidden="true">{action.icon}</span>
            <span className="font-medium text-[var(--text-primary)]">{action.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
