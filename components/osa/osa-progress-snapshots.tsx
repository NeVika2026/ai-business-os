'use client';

import {
  formatExecutionProgressBar,
  formatExecutionProgressEta,
  type ExecutionProgressSnapshot,
} from '@/utils/osa/execution-progress';
import { formatDateTime } from '@/utils/orchestrator/runs';

type OsaProgressSnapshotsPanelProps = {
  snapshots: ExecutionProgressSnapshot[];
};

export function OsaProgressSnapshotsPanel({ snapshots }: OsaProgressSnapshotsPanelProps) {
  if (snapshots.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-4 sm:p-5">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Progress Snapshots</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          {snapshots.length} update{snapshots.length === 1 ? '' : 's'} during execution
        </p>
      </header>

      <ol className="space-y-3">
        {snapshots.map((snapshot) => (
          <li
            key={snapshot.id}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-sm text-[var(--text-primary)]">
                {formatExecutionProgressBar(snapshot.progress)}
              </p>
              <time className="text-xs text-[var(--text-secondary)]">
                {formatDateTime(snapshot.createdAt)}
              </time>
            </div>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {snapshot.currentAgent ?? '—'} · {snapshot.currentTask ?? '—'} ·{' '}
              {snapshot.currentStage ?? '—'}
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Completed {snapshot.completedTasks.length} · Running {snapshot.runningTasks.length} ·
              Failed {snapshot.failedTasks.length} · Blocked {snapshot.blockedTasks.length} · ETA{' '}
              {formatExecutionProgressEta(snapshot)}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
