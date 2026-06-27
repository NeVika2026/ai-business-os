import {
  MemoryImportanceNotFoundError,
  MemoryImportanceValidationError,
} from '@/services/memory/memory-importance-errors';
import { serializeMemoryImportanceSnapshot } from '@/services/memory/memory-importance-serializer';
import type { MemoryFact } from '@/services/memory/memory-engine-types';
import type {
  MemoryImportanceCalculateResult,
  MemoryImportanceDecayResult,
  MemoryImportanceOptions,
  MemoryImportanceRebuildResult,
  MemoryImportanceSnapshot,
  MemoryImportanceStatistics,
  MemoryImportanceStoreAdapter,
  SerializedMemoryImportanceSnapshot,
} from '@/services/memory/memory-importance-types';
import {
  MEMORY_IMPORTANCE_DECAY_AMOUNT,
  MEMORY_IMPORTANCE_FREQUENT_ACCESS_THRESHOLD,
  MEMORY_IMPORTANCE_LOW_THRESHOLD,
  MEMORY_IMPORTANCE_MAX,
  MEMORY_IMPORTANCE_MIN,
  MEMORY_IMPORTANCE_PINNED,
  MEMORY_IMPORTANCE_RECOVERY_AMOUNT,
  MEMORY_TYPE_IMPORTANCE_BONUS,
} from '@/services/memory/memory-importance-types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function nowIso(): string {
  return new Date().toISOString();
}

function clampImportance(value: number): number {
  if (!Number.isFinite(value)) {
    return MEMORY_IMPORTANCE_MIN;
  }

  return Math.min(MEMORY_IMPORTANCE_MAX, Math.max(MEMORY_IMPORTANCE_MIN, Math.round(value)));
}

function assertImportance(value: number): void {
  if (!Number.isFinite(value) || value < MEMORY_IMPORTANCE_MIN || value > MEMORY_IMPORTANCE_MAX) {
    throw new MemoryImportanceValidationError('importance must be between 0 and 100');
  }
}

function typeBonus(fact: MemoryFact): number {
  return MEMORY_TYPE_IMPORTANCE_BONUS[fact.type] ?? 0;
}

function confidenceBonus(confidence: number): number {
  if (!Number.isFinite(confidence)) {
    return 0;
  }

  return Math.min(10, Math.round(Math.max(0, confidence) * 10));
}

function recentAccessBonus(fact: MemoryFact, allFacts: MemoryFact[]): number {
  if (fact.accessCount <= 0 || !fact.lastAccessedAt) {
    return 0;
  }

  const accessedAtValues = allFacts
    .filter((entry) => entry.accessCount > 0 && entry.lastAccessedAt)
    .map((entry) => entry.lastAccessedAt as string)
    .sort((left, right) => left.localeCompare(right));

  if (accessedAtValues.length === 0) {
    return Math.min(20, fact.accessCount * 2);
  }

  const index = accessedAtValues.indexOf(fact.lastAccessedAt);
  if (index < 0) {
    return Math.min(20, fact.accessCount * 2);
  }

  if (accessedAtValues.length === 1) {
    return 20;
  }

  return Math.round((index / (accessedAtValues.length - 1)) * 20);
}

export function createDefaultImportanceFields(): Pick<
  MemoryFact,
  'importance' | 'accessCount' | 'lastAccessedAt' | 'pin' | 'archived'
> {
  return {
    importance: 0,
    accessCount: 0,
    lastAccessedAt: null,
    pin: false,
    archived: false,
  };
}

export function calculateImportanceScore(
  fact: MemoryFact,
  allFacts: MemoryFact[] = [],
): MemoryImportanceCalculateResult {
  if (fact.pin) {
    return {
      factId: fact.id,
      importance: MEMORY_IMPORTANCE_PINNED,
      typeBonus: typeBonus(fact),
      recentAccessBonus: recentAccessBonus(fact, allFacts),
      confidenceBonus: confidenceBonus(fact.confidence),
      pinned: true,
    };
  }

  const bonus = typeBonus(fact);
  const recent = recentAccessBonus(fact, allFacts);
  const confidence = confidenceBonus(fact.confidence);
  const importance = clampImportance(bonus + recent + confidence);

  return {
    factId: fact.id,
    importance,
    typeBonus: bonus,
    recentAccessBonus: recent,
    confidenceBonus: confidence,
    pinned: false,
  };
}

