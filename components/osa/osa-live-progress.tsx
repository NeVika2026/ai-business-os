'use client';

import {
  formatExecutionProgressBar,
  formatExecutionProgressEta,
  type ExecutionProgress,
} from '@/utils/osa/execution-progress';

type OsaLiveProgressProps = {
  progress: ExecutionProgress | null;
  loading?: boolean;
};

export function OsaLiveProgress({ progress, loading = false }: OsaLiveProgressProps) {
  if (!progress && !loading) {
    return null;
  }

  const snapshot = progress ?? {
    currentTask: null,
    currentAgent: null,
    currentStage: null,
    completedTasks: [],
    runningTasks: [],
    failedTasks: [],
    blockedTasks: [],
    progress: 0,
    eta: 0,
    lastUpdate: new Date().toISOString(),
  };

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-4 sm:p-5">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Live Execution</h2>
          {loading ? (
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--accent)]">
              Running
            </span>
          ) : null}
        </div>
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
            Overall Progress
          </p>
          <p className="font-mono text-sm text-[var(--text-primary)]">
            {formatExecutionProgressBar(snapshot.progress)}
          </p>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Current Agent" value={snapshot.currentAgent ?? '—'} />
        <MetricCard label="Current Task" value={snapshot.currentTask ?? '—'} />
        <MetricCard label="Current Stage" value={snapshot.currentStage ?? '—'} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Completed" value={String(snapshot.completedTasks.length)} />
        <MetricCard label="Running" value={String(snapshot.runningTasks.length)} />
        <MetricCard label="Failed" value={String(snapshot.failedTasks.length)} />
        <MetricCard label="Blocked" value={String(snapshot.blockedTasks.length)} />
        <MetricCard label="Remaining ETA" value={formatExecutionProgressEta(snapshot)} />
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-1)] px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
