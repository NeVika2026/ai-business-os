import type { MemoryBudget, MemoryKind } from '@/services/runtime/memory/memory-types';

export const DEFAULT_MEMORY_BUDGET: MemoryBudget = {
  maxWorkingEntries: 20,
  maxSemanticEntries: 200,
  maxEpisodicEntries: 100,
  maxSerializedEntries: 20,
};

export function getMemoryBudget(overrides?: Partial<MemoryBudget>): MemoryBudget {
  return {
    ...DEFAULT_MEMORY_BUDGET,
    ...overrides,
  };
}

export function getMaxEntriesForKind(budget: MemoryBudget, kind: MemoryKind): number {
  switch (kind) {
    case 'working':
      return budget.maxWorkingEntries;
    case 'semantic':
      return budget.maxSemanticEntries;
    case 'episodic':
      return budget.maxEpisodicEntries;
    default:
      return budget.maxWorkingEntries;
  }
}
