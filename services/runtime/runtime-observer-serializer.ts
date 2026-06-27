import type {
  RuntimeObserverMetrics,
  RuntimeObserverSnapshot,
  RuntimeObserverTimelineEntry,
  SerializedRuntimeObserverMetrics,
  SerializedRuntimeObserverSnapshot,
  SerializedRuntimeObserverTimelineEntry,
} from '@/services/runtime/runtime-observer-types';

function nullifyRecord(value: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    result[key] = entry === undefined ? null : entry;
  }

  return result;
}

export function serializeRuntimeObserverTimelineEntry(
  entry: RuntimeObserverTimelineEntry,
): SerializedRuntimeObserverTimelineEntry {
  return {
    timestamp: entry.timestamp,
    event: entry.event,
    payload: entry.payload ? nullifyRecord(entry.payload) : null,
    duration: entry.duration ?? null,
    runId: entry.runId ?? null,
  };
}

export function serializeRuntimeObserverMetrics(
  metrics: RuntimeObserverMetrics,
): SerializedRuntimeObserverMetrics {
  return {
    runs: metrics.runs,
    successfulRuns: metrics.successfulRuns,
    failedRuns: metrics.failedRuns,
    gatewayCalls: metrics.gatewayCalls,
    toolCalls: metrics.toolCalls,
    memoryReads: metrics.memoryReads,
    memoryWrites: metrics.memoryWrites,
    pipelineRuns: metrics.pipelineRuns,
    promptCompiles: metrics.promptCompiles,
    averageDuration: metrics.averageDuration,
    lastRunDuration: metrics.lastRunDuration ?? null,
  };
}

export function serializeRuntimeObserverSnapshot(
  snapshot: RuntimeObserverSnapshot,
): SerializedRuntimeObserverSnapshot {
  return {
    instanceId: snapshot.instanceId,
    timeline: snapshot.timeline.map(serializeRuntimeObserverTimelineEntry),
    metrics: serializeRuntimeObserverMetrics(snapshot.metrics),
    listenerCount: snapshot.listenerCount,
    updatedAt: snapshot.updatedAt,
  };
}

export function createEmptyRuntimeObserverMetrics(): RuntimeObserverMetrics {
  return {
    runs: 0,
    successfulRuns: 0,
    failedRuns: 0,
    gatewayCalls: 0,
    toolCalls: 0,
    memoryReads: 0,
    memoryWrites: 0,
    pipelineRuns: 0,
    promptCompiles: 0,
    averageDuration: 0,
    lastRunDuration: null,
  };
}
