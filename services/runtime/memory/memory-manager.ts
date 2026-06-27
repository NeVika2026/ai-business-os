import { getMemoryBudget } from '@/services/runtime/memory/memory-budget';
import {
  MemoryDisabledError,
  MemoryNotLoadedError,
  MemoryScopeMismatchError,
} from '@/services/runtime/memory/memory-errors';
import { rankMemoryEntries } from '@/services/runtime/memory/memory-ranking';
import { serializeMemoryPackage } from '@/services/runtime/memory/memory-serializer';
import type {
  MemoryBudget,
  MemoryKind,
  MemoryLoadContext,
  MemoryManagerOptions,
  MemoryPruneResult,
  MemoryProvider,
  MemoryRetrieveQuery,
  MemoryStoreInput,
  RankedMemoryEntry,
  SerializedMemoryPackage,
  StoredMemoryEntry,
} from '@/services/runtime/memory/memory-types';
import {
  validateLoadContext,
  validateMemoryStoreInput,
} from '@/services/runtime/memory/memory-validator';
import { pruneEpisodicEntries } from '@/services/runtime/memory/episodic-memory';
import {
  createMockMemoryProvider,
  mockMemoryProvider,
} from '@/services/runtime/memory/providers/mock-memory-provider';
import { pruneSemanticEntries } from '@/services/runtime/memory/semantic-memory';
import { pruneWorkingEntries } from '@/services/runtime/memory/working-memory';
import type { UUID } from '@/types/runtime/dto';

function matchesKindFilter(kind: MemoryKind, filter?: MemoryKind | MemoryKind[]): boolean {
  if (!filter) {
    return true;
  }

  const kinds = Array.isArray(filter) ? filter : [filter];
  return kinds.includes(kind);
}

/**
 * Per-execution memory manager. Each runtime run should create its own instance
 * via createMemoryManager() so activeContext is not shared across concurrent requests.
 */
export class MemoryManager {
  private activeContext: MemoryLoadContext | null = null;
  private activeBudget: MemoryBudget;

  constructor(
    private readonly provider: MemoryProvider,
    options?: MemoryManagerOptions,
  ) {
    this.activeBudget = getMemoryBudget(options?.budget);
  }

  load(context: MemoryLoadContext): void {
    validateLoadContext(context);
    this.activeContext = {
      ...context,
      enabled: context.enabled ?? true,
    };
    this.activeBudget = getMemoryBudget({
      ...this.activeBudget,
      ...context.budget,
    });
    this.provider.ensureSeed(context.scope.organizationId, context.employeeId);
  }

  retrieve(query: MemoryRetrieveQuery): RankedMemoryEntry[] {
    const context = this.requireLoadedContext();
    this.assertOrganizationScope(context.scope.organizationId);

    const entries = this.provider
      .list(context.scope.organizationId)
      .filter((entry) => matchesKindFilter(entry.kind, query.kind));

    return rankMemoryEntries(entries, query.query, query.limit);
  }

  store(entry: MemoryStoreInput): StoredMemoryEntry {
    const context = this.requireLoadedContext();
    this.assertOrganizationScope(context.scope.organizationId);
    validateMemoryStoreInput(entry);

    if (
      entry.payload?.organizationId &&
      entry.payload.organizationId !== context.scope.organizationId
    ) {
      throw new MemoryScopeMismatchError(
        `Entry payload organizationId does not match active scope: ${String(entry.payload.organizationId)}`,
      );
    }

    if (context.enabled === false) {
      throw new MemoryDisabledError();
    }

    const now = new Date().toISOString();
    return this.provider.upsert(context.scope.organizationId, context.employeeId, entry, now);
  }

  prune(budgetOverride?: Partial<MemoryBudget>): MemoryPruneResult {
    const context = this.requireLoadedContext();
    this.assertOrganizationScope(context.scope.organizationId);

    const budget = getMemoryBudget({
      ...this.activeBudget,
      ...budgetOverride,
    });
    const organizationId = context.scope.organizationId;
    const before = this.provider.countByKind(organizationId);
    const allEntries = this.provider.list(organizationId);

    const working = pruneWorkingEntries(allEntries, budget);
    const semantic = pruneSemanticEntries(allEntries, budget);
    const episodic = pruneEpisodicEntries(allEntries, budget);

    const keptIds = new Set([
      ...working.kept.map((entry) => entry.id),
      ...semantic.kept.map((entry) => entry.id),
      ...episodic.kept.map((entry) => entry.id),
    ]);

    const prunedEntries = allEntries.filter((entry) => keptIds.has(entry.id));
    this.provider.replaceAll(organizationId, prunedEntries);

    const after = this.provider.countByKind(organizationId);

    return {
      working: {
        before: before.working,
        after: after.working,
        removed: before.working - after.working,
      },
      semantic: {
        before: before.semantic,
        after: after.semantic,
        removed: before.semantic - after.semantic,
      },
      episodic: {
        before: before.episodic,
        after: after.episodic,
        removed: before.episodic - after.episodic,
      },
    };
  }

  serialize(): SerializedMemoryPackage {
    const context = this.requireLoadedContext();
    this.assertOrganizationScope(context.scope.organizationId);

    const ranked = this.retrieve({
      query: '',
      limit: this.activeBudget.maxSerializedEntries,
    });

    return serializeMemoryPackage(context, ranked, new Date().toISOString());
  }

  isLoaded(): boolean {
    return this.activeContext !== null;
  }

  getActiveOrganizationId(): UUID | null {
    return this.activeContext?.scope.organizationId ?? null;
  }

  /** Clears per-instance active context only. Does not mutate shared provider storage. */
  reset(): void {
    this.activeContext = null;
    this.activeBudget = getMemoryBudget();
  }

  private requireLoadedContext(): MemoryLoadContext {
    if (!this.activeContext) {
      throw new MemoryNotLoadedError();
    }

    return this.activeContext;
  }

  private assertOrganizationScope(organizationId: UUID): void {
    if (!this.activeContext) {
      throw new MemoryNotLoadedError();
    }

    if (this.activeContext.scope.organizationId !== organizationId) {
      throw new MemoryScopeMismatchError(
        `Organization scope mismatch: active=${this.activeContext.scope.organizationId}, requested=${organizationId}`,
      );
    }
  }
}

export function createMemoryManager(
  provider: MemoryProvider = mockMemoryProvider,
  options?: MemoryManagerOptions,
): MemoryManager {
  return new MemoryManager(provider, options);
}

/** Default dev/test singleton. Do not use for concurrent production runtime executions. */
export const memoryManager = createMemoryManager();

export function loadMemoryContext(context: MemoryLoadContext): void {
  memoryManager.load(context);
}

export function retrieveMemory(query: MemoryRetrieveQuery): RankedMemoryEntry[] {
  return memoryManager.retrieve(query);
}

export function storeMemory(entry: MemoryStoreInput): StoredMemoryEntry {
  return memoryManager.store(entry);
}

export function pruneMemory(budgetOverride?: Partial<MemoryBudget>): MemoryPruneResult {
  return memoryManager.prune(budgetOverride);
}

export function serializeMemory(): SerializedMemoryPackage {
  return memoryManager.serialize();
}

export { createMockMemoryProvider, mockMemoryProvider };