export function buildImportanceStatistics(facts: MemoryFact[]): MemoryImportanceStatistics {
  const activeFacts = facts.filter((fact) => !fact.archived);
  const archivedFacts = facts.filter((fact) => fact.archived);
  const pinnedFacts = facts.filter((fact) => fact.pin && !fact.archived);
  const importances = activeFacts.map((fact) => fact.importance);

  const averageImportance =
    importances.length > 0
      ? Math.round(importances.reduce((sum, value) => sum + value, 0) / importances.length)
      : 0;
  const highestImportance = importances.length > 0 ? Math.max(...importances) : 0;

  return {
    activeFacts: activeFacts.length,
    archivedFacts: archivedFacts.length,
    pinnedFacts: pinnedFacts.length,
    averageImportance,
    highestImportance,
  };
}

/**
 * Deterministic importance scoring and decay for factual memory.
 */
export class MemoryImportance {
  private store: MemoryImportanceStoreAdapter | null = null;
  private lastDecay: MemoryImportanceDecayResult | null = null;
  private lastRebuild: MemoryImportanceRebuildResult | null = null;
  private snapshot: MemoryImportanceSnapshot;

  constructor(private readonly instanceId: string) {
    this.snapshot = this.createEmptySnapshot();
  }

  bindStore(store: MemoryImportanceStoreAdapter): void {
    this.store = store;
  }

  calculate(fact: MemoryFact): MemoryImportanceCalculateResult {
    const allFacts = this.store?.getFacts() ?? [fact];
    const result = calculateImportanceScore(fact, allFacts);
    assertImportance(result.importance);
    this.touch('calculate', fact.id);
    return result;
  }

  updateUsage(id: string): MemoryFact {
    const fact = this.requireFact(id);
    const updated = this.requireStore().updateFact(id, {
      accessCount: fact.accessCount + 1,
      lastAccessedAt: nowIso(),
    });
    const calculated = calculateImportanceScore(updated, this.requireStore().getFacts());

    const next = this.requireStore().updateFact(id, {
      importance: calculated.importance,
    });

    this.touch('usage', id);
    return next;
  }

  updateAccess(id: string): MemoryFact {
    return this.updateUsage(id);
  }

  decay(): MemoryImportanceDecayResult {
    const facts = this.requireStore().getFacts();
    const entries: MemoryImportanceDecayResult['entries'] = [];
    let decayedCount = 0;
    let recoveredCount = 0;
    let skippedCount = 0;

    for (const fact of facts) {
      if (fact.pin) {
        skippedCount += 1;
        entries.push({
          factId: fact.id,
          previousImportance: fact.importance,
          nextImportance: MEMORY_IMPORTANCE_PINNED,
          action: 'skipped',
          reason: 'Pinned facts never decay',
        });
        continue;
      }

      if (fact.archived) {
        skippedCount += 1;
        entries.push({
          factId: fact.id,
          previousImportance: fact.importance,
          nextImportance: fact.importance,
          action: 'skipped',
          reason: 'Archived facts are excluded from decay cycles',
        });
        continue;
      }

      let nextImportance = fact.importance;
      let action: MemoryImportanceDecayResult['entries'][number]['action'] = 'skipped';
      let reason = 'No decay change';

      if (fact.importance < MEMORY_IMPORTANCE_LOW_THRESHOLD) {
        nextImportance = clampImportance(fact.importance - MEMORY_IMPORTANCE_DECAY_AMOUNT);
        action = 'decayed';
        reason = 'Very low importance';
        decayedCount += 1;
      } else if (fact.accessCount >= MEMORY_IMPORTANCE_FREQUENT_ACCESS_THRESHOLD) {
        nextImportance = clampImportance(fact.importance + MEMORY_IMPORTANCE_RECOVERY_AMOUNT);
        action = 'recovered';
        reason = 'Frequently accessed';
        recoveredCount += 1;
      } else {
        skippedCount += 1;
        reason = 'Stable importance';
      }

      if (nextImportance !== fact.importance) {
        this.requireStore().updateFact(fact.id, { importance: nextImportance });
      }

      entries.push({
        factId: fact.id,
        previousImportance: fact.importance,
        nextImportance,
        action,
        reason,
      });
    }

    const result: MemoryImportanceDecayResult = {
      processedCount: facts.length,
      decayedCount,
      recoveredCount,
      skippedCount,
      entries,
    };

    this.lastDecay = result;
    this.snapshot.lastDecayAt = nowIso();
    this.touch('decay', null);
    return result;
  }

