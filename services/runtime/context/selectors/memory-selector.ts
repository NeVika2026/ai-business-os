import type { MemoryPackage } from '@/types/runtime/dto';
import type { ContextBudget } from '@/services/runtime/context/budget';
import type { MemoryProviderResult } from '@/services/runtime/context/types';
import { mockScore, rankByScore } from '@/services/runtime/context/ranking';

export function selectMemoryEntries(
  memory: MemoryProviderResult,
  budget: ContextBudget,
): MemoryPackage['entries'] {
  const combined = [...memory.semantic, ...memory.working];
  const ranked = rankByScore(combined, (entry) => Math.max(entry.importance, mockScore(entry.id)));

  return ranked.slice(0, budget.memoryItems).map((entry) => ({
    id: entry.id,
    scope: entry.scope,
    content: entry.content,
    importance: entry.importance,
  }));
}

export function buildMemoryPackage(
  scope: MemoryPackage['scope'],
  trace: MemoryPackage['trace'],
  employeeId: MemoryPackage['employeeId'],
  memory: MemoryProviderResult,
  budget: ContextBudget,
  enabled = true,
): MemoryPackage {
  const entries = selectMemoryEntries(memory, budget);

  return {
    scope,
    trace,
    employeeId,
    entries,
    enabled,
    retrievedAt: new Date().toISOString(),
  };
}
