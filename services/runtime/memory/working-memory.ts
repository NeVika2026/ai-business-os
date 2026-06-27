import { getMaxEntriesForKind } from '@/services/runtime/memory/memory-budget';
import { rankMemoryEntries } from '@/services/runtime/memory/memory-ranking';
import type {
  MemoryBudget,
  MemoryKind,
  RankedMemoryEntry,
  StoredMemoryEntry,
} from '@/services/runtime/memory/memory-types';

export function filterWorkingEntries(entries: StoredMemoryEntry[]): StoredMemoryEntry[] {
  return entries.filter((entry) => entry.kind === 'working');
}

export function rankWorkingEntries(
  entries: StoredMemoryEntry[],
  query: string,
  limit?: number,
): RankedMemoryEntry[] {
  return rankMemoryEntries(filterWorkingEntries(entries), query, limit);
}

export function pruneWorkingEntries(
  entries: StoredMemoryEntry[],
  budget: MemoryBudget,
  query = '',
): { kept: StoredMemoryEntry[]; removed: number } {
  const working = filterWorkingEntries(entries);
  const maxEntries = getMaxEntriesForKind(budget, 'working');

  if (working.length <= maxEntries) {
    return { kept: working, removed: 0 };
  }

  const ranked = rankMemoryEntries(working, query);
  const keptIds = new Set(ranked.slice(0, maxEntries).map((entry) => entry.id));

  return {
    kept: working.filter((entry) => keptIds.has(entry.id)),
    removed: working.length - keptIds.size,
  };
}

export function workingKind(): MemoryKind {
  return 'working';
}
