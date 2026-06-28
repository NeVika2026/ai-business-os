import Link from 'next/link';

import { RunStatusBadge } from '@/components/orchestrator/run-status';
import type { OrchestratorRun } from '@/types/orchestrator';
import { formatDateTime, formatDuration, formatRunId } from '@/utils/orchestrator/runs';
import { getOsaRunGoal, getOsaRuntimeMode, getOsaRunTeam } from '@/utils/osa/osa-runs';

type RunsTableProps = {
  runs: OrchestratorRun[];
  title?: string;
  description?: string;
  showViewAll?: boolean;
  variant?: 'orchestrator' | 'osa';
  selectedRunId?: string | null;
  onSelectRun?: (runId: string) => void;
};

const ORCHESTRATOR_HEADINGS = ['ID', 'AI Employee', 'Статус', 'Started', 'Finished', 'Duration'];
const OSA_HEADINGS = ['Goal', 'Team', 'Статус', 'Runtime mode', 'Started', 'Finished', 'Duration'];

export function RunsTable({
  runs,
  title = 'Agent Runs',
  description = 'Execution history',
  showViewAll = false,
  variant = 'orchestrator',
  selectedRunId = null,
  onSelectRun,
}: RunsTableProps) {
  const headings = variant === 'osa' ? OSA_HEADINGS : ORCHESTRATOR_HEADINGS;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              {headings.map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="px-3 py-3 text-left font-medium text-[var(--text-secondary)] sm:px-4"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--surface-0)]">
            {runs.length === 0 ? (
              <tr>
                <td
                  colSpan={headings.length}
                  className="px-4 py-8 text-center text-[var(--text-secondary)]"
                >
                  Запусков пока нет.
                </td>
              </tr>
            ) : variant === 'osa' ? (
              runs.map((run) => {
                const isSelected = selectedRunId === run.id;

                return (
                  <tr
                    key={run.id}
                    className={`cursor-pointer transition-colors hover:bg-[var(--surface-1)] ${
                      isSelected ? 'bg-[var(--accent-soft)]' : ''
                    }`}
                    onClick={() => onSelectRun?.(run.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelectRun?.(run.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isSelected}
                    aria-label={`Открыть timeline запуска ${formatRunId(run.id)}`}
                  >
                    <td className="max-w-[220px] px-3 py-3 font-medium text-[var(--text-primary)] sm:max-w-xs sm:px-4">
                      <span className="line-clamp-2">{getOsaRunGoal(run)}</span>
                    </td>
                    <td className="min-w-[180px] px-3 py-3 text-[var(--text-secondary)] sm:px-4">
                      <span className="line-clamp-2">{getOsaRunTeam(run)}</span>
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      <RunStatusBadge status={run.status} />
                    </td>
                    <td className="px-3 py-3 text-[var(--text-secondary)] sm:px-4">
                      {getOsaRuntimeMode(run)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-[var(--text-secondary)] sm:px-4">
                      {formatDateTime(run.started_at)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-[var(--text-secondary)] sm:px-4">
                      {formatDateTime(run.completed_at)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-[var(--text-secondary)] sm:px-4">
                      {formatDuration(run.started_at, run.completed_at)}
                    </td>
                  </tr>
                );
              })
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
