import type {
  RuntimeRecord,
  RuntimeStatusView,
  SerializedRuntimeRecord,
  SerializedRuntimeSnapshot,
} from '@/services/runtime/runtime/runtime-types';

export function serializeRuntimeRecord(record: RuntimeRecord): SerializedRuntimeRecord {
  return {
    mode: record.mode,
    roadmapId: record.roadmapId,
    sprintId: record.sprintId,
    lastRoadmapResult: record.lastRoadmapResult,
    lastSprintResult: record.lastSprintResult,
    updatedAt: record.updatedAt,
  };
}

export function serializeRuntimeSnapshot(
  record: RuntimeRecord,
  status: RuntimeStatusView,
): SerializedRuntimeSnapshot {
  return {
    runtime: serializeRuntimeRecord(record),
    status,
  };
}
