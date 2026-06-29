import Link from 'next/link';

import type { HomeExecutionItem } from '@/utils/home/home-types';

type RecentExecutionsProps = {
  executions: HomeExecutionItem[];
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function RecentExecutions({ executions }: RecentExecutionsProps) {
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent executions</h2>
        <Link href="/history" className="text-sm text-[var(--accent)] hover:underline">
          View history
        </Link>
      </header>

      {executions.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">No executions yet.</p>
      ) : (
        <ul className="space-y-2">
          {executions.map((execution) => (
            <li key={execution.id}>
              <Link
                href={execution.href}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-3 py-2 hover:border-[var(--accent)]"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {execution.label}
                  </p>
                  <p className="text-xs capitalize text-[var(--text-secondary)]">
                    {execution.status} · {execution.duration}
                  </p>
                </div>
                <time className="text-xs text-[var(--text-secondary)]">
                  {formatTimestamp(execution.timestamp)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
