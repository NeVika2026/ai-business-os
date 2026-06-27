import { getMaxEntriesForKind } from '@/services/runtime/memory/memory-budget';
import { rankMemoryEntries } from '@/services/runtime/memory/memory-ranking';
import type {
  MemoryBudget,
  MemoryKind,
  RankedMemoryEntry,
  StoredMemoryEntry,
} from '@/services/runtime/memory/memory-types';

export function filterEpisodicEntries(entries: StoredMemoryEntry[]): StoredMemoryEntry[] {
  return entries.filter((entry) => entry.kind === 'episodic');
}

export function rankEpisodicEntries(
  entries: StoredMemoryEntry[],
  query: string,
  limit?: number,
): RankedMemoryEntry[] {
  return rankMemoryEntries(filterEpisodicEntries(entries), query, limit);
}

export function pruneEpisodicEntries(
  entries: StoredMemoryEntry[],
  budget: MemoryBudget,
  query = '',
): { kept: StoredMemoryEntry[]; removed: number } {
  const episodic = filterEpisodicEntries(entries);
  const maxEntries = getMaxEntriesForKind(budget, 'episodic');

  if (episodic.length <= maxEntries) {
    return { kept: episodic, removed: 0 };
  }

  const ranked = rankMemoryEntries(episodic, query);
  const keptIds = new Set(ranked.slice(0, maxEntries).map((entry) => entry.id));

  return {
    kept: episodic.filter((entry) => keptIds.has(entry.id)),
    removed: episodic.length - keptIds.size,
  };
}

export function episodicKind(): MemoryKind {
  return 'episodic';
}
