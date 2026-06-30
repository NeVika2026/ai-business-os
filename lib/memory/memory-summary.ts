import type { MemoryScope, MemorySummary } from '@/types/memory';

import { findMemory } from './memory-search';
import { resolveStore, type MemoryStoreState } from './memory-store';

const SUMMARY_HIGHLIGHT_LIMIT = 3;
const SUMMARY_TASK_LIMIT = 5;

function truncate(value: string, maxLength: number): string {
  const trimmed = value.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

export function buildMemorySummaryText(task: string, result: string): string {
  const taskLine = truncate(task, 120);
  const resultLine = truncate(result, 180);

  return `${taskLine} → ${resultLine}`;
}

export function summarizeMemory(
  query: {
    scope?: MemoryScope | 'all';
    projectId?: string | null;
    organizationId?: string | null;
    userId?: string;
    limit?: number;
  } = {},
  store?: MemoryStoreState,
): MemorySummary {
  resolveStore(store);

  const scope = query.scope ?? 'all';
  const entries = findMemory(
    {
      organizationId: query.organizationId ?? undefined,
      userId: query.userId,
      projectId: query.projectId ?? undefined,
      scope: scope === 'all' ? undefined : scope,
      includeArchived: false,
      limit: query.limit ?? 50,
    },
    store,
  );

  const activeEntryCount = entries.length;
  const recentTasks = entries
    .map((entry) => entry.task.trim())
    .filter(Boolean)
    .slice(0, SUMMARY_TASK_LIMIT);

  const highlights = entries
    .map((entry) => entry.summary.trim())
    .filter(Boolean)
    .slice(0, SUMMARY_HIGHLIGHT_LIMIT);

  return {
    scope,
    projectId: query.projectId ?? null,
    organizationId: query.organizationId ?? null,
    entryCount: entries.length,
    activeEntryCount,
    recentTasks,
    highlights,
    lastActivityAt: entries[0]?.occurredAt ?? null,
  };
}
