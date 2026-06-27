export interface RuntimeCheckpoint {
  runId: string;
  organizationId: string;
  stage: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface RuntimeExecutionHistoryEntry {
  runId: string;
  organizationId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt: string | null;
  checkpointCount: number;
}

const checkpoints = new Map<string, RuntimeCheckpoint>();
const history = new Map<string, RuntimeExecutionHistoryEntry>();

function checkpointKey(runId: string, stage: string): string {
  return `${runId}:${stage}`;
}

export function saveRuntimeCheckpoint(
  input: Omit<RuntimeCheckpoint, 'createdAt' | 'updatedAt'>,
): RuntimeCheckpoint {
  const key = checkpointKey(input.runId, input.stage);
  const existing = checkpoints.get(key);
  const now = new Date().toISOString();
  const record: RuntimeCheckpoint = {
    ...input,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  checkpoints.set(key, record);
  return record;
}

export function getRuntimeCheckpoint(runId: string, stage: string): RuntimeCheckpoint | null {
  return checkpoints.get(checkpointKey(runId, stage)) ?? null;
}

export function listRuntimeCheckpoints(runId: string): RuntimeCheckpoint[] {
  return Array.from(checkpoints.values())
    .filter((entry) => entry.runId === runId)
    .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt));
}

export function recordExecutionStart(
  runId: string,
  organizationId: string,
): RuntimeExecutionHistoryEntry {
  const entry: RuntimeExecutionHistoryEntry = {
    runId,
    organizationId,
    status: 'running',
    startedAt: new Date().toISOString(),
    completedAt: null,
    checkpointCount: 0,
  };
  history.set(runId, entry);
  return entry;
}

export function recordExecutionStatus(
  runId: string,
  status: RuntimeExecutionHistoryEntry['status'],
): RuntimeExecutionHistoryEntry | null {
  const entry = history.get(runId);
  if (!entry) {
    return null;
  }

  const updated: RuntimeExecutionHistoryEntry = {
    ...entry,
    status,
    completedAt: status === 'running' ? null : new Date().toISOString(),
    checkpointCount: listRuntimeCheckpoints(runId).length,
  };
  history.set(runId, updated);
  return updated;
}

export function listExecutionHistory(organizationId?: string): RuntimeExecutionHistoryEntry[] {
  const entries = Array.from(history.values());
  return (
    organizationId ? entries.filter((entry) => entry.organizationId === organizationId) : entries
  ).sort((left, right) => right.startedAt.localeCompare(left.startedAt));
}

export function resetRuntimeExecutionStore(): void {
  checkpoints.clear();
  history.clear();
}