  rebuild(): MemoryImportanceRebuildResult {
    const facts = this.requireStore().getFacts();
    let rebuiltCount = 0;

    for (const fact of facts) {
      if (fact.archived) {
        continue;
      }

      const calculated = calculateImportanceScore(fact, facts);
      const nextImportance = fact.pin ? MEMORY_IMPORTANCE_PINNED : calculated.importance;

      if (nextImportance !== fact.importance) {
        this.requireStore().updateFact(fact.id, { importance: nextImportance });
      }

      rebuiltCount += 1;
    }

    const statistics = buildImportanceStatistics(this.requireStore().getFacts());
    const result: MemoryImportanceRebuildResult = {
      rebuiltCount,
      averageImportance: statistics.averageImportance,
      highestImportance: statistics.highestImportance,
    };

    this.lastRebuild = result;
    this.snapshot.lastRebuildAt = nowIso();
    this.touch('rebuild', null);
    return result;
  }

  statistics(): MemoryImportanceStatistics {
    const facts = this.store?.getFacts() ?? [];
    return buildImportanceStatistics(facts);
  }

  serialize(): SerializedMemoryImportanceSnapshot {
    return serializeMemoryImportanceSnapshot({
      snapshot: this.snapshot,
      statistics: this.statistics(),
      lastDecay: this.lastDecay,
      lastRebuild: this.lastRebuild,
    });
  }

  reset(): void {
    this.lastDecay = null;
    this.lastRebuild = null;
    this.snapshot = this.createEmptySnapshot();
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  private requireStore(): MemoryImportanceStoreAdapter {
    if (!this.store) {
      throw new MemoryImportanceValidationError('importance store is not bound');
    }

    return this.store;
  }

  private requireFact(id: string): MemoryFact {
    if (!isNonEmptyString(id)) {
      throw new MemoryImportanceValidationError('id is required');
    }

    const fact = this.requireStore().getFact(id);
    if (!fact) {
      throw new MemoryImportanceNotFoundError(`memory fact not found: ${id}`);
    }

    return fact;
  }

  private createEmptySnapshot(): MemoryImportanceSnapshot {
    return {
      instanceId: this.instanceId,
      lastOperation: null,
      lastFactId: null,
      lastDecayAt: null,
      lastRebuildAt: null,
      updatedAt: nowIso(),
    };
  }

  private touch(operation: MemoryImportanceSnapshot['lastOperation'], factId: string | null): void {
    this.snapshot = {
      ...this.snapshot,
      lastOperation: operation,
      lastFactId: factId,
      updatedAt: nowIso(),
    };
  }
}

export function createMemoryImportance(options?: MemoryImportanceOptions): MemoryImportance {
  const instanceId = options?.instanceId?.trim() || 'default-memory-importance';
  const importance = new MemoryImportance(instanceId);

  if (options?.store) {
    importance.bindStore(options.store);
  }

  return importance;
}

/** Default dev/test singleton. Deterministic importance scoring. */
export const memoryImportance = createMemoryImportance();
