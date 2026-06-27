import type { MemoryFact, MemoryType } from '@/services/memory/memory-engine-types';

export const MEMORY_IMPORTANCE_MIN = 0;
export const MEMORY_IMPORTANCE_MAX = 100;
export const MEMORY_IMPORTANCE_PINNED = 100;

export const MEMORY_IMPORTANCE_LOW_THRESHOLD = 20;
export const MEMORY_IMPORTANCE_DECAY_AMOUNT = 5;
export const MEMORY_IMPORTANCE_RECOVERY_AMOUNT = 3;
export const MEMORY_IMPORTANCE_FREQUENT_ACCESS_THRESHOLD = 3;

export const MEMORY_TYPE_IMPORTANCE_BONUS: Partial<Record<MemoryType, number>> = {
  preference: 30,
  business_fact: 20,
  project_fact: 20,
  goal: 20,
  decision: 20,
  client: 15,
  company: 10,
};

export type MemoryImportanceFact = MemoryFact;

export type MemoryImportanceFactPatch = Pick<
  MemoryFact,
  'importance' | 'accessCount' | 'lastAccessedAt' | 'pin' | 'archived'
>;

export interface MemoryImportanceCalculateResult {
  factId: string;
  importance: number;
  typeBonus: number;
  recentAccessBonus: number;
  confidenceBonus: number;
  pinned: boolean;
}

export interface MemoryImportanceDecayEntry {
  factId: string;
  previousImportance: number;
  nextImportance: number;
  action: 'decayed' | 'recovered' | 'skipped';
  reason: string;
}

export interface MemoryImportanceDecayResult {
  processedCount: number;
  decayedCount: number;
  recoveredCount: number;
  skippedCount: number;
  entries: MemoryImportanceDecayEntry[];
}

export interface MemoryImportanceRebuildResult {
  rebuiltCount: number;
  averageImportance: number;
  highestImportance: number;
}

export interface MemoryImportanceStatistics {
  activeFacts: number;
  archivedFacts: number;
  pinnedFacts: number;
  averageImportance: number;
  highestImportance: number;
}

export interface MemoryImportanceStoreAdapter {
  getFact(id: string): MemoryFact | null;
  getFacts(): MemoryFact[];
  updateFact(id: string, patch: Partial<MemoryImportanceFactPatch>): MemoryFact;
}

export interface MemoryImportanceSnapshot {
  instanceId: string;
  lastOperation: 'calculate' | 'usage' | 'access' | 'decay' | 'rebuild' | null;
  lastFactId: string | null;
  lastDecayAt: string | null;
  lastRebuildAt: string | null;
  updatedAt: string;
}

export interface SerializedMemoryImportanceCalculateResult {
  factId: string;
  importance: number;
  typeBonus: number;
  recentAccessBonus: number;
  confidenceBonus: number;
  pinned: boolean;
}

export interface SerializedMemoryImportanceDecayEntry {
  factId: string;
  previousImportance: number;
  nextImportance: number;
  action: 'decayed' | 'recovered' | 'skipped';
  reason: string;
}

export interface SerializedMemoryImportanceDecayResult {
  processedCount: number;
  decayedCount: number;
  recoveredCount: number;
  skippedCount: number;
  entries: SerializedMemoryImportanceDecayEntry[];
}

export interface SerializedMemoryImportanceRebuildResult {
  rebuiltCount: number;
  averageImportance: number;
  highestImportance: number;
}

export interface SerializedMemoryImportanceStatistics {
  activeFacts: number;
  archivedFacts: number;
  pinnedFacts: number;
  averageImportance: number;
  highestImportance: number;
}

export interface SerializedMemoryImportanceSnapshot {
  instanceId: string;
  lastOperation: 'calculate' | 'usage' | 'access' | 'decay' | 'rebuild' | null;
  lastFactId: string | null;
  lastDecayAt: string | null;
  lastRebuildAt: string | null;
  updatedAt: string;
  statistics: SerializedMemoryImportanceStatistics;
  lastDecay: SerializedMemoryImportanceDecayResult | null;
  lastRebuild: SerializedMemoryImportanceRebuildResult | null;
}

export interface MemoryImportanceOptions {
  instanceId?: string;
  store?: MemoryImportanceStoreAdapter;
}
