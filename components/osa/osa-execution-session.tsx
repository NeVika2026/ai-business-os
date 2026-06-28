'use client';

import { formatExecutionPlanEta } from '@/utils/osa/execution-planner';
import type { ExecutionSession } from '@/utils/osa/team-runtime';

type OsaExecutionSessionPanelProps = {
  session: ExecutionSession | null;
};

function stateLabel(state: ExecutionSession['state']): string {
  switch (state) {
    case 'running':
      return 'Running';
    case 'paused':
      return 'Paused';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Idle';
  }
}

export function OsaExecutionSessionPanel({ session }: OsaExecutionSessionPanelProps) {
  if (!session) {
    return null;
  }

  const currentStage = session.graph.stages.find((stage) => stage.id === session.currentStage);

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-4 sm:p-5">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Team Runtime</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          State: {stateLabel(session.state)} · Progress: {session.progress}% · Remaining ETA:{' '}
          {formatExecutionPlanEta(session.eta)}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Current Stage"
          value={currentStage?.title ?? session.currentStage ?? '—'}
        />
        <MetricCard label="Completed" value={String(session.completedTasks.length)} />
        <MetricCard label="Running" value={String(session.runningTasks.length)} />
        <MetricCard label="Blocked" value={String(session.blockedTasks.length)} />
        <MetricCard label="Failed" value={String(session.failedTasks.length)} />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">Execution Steps</h3>
        {session.steps.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">
            Steps will appear as tasks execute.
          </p>
        ) : (
          <ul className="space-y-2">
            {session.steps.map((step) => (
              <li
                key={step.id}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 text-sm"
              >
                <p className="font-medium text-[var(--text-primary)]">
                  {step.stageId} · {step.status}
                </p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Tasks: {step.taskIds.join(', ')}
                </p>
              </li>
            ))}
          </ul>
        )}
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
