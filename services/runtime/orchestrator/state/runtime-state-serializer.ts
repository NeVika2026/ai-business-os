import type {
  RuntimeStateHistory,
  RuntimeStateRecord,
  SerializedRuntimeState,
  SerializedRuntimeStateSnapshot,
  SerializedRuntimeTransition,
} from '@/services/runtime/orchestrator/state/runtime-state-types';

export function serializeRuntimeState(record: RuntimeStateRecord): SerializedRuntimeState {
  return {
    id: record.id,
    state: record.state,
    organizationId: record.organizationId,
    employeeId: record.employeeId,
    runId: record.runId,
    traceId: record.traceId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function serializeRuntimeHistory(
  history: RuntimeStateHistory,
): SerializedRuntimeTransition[] {
  return history.transitions.map((transition) => ({
    from: transition.from,
    to: transition.to,
    transitionAt: transition.transitionAt,
  }));
}

export function serializeRuntimeStateSnapshot(
  record: RuntimeStateRecord,
  history: RuntimeStateHistory,
): SerializedRuntimeStateSnapshot {
  return {
    current: serializeRuntimeState(record),
    history: serializeRuntimeHistory(history),
  };
}
