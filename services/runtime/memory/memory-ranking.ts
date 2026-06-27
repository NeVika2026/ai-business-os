import type {
  MemoryRankScores,
  RankedMemoryEntry,
  StoredMemoryEntry,
} from '@/services/runtime/memory/memory-types';

const RECENCY_WEIGHT = 0.2;
const IMPORTANCE_WEIGHT = 0.35;
const RELEVANCE_WEIGHT = 0.4;
const MOCK_WEIGHT = 0.05;

export function mockScore(seed: string): number {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  const normalized = Math.abs(hash % 1000) / 1000;
  return Number(normalized.toFixed(4));
}

export function recencyScore(timestamp: string | null | undefined, now = Date.now()): number {
  if (!timestamp) {
    return 0.5;
  }

  const ageMs = now - new Date(timestamp).getTime();

  if (Number.isNaN(ageMs) || ageMs < 0) {
    return 0.5;
  }

  const days = ageMs / (1000 * 60 * 60 * 24);
  return Number(Math.max(0, 1 - days / 30).toFixed(4));
}

export function importanceScore(importance: number): number {
  if (Number.isNaN(importance)) {
    return 0;
  }

  return Number(Math.min(1, Math.max(0, importance)).toFixed(4));
}

export function relevanceScore(query: string, content: string): number {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return 0;
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return 0;
  }

  const haystack = content.toLowerCase();
  const matches = tokens.filter((token) => haystack.includes(token)).length;

  return Number((matches / tokens.length).toFixed(4));
}

export function computeRankScores(
  entry: StoredMemoryEntry,
  query: string,
  now = Date.now(),
): MemoryRankScores {
  const recency = recencyScore(entry.lastUsedAt ?? entry.updatedAt, now);
  const importance = importanceScore(entry.importance);
  const relevance = relevanceScore(query, entry.content);
  const mock = mockScore(entry.id);
  const total = Number(
    (
      recency * RECENCY_WEIGHT +
      importance * IMPORTANCE_WEIGHT +
      relevance * RELEVANCE_WEIGHT +
      mock * MOCK_WEIGHT
    ).toFixed(4),
  );

  return {
    recency,
    importance,
    relevance,
    mock,
    total,
  };
}

export function rankMemoryEntries(
  entries: StoredMemoryEntry[],
  query: string,
  limit?: number,
): RankedMemoryEntry[] {
  const now = Date.now();
  const ranked = entries
    .map((entry) => ({
      ...entry,
      scores: computeRankScores(entry, query, now),
    }))
    .sort((left, right) => {
      if (right.scores.total !== left.scores.total) {
        return right.scores.total - left.scores.total;
      }

      return right.updatedAt.localeCompare(left.updatedAt);
    });

  if (typeof limit === 'number' && limit >= 0) {
    return ranked.slice(0, limit);
  }

  return ranked;
}
