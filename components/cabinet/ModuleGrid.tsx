import Link from 'next/link';

import { CABINET_LAYOUT } from '@/utils/cabinet/cabinet-config';
import type { ModuleWithCount } from '@/utils/cabinet/dashboard-mappers';

type ModuleGridProps = {
  modules: ModuleWithCount[];
};

export function ModuleGrid({ modules }: ModuleGridProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Modules</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Central operating system modules with live counters
        </p>
      </header>

      <div className={CABINET_LAYOUT.moduleGrid}>
        {modules.map((module) => (
          <Link
            key={module.id}
            href={module.href}
            className="group rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-3 transition hover:border-[var(--accent)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <div className="flex items-start justify-between gap-2">
              <span aria-hidden="true" className="text-xl">
                {module.icon}
              </span>
              <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-primary)]">
                {module.count}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{module.label}</p>
            <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">
              {module.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
