import Link from 'next/link';

import { RunStatusBadge } from '@/components/orchestrator/run-status';
import type { OrchestratorRun } from '@/types/orchestrator';
import { formatDateTime, formatDuration, formatRunId } from '@/utils/orchestrator/runs';

type RunSummaryProps = {
  run: OrchestratorRun;
};

export function RunSummary({ run }: RunSummaryProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Run {formatRunId(run.id)}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">Agent run details</p>
        </div>
        <RunStatusBadge status={run.status} />
      </div>

      <div className="grid gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">AI Employee</p>
          {run.employee ? (
            <Link
              href={`/ai-employees/${run.employee.id}`}
              className="mt-1 inline-block text-[var(--accent)] hover:underline"
            >
              {run.employee.name}
            </Link>
          ) : (
            <p className="mt-1 text-[var(--text-primary)]">—</p>
          )}
        </div>
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Role</p>
          <p className="mt-1 text-[var(--text-primary)]">{run.employee?.role_title ?? '—'}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Duration</p>
          <p className="mt-1 text-[var(--text-primary)]">
            {formatDuration(run.started_at, run.completed_at)}
          </p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Started</p>
          <p className="mt-1 text-[var(--text-primary)]">{formatDateTime(run.started_at)}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Finished</p>
          <p className="mt-1 text-[var(--text-primary)]">{formatDateTime(run.completed_at)}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Created</p>
          <p className="mt-1 text-[var(--text-primary)]">{formatDateTime(run.created_at)}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Tokens In</p>
          <p className="mt-1 text-[var(--text-primary)]">{run.tokens_input ?? '—'}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Tokens Out</p>
          <p className="mt-1 text-[var(--text-primary)]">{run.tokens_output ?? '—'}</p>
        </div>
        {run.error_message ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-sm text-[var(--text-secondary)]">Error</p>
            <p className="mt-1 text-sm text-red-300">{run.error_message}</p>
          </div>
        ) : null}
        {run.output ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-sm text-[var(--text-secondary)]">Output</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-[var(--surface-0)] p-3 text-xs text-[var(--text-primary)]">
              {JSON.stringify(run.output, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>
    </section>
  );
}
