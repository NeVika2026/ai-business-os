import type { CoordinatorStatus } from '@/services/runtime/orchestrator/coordinator/runtime-coordinator-types';
import type {
  RunnerRecord,
  SerializedRunnerRecord,
  SerializedRunnerSnapshot,
} from '@/services/runtime/orchestrator/runner/runtime-runner-types';

export function serializeRunnerRecord(record: RunnerRecord): SerializedRunnerRecord {
  return {
    runId: record.runId,
    organizationId: record.organizationId,
    employeeId: record.employeeId,
    traceId: record.traceId,
    status: record.status,
    stepCount: record.stepCount,
    executedTasks: [...record.executedTasks],
    startedAt: record.startedAt,
    updatedAt: record.updatedAt,
    stoppedAt: record.stoppedAt,
    finished: record.finished,
    finalStatus: record.finalStatus,
    durationMs: record.durationMs,
    stopReason: record.stopReason,
  };
}

export function serializeRunnerSnapshot(
  record: RunnerRecord,
  coordinatorStatus: CoordinatorStatus | null,
  coordinatorState: string | null,
): SerializedRunnerSnapshot {
  return {
    runner: serializeRunnerRecord(record),
    coordinatorStatus,
    coordinatorState,
  };
}
