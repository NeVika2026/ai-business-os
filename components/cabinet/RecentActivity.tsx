import Link from 'next/link';

import { CABINET_LAYOUT } from '@/utils/cabinet/cabinet-config';
import type { ActivityItem, ExecutionHistoryItem } from '@/utils/cabinet/dashboard-mappers';
import { formatDateTime } from '@/utils/orchestrator/runs';

type RecentActivityProps = {
  activity: ActivityItem[];
  history: ExecutionHistoryItem[];
};

const CATEGORY_LABELS: Record<ActivityItem['category'], string> = {
  osa: 'OSA',
  projects: 'Projects',
  documents: 'Documents',
  automation: 'Automation',
  other: 'Platform',
};

export function RecentActivity({ activity, history }: RecentActivityProps) {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
        <header className="mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Activity</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Latest platform events across OSA, projects, documents, and automation
          </p>
        </header>

        {activity.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
            No recent activity yet.
          </div>
        ) : (
          <ol className="space-y-3">
            {activity.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--accent)]">
                      {CATEGORY_LABELS[item.category]}
                    </p>
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="text-sm font-semibold text-[var(--text-primary)] hover:underline"
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {item.title}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{item.subtitle}</p>
                  </div>
                  <time className="text-xs text-[var(--text-secondary)]">
                    {formatDateTime(item.timestamp)}
                  </time>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Execution History</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Latest AI runs across the platform
            </p>
          </div>
          <Link
            href="/history"
            className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
          >
            View all
          </Link>
        </header>

        {history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
            No executions yet.
          </div>
        ) : (
          <div className={CABINET_LAYOUT.widgetGrid}>
            {history.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-4 transition hover:bg-[var(--surface-2)]"
              >
                <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                  {item.mode}
                </p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold text-[var(--text-primary)]">
                  {item.label}
                </p>
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  {item.status} · {item.duration} · {formatDateTime(item.timestamp)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
