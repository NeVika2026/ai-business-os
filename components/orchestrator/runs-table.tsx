import Link from 'next/link';

import { RunStatusBadge } from '@/components/orchestrator/run-status';
import type { OrchestratorRun } from '@/types/orchestrator';
import { formatDateTime, formatDuration, formatRunId } from '@/utils/orchestrator/runs';

type RunsTableProps = {
  runs: OrchestratorRun[];
  title?: string;
  description?: string;
  showViewAll?: boolean;
};

export function RunsTable({
  runs,
  title = 'Agent Runs',
  description = 'Execution history',
  showViewAll = false,
}: RunsTableProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
          <p className="text-sm text-[var(--text-secondary)]">{description}</p>
        </div>
        {showViewAll ? (
          <Link
            href="/orchestrator/runs"
            className="text-sm text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            Все запуски →
          </Link>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)]">
        <table className="min-w-full divide-y divide-[var(--border-subtle)] text-sm">
          <thead className="bg-[var(--surface-1)]">
            <tr>
              {['ID', 'AI Employee', 'Статус', 'Started', 'Finished', 'Duration'].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--surface-0)]">
            {runs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-secondary)]">
                  Запусков пока нет.
                </td>
              </tr>
            ) : (
              runs.map((run) => (
                <tr key={run.id} className="hover:bg-[var(--surface-1)]">
                  <td className="px-4 py-3">
                    <Link
                      href={`/orchestrator/runs/${run.id}`}
                      className="font-mono text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    >
                      {formatRunId(run.id)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--text-primary)]">
                      {run.employee?.name ?? '—'}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      {run.employee?.role_title ?? '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RunStatusBadge status={run.status} />
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {formatDateTime(run.started_at)}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {formatDateTime(run.completed_at)}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {formatDuration(run.started_at, run.completed_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
