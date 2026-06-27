import type { MemoryPackage } from '@/types/runtime/dto';
import type {
  RankedMemoryEntry,
  RuntimeMemorySnapshot,
  SerializedRuntimeMemoryDeleteResult,
  SerializedRuntimeMemoryEntry,
  SerializedRuntimeMemoryPackage,
  SerializedRuntimeMemorySearchEntry,
  SerializedRuntimeMemorySearchResult,
  SerializedRuntimeMemorySnapshot,
  SerializedRuntimeMemoryWriteResult,
  StoredMemoryEntry,
} from '@/services/runtime/runtime-memory-types';

export function serializeRuntimeMemoryEntry(entry: {
  id: string;
  scope: string;
  content: string;
  importance: number;
  lastUsedAt?: string | null;
}): SerializedRuntimeMemoryEntry {
  return {
    id: entry.id,
    scope: entry.scope,
    content: entry.content,
    importance: entry.importance,
    lastUsedAt: entry.lastUsedAt ?? null,
  };
}

export function serializeRuntimeMemoryPackage(
  memoryPackage: MemoryPackage,
): SerializedRuntimeMemoryPackage {
  const entries = memoryPackage.entries.map(serializeRuntimeMemoryEntry);

  return {
    organizationId: memoryPackage.scope.organizationId,
    employeeId: memoryPackage.employeeId,
    runId: memoryPackage.trace.runId,
    traceId: memoryPackage.trace.traceId,
    correlationId: memoryPackage.trace.correlationId ?? null,
    parentRunId: memoryPackage.trace.parentRunId ?? null,
    enabled: memoryPackage.enabled,
    retrievedAt: memoryPackage.retrievedAt,
    entryCount: entries.length,
    entries,
  };
}

export function serializeRuntimeMemoryWriteResult(
  entry: StoredMemoryEntry,
): SerializedRuntimeMemoryWriteResult {
  return {
    id: entry.id,
    kind: entry.kind,
    scope: entry.scope,
    content: entry.content,
    importance: entry.importance,
    organizationId: entry.organizationId,
    employeeId: entry.employeeId,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    lastUsedAt: entry.lastUsedAt ?? null,
  };
}

export function serializeRuntimeMemorySearchEntry(
  entry: RankedMemoryEntry,
): SerializedRuntimeMemorySearchEntry {
  return {
    ...serializeRuntimeMemoryEntry(entry),
    kind: entry.kind,
    relevanceScore: entry.scores.relevance,
    recencyScore: entry.scores.recency,
    importanceScore: entry.scores.importance,
    mockScore: entry.scores.mock,
    totalScore: entry.scores.total,
  };
}

export function serializeRuntimeMemorySearchResult(
  query: string,
  kind: string | null,
  limit: number | null,
  entries: RankedMemoryEntry[],
): SerializedRuntimeMemorySearchResult {
  const serializedEntries = entries.map(serializeRuntimeMemorySearchEntry);

  return {
    query,
    kind,
    limit,
    entryCount: serializedEntries.length,
    entries: serializedEntries,
  };
}

export function serializeRuntimeMemoryDeleteResult(
  id: string,
  deleted: boolean,
): SerializedRuntimeMemoryDeleteResult {
  return {
    id,
    deleted,
  };
}

export function serializeRuntimeMemorySnapshot(
  snapshot: RuntimeMemorySnapshot,
): SerializedRuntimeMemorySnapshot {
  return {
    lastOperation: snapshot.lastOperation,
    lastRunId: snapshot.lastRunId,
    lastOrganizationId: snapshot.lastOrganizationId,
    lastEntryCount: snapshot.lastEntryCount,
    updatedAt: snapshot.updatedAt,
  };
}
