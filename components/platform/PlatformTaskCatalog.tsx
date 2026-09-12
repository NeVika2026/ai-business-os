import Link from 'next/link';

import type { PlatformTask } from '@/utils/platform/business-zavod-config';

type PlatformTaskCatalogProps = {
  tasks: PlatformTask[];
  compact?: boolean;
};

export function PlatformTaskCatalog({ tasks, compact = false }: PlatformTaskCatalogProps) {
  return (
    <div
      className={
        compact
          ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'
          : 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'
      }
    >
      {tasks.map((task) => {
        const href = task.href ?? `/home?prompt=${encodeURIComponent(task.prompt)}`;

        return (
          <Link
            key={task.id}
            href={href}
            aria-label={`${task.title}: ${task.description}`}
            className="group rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 transition hover:-translate-y-0.5 hover:bg-[var(--surface-2)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{task.title}</h3>
                <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">{task.description}</p>
              </div>
              <span
                aria-hidden="true"
                className="mt-0.5 text-lg text-[var(--text-secondary)] transition group-hover:translate-x-0.5 group-hover:text-[var(--text-primary)]"
              >
                →
              </span>
            </div>
            {task.badge ? (
              <span className="mt-3 inline-flex rounded-full border border-[var(--border-subtle)] px-2 py-1 text-[11px] text-[var(--text-secondary)]">
                {task.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
