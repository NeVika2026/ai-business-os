import Link from 'next/link';

import { formatProjectDate } from '@/utils/projects/project-mappers';
import type { ProjectModule } from '@/utils/projects/project-types';

type ProjectModulesProps = {
  modules: ProjectModule[];
};

export function ProjectModules({ modules }: ProjectModulesProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Modules</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          OSA, documents, knowledge, CRM, automation, and vertical modules
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <Link
            key={module.id}
            href={module.href}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-3 transition hover:border-[var(--accent)]"
          >
            <div className="flex items-start justify-between gap-2">
              <span aria-hidden="true" className="text-xl">
                {module.icon}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  module.enabled
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'
                }`}
              >
                {module.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{module.label}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{module.count} items</p>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">
              Latest:{' '}
              {module.latestActivity ? formatProjectDate(module.latestActivity) : 'No activity'}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
