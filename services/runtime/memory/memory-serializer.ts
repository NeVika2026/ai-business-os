import type {
  MemoryLoadContext,
  RankedMemoryEntry,
  SerializedMemoryPackage,
} from '@/services/runtime/memory/memory-types';
import type { MemoryEntry } from '@/types/runtime/dto';

export function toMemoryEntry(entry: RankedMemoryEntry): MemoryEntry {
  return {
    id: entry.id,
    scope: entry.scope,
    content: entry.content,
    importance: entry.importance,
    lastUsedAt: entry.lastUsedAt ?? null,
  };
}

export function serializeMemoryPackage(
  context: MemoryLoadContext,
  entries: RankedMemoryEntry[],
  retrievedAt: string,
): SerializedMemoryPackage {
  const packageEntries: MemoryEntry[] = entries.map(toMemoryEntry);

  return {
    scope: context.scope,
    trace: context.trace,
    employeeId: context.employeeId,
    entries: packageEntries,
    enabled: context.enabled ?? true,
    retrievedAt,
  };
}
