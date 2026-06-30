import type { FindMemoryQuery, MemoryEntry } from '@/types/memory';

import { resolveStore, type MemoryStoreState } from './memory-store';

function matchesText(entry: MemoryEntry, text: string): boolean {
  const haystack = [
    entry.task,
    entry.result,
    entry.intent,
    entry.summary,
    entry.routingCategory,
  ]
    .join(' ')
    .toLowerCase();

  const tokens = text
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  return tokens.every((token) => haystack.includes(token));
}

export function findMemory(query: FindMemoryQuery = {}, store?: MemoryStoreState): MemoryEntry[] {
  const state = resolveStore(store);
  const includeArchived = query.includeArchived ?? false;
  const limit = query.limit ?? Number.POSITIVE_INFINITY;

  const results = [...state.entries.values()]
    .filter((entry) => {
      if (!includeArchived && entry.archived) {
        return false;
      }

      if (query.organizationId && entry.organizationId !== query.organizationId) {
        return false;
      }

      if (query.userId && entry.userId !== query.userId) {
        return false;
      }

      if (query.sessionId && entry.sessionId !== query.sessionId) {
        return false;
      }

      if (query.projectId && entry.projectId !== query.projectId) {
        return false;
      }

      if (query.scope && entry.scope !== query.scope) {
        return false;
      }

      if (query.category && entry.category !== query.category) {
        return false;
      }

      if (query.text && !matchesText(entry, query.text)) {
        return false;
      }

      return true;
    })
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));

  return results.slice(0, limit);
}

export function getRecentMemory(
  query: Omit<FindMemoryQuery, 'limit'> & { limit?: number } = {},
  store?: MemoryStoreState,
): MemoryEntry[] {
  return findMemory({ ...query, includeArchived: false, limit: query.limit ?? 10 }, store);
}
