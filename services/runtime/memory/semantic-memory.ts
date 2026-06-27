import { getMaxEntriesForKind } from '@/services/runtime/memory/memory-budget';
import { rankMemoryEntries } from '@/services/runtime/memory/memory-ranking';
import type {
  MemoryBudget,
  MemoryKind,
  RankedMemoryEntry,
  StoredMemoryEntry,
} from '@/services/runtime/memory/memory-types';

export function filterSemanticEntries(entries: StoredMemoryEntry[]): StoredMemoryEntry[] {
  return entries.filter((entry) => entry.kind === 'semantic');
}

export function rankSemanticEntries(
  entries: StoredMemoryEntry[],
  query: string,
  limit?: number,
): RankedMemoryEntry[] {
  return rankMemoryEntries(filterSemanticEntries(entries), query, limit);
}

export function pruneSemanticEntries(
  entries: StoredMemoryEntry[],
  budget: MemoryBudget,
  query = '',
): { kept: StoredMemoryEntry[]; removed: number } {
  const semantic = filterSemanticEntries(entries);
  const maxEntries = getMaxEntriesForKind(budget, 'semantic');

  if (semantic.length <= maxEntries) {
    return { kept: semantic, removed: 0 };
  }

  const ranked = rankMemoryEntries(semantic, query);
  const keptIds = new Set(ranked.slice(0, maxEntries).map((entry) => entry.id));

  return {
    kept: semantic.filter((entry) => keptIds.has(entry.id)),
    removed: semantic.length - keptIds.size,
  };
}

export function semanticKind(): MemoryKind {
  return 'semantic';
}
