'use client';

import { formatExecutionPlanEta } from '@/utils/osa/execution-planner';
import {
  parseExecutionGraph,
  type ExecutionGraph,
  type ExecutionTask,
} from '@/utils/osa/team-execution';

type OsaExecutionGraphPanelProps = {
  graph: ExecutionGraph | null;
};

function taskStatusLabel(status: ExecutionTask['status']): string {
  switch (status) {
    case 'ready':
      return 'Ready';
    case 'running':
      return 'Running';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'blocked':
      return 'Blocked';
    default:
      return 'Pending';
  }
}

export function OsaExecutionGraphPanel({ graph }: OsaExecutionGraphPanelProps) {
  if (!graph || graph.totalTasks === 0) {
    return (
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-6 text-sm text-[var(--text-secondary)]">
        Execution Graph недоступен для этого запуска.
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-4 sm:p-5">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Execution Graph</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Progress: {graph.progress}% · ETA: {formatExecutionPlanEta(graph.eta)} · Remaining tasks:{' '}
          {graph.remainingTasks}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-[var(--surface-1)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
            Total tasks
          </p>
          <p className="mt-1 text-xl font-semibold text-[var(--text-primary)]">
            {graph.totalTasks}
          </p>
        </div>
        <div className="rounded-xl bg-[var(--surface-1)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Completed</p>
          <p className="mt-1 text-xl font-semibold text-[var(--text-primary)]">
            {graph.completedTasks}
          </p>
        </div>
        <div className="rounded-xl bg-[var(--surface-1)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Failed</p>
          <p className="mt-1 text-xl font-semibold text-[var(--text-primary)]">
            {graph.failedTasks}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">Task Status</h3>
        <ul className="space-y-2">
          {graph.tasks.map((task) => (
            <li
              key={task.id}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-[var(--text-primary)]">{task.title}</p>
                <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">
                  {taskStatusLabel(task.status)}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Agent: {task.agentId} · Stage: {task.stageId} · {task.estimatedMinutes} min
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function parseOsaExecutionGraphFromRunInput(
  input: Record<string, unknown>,
): ExecutionGraph | null {
  return parseExecutionGraph(input.execution_graph ?? input.executionGraph);
}
