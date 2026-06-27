import type { AgentRunStatus } from '@/types/ai';
import type {
  OrchestratorEvent,
  OrchestratorMemorySnapshot,
  OrchestratorRun,
  OrchestratorRunEmployee,
  OrchestratorStats,
} from '@/types/orchestrator';

type RawEmployee = OrchestratorRunEmployee | OrchestratorRunEmployee[] | null;

type RawOrchestratorRun = Omit<OrchestratorRun, 'employee' | 'input' | 'output'> & {
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  employee: RawEmployee;
};

export function normalizeRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

export function mapOrchestratorRuns(rows: RawOrchestratorRun[]): OrchestratorRun[] {
  return rows.map((row) => ({
    ...row,
    input: row.input ?? {},
    output: row.output ?? null,
    employee: normalizeRelation(row.employee),
  }));
}

export function mapOrchestratorEvents(rows: OrchestratorEvent[]): OrchestratorEvent[] {
  return rows;
}

export function mapMemorySnapshots(
  rows: OrchestratorMemorySnapshot[],
): OrchestratorMemorySnapshot[] {
  return rows;
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatDuration(startedAt: string | null, completedAt: string | null) {
  if (!startedAt || !completedAt) {
    return '—';
  }

  const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();

  if (durationMs < 0) {
    return '—';
  }

  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }

  const seconds = Math.round(durationMs / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}m ${remainingSeconds}s`;
}

export function formatRunId(id: string) {
  return id.slice(0, 8);
}

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

const RUNNING_STATUSES = new Set<AgentRunStatus>(['pending', 'running']);

export function computeOrchestratorStats(runs: OrchestratorRun[]): OrchestratorStats {
  return {
    totalRuns: runs.length,
    successfulRuns: runs.filter((run) => run.status === 'completed').length,
    failedRuns: runs.filter((run) => run.status === 'failed').length,
    runningRuns: runs.filter((run) => RUNNING_STATUSES.has(run.status)).length,
    todayRuns: runs.filter((run) => isToday(run.created_at)).length,
  };
}

export const RUN_SELECT = `
  id,
  organization_id,
  ai_employee_id,
  status,
  input,
  output,
  error_message,
  tokens_input,
  tokens_output,
  started_at,
  completed_at,
  created_at,
  employee:ai_employee_id (
    id,
    name,
    role_title
  )
`;
