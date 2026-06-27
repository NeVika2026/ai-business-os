import type {
  MemoryImportanceCalculateResult,
  MemoryImportanceDecayResult,
  MemoryImportanceRebuildResult,
  MemoryImportanceSnapshot,
  MemoryImportanceStatistics,
  SerializedMemoryImportanceCalculateResult,
  SerializedMemoryImportanceDecayResult,
  SerializedMemoryImportanceRebuildResult,
  SerializedMemoryImportanceSnapshot,
  SerializedMemoryImportanceStatistics,
} from '@/services/memory/memory-importance-types';

export function serializeMemoryImportanceCalculateResult(
  result: MemoryImportanceCalculateResult,
): SerializedMemoryImportanceCalculateResult {
  return {
    factId: result.factId,
    importance: result.importance,
    typeBonus: result.typeBonus,
    recentAccessBonus: result.recentAccessBonus,
    confidenceBonus: result.confidenceBonus,
    pinned: result.pinned,
  };
}

export function serializeMemoryImportanceStatistics(
  statistics: MemoryImportanceStatistics,
): SerializedMemoryImportanceStatistics {
  return {
    activeFacts: statistics.activeFacts,
    archivedFacts: statistics.archivedFacts,
    pinnedFacts: statistics.pinnedFacts,
    averageImportance: statistics.averageImportance,
    highestImportance: statistics.highestImportance,
  };
}

export function serializeMemoryImportanceDecayResult(
  result: MemoryImportanceDecayResult,
): SerializedMemoryImportanceDecayResult {
  return {
    processedCount: result.processedCount,
    decayedCount: result.decayedCount,
    recoveredCount: result.recoveredCount,
    skippedCount: result.skippedCount,
    entries: result.entries.map((entry) => ({
      factId: entry.factId,
      previousImportance: entry.previousImportance,
      nextImportance: entry.nextImportance,
      action: entry.action,
      reason: entry.reason,
    })),
  };
}

export function serializeMemoryImportanceRebuildResult(
  result: MemoryImportanceRebuildResult,
): SerializedMemoryImportanceRebuildResult {
  return {
    rebuiltCount: result.rebuiltCount,
    averageImportance: result.averageImportance,
    highestImportance: result.highestImportance,
  };
}

export function serializeMemoryImportanceSnapshot(input: {
  snapshot: MemoryImportanceSnapshot;
  statistics: MemoryImportanceStatistics;
  lastDecay: MemoryImportanceDecayResult | null;
  lastRebuild: MemoryImportanceRebuildResult | null;
}): SerializedMemoryImportanceSnapshot {
  return {
    instanceId: input.snapshot.instanceId,
    lastOperation: input.snapshot.lastOperation ?? null,
    lastFactId: input.snapshot.lastFactId ?? null,
    lastDecayAt: input.snapshot.lastDecayAt ?? null,
    lastRebuildAt: input.snapshot.lastRebuildAt ?? null,
    updatedAt: input.snapshot.updatedAt,
    statistics: serializeMemoryImportanceStatistics(input.statistics),
    lastDecay: input.lastDecay ? serializeMemoryImportanceDecayResult(input.lastDecay) : null,
    lastRebuild: input.lastRebuild
      ? serializeMemoryImportanceRebuildResult(input.lastRebuild)
      : null,
  };
}
