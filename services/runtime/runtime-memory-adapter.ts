import { createMemoryManager, type MemoryManager } from '@/services/runtime/memory/memory-manager';
import { createMockMemoryProvider } from '@/services/runtime/memory/providers/mock-memory-provider';
import type {
  MemoryLoadContext,
  MemoryProvider,
  MemoryRetrieveQuery,
  MemoryStoreInput,
} from '@/services/runtime/memory/memory-types';
import {
  RuntimeMemoryNotLoadedError,
  RuntimeMemoryOperationError,
  RuntimeMemoryRequestError,
  RuntimeMemoryValidationError,
} from '@/services/runtime/runtime-memory-errors';
import {
  serializeRuntimeMemoryDeleteResult,
  serializeRuntimeMemoryPackage,
  serializeRuntimeMemorySearchResult,
  serializeRuntimeMemorySnapshot,
  serializeRuntimeMemoryWriteResult,
} from '@/services/runtime/runtime-memory-serializer';
import type {
  RuntimeMemoryAdapterOptions,
  RuntimeMemoryDependencies,
  RuntimeMemoryReadRequest,
  RuntimeMemorySearchQuery,
  RuntimeMemorySnapshot,
  RuntimeMemoryWriteInput,
  SerializedRuntimeMemoryDeleteResult,
  SerializedRuntimeMemoryPackage,
  SerializedRuntimeMemorySearchResult,
  SerializedRuntimeMemorySnapshot,
  SerializedRuntimeMemoryWriteResult,
} from '@/services/runtime/runtime-memory-types';
import type { UUID } from '@/types/runtime/dto';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateReadRequest(request: RuntimeMemoryReadRequest): void {
  if (!request || typeof request !== 'object') {
    throw new RuntimeMemoryValidationError('read request must be an object');
  }

  if (!isNonEmptyString(request.scope?.organizationId)) {
    throw new RuntimeMemoryValidationError('scope.organizationId is required');
  }

  if (!isNonEmptyString(request.employeeId)) {
    throw new RuntimeMemoryValidationError('employeeId is required');
  }

  if (!isNonEmptyString(request.trace?.runId)) {
    throw new RuntimeMemoryValidationError('trace.runId is required');
  }

  if (!isNonEmptyString(request.trace?.traceId)) {
    throw new RuntimeMemoryValidationError('trace.traceId is required');
  }
}

function validateWriteInput(memory: RuntimeMemoryWriteInput): void {
  if (!memory || typeof memory !== 'object') {
    throw new RuntimeMemoryValidationError('memory must be an object');
  }

  if (!isNonEmptyString(memory.kind)) {
    throw new RuntimeMemoryValidationError('memory.kind is required');
  }

  if (!isNonEmptyString(memory.scope)) {
    throw new RuntimeMemoryValidationError('memory.scope is required');
  }

  if (!isNonEmptyString(memory.content)) {
    throw new RuntimeMemoryValidationError('memory.content is required');
  }

  if (typeof memory.importance !== 'number' || Number.isNaN(memory.importance)) {
    throw new RuntimeMemoryValidationError('memory.importance must be a number');
  }
}

function validateSearchQuery(query: RuntimeMemorySearchQuery): void {
  if (!query || typeof query !== 'object') {
    throw new RuntimeMemoryValidationError('search query must be an object');
  }

  if (typeof query.query !== 'string') {
    throw new RuntimeMemoryValidationError('search query string is required');
  }
}

function toKindLabel(kind: MemoryRetrieveQuery['kind']): string | null {
  if (!kind) {
    return null;
  }

  return Array.isArray(kind) ? kind.join(',') : kind;
}

function deleteViaProvider(provider: MemoryProvider, organizationId: UUID, id: UUID): boolean {
  const entries = provider.list(organizationId);
  const filtered = entries.filter((entry) => entry.id !== id);

  if (filtered.length === entries.length) {
    return false;
  }

  provider.replaceAll(organizationId, filtered);
  return true;
}

function createDefaultDependencies(
  manager: MemoryManager,
  provider: MemoryProvider,
): RuntimeMemoryDependencies {
  return {
    load: (request: MemoryLoadContext) => manager.load(request),
    retrieve: (query: MemoryRetrieveQuery) => manager.retrieve(query),
    store: (entry: MemoryStoreInput) => manager.store(entry),
    serializePackage: () => manager.serialize(),
    getActiveOrganizationId: () => manager.getActiveOrganizationId(),
    deleteEntry: (organizationId: UUID, id: UUID) =>
      deleteViaProvider(provider, organizationId, id),
    resetManager: () => manager.reset(),
  };
}

/**
 * Runtime-facing memory adapter. Delegates to existing Memory Manager only.
 *
 * @deprecated Legacy DTO memory path. Use {@link MemoryService} via
 * `RuntimeMemoryServiceAdapter` / `RuntimeMemoryContext` instead.
 */
export class RuntimeMemoryAdapter {
  private snapshot: RuntimeMemorySnapshot = {
    lastOperation: null,
    lastRunId: null,
    lastOrganizationId: null,
    lastEntryCount: null,
    updatedAt: new Date().toISOString(),
  };

  constructor(private readonly dependencies: RuntimeMemoryDependencies) {}

  read(request: RuntimeMemoryReadRequest): SerializedRuntimeMemoryPackage {
    validateReadRequest(request);

    try {
      this.dependencies.load(request);
      const memoryPackage = this.dependencies.serializePackage();
      const serialized = serializeRuntimeMemoryPackage(memoryPackage);
      this.touch('read', request.trace.runId, request.scope.organizationId, serialized.entryCount);
      return serialized;
    } catch (error) {
      throw toOperationError(error, 'Memory read failed');
    }
  }

  write(memory: RuntimeMemoryWriteInput): SerializedRuntimeMemoryWriteResult {
    validateWriteInput(memory);
    this.requireLoadedContext();

    try {
      const stored = this.dependencies.store(memory);
      const serialized = serializeRuntimeMemoryWriteResult(stored);
      this.touch('write', null, stored.organizationId, null);
      return serialized;
    } catch (error) {
      throw toOperationError(error, 'Memory write failed');
    }
  }

  search(query: RuntimeMemorySearchQuery): SerializedRuntimeMemorySearchResult {
    validateSearchQuery(query);
    this.requireLoadedContext();

    try {
      const entries = this.dependencies.retrieve(query);
      const serialized = serializeRuntimeMemorySearchResult(
        query.query,
        toKindLabel(query.kind),
        query.limit ?? null,
        entries,
      );
      this.touch(
        'search',
        null,
        this.dependencies.getActiveOrganizationId(),
        serialized.entryCount,
      );
      return serialized;
    } catch (error) {
      throw toOperationError(error, 'Memory search failed');
    }
  }

  delete(id: string): SerializedRuntimeMemoryDeleteResult {
    if (!isNonEmptyString(id)) {
      throw new RuntimeMemoryRequestError('memory id is required');
    }

    const organizationId = this.dependencies.getActiveOrganizationId();
    if (!organizationId) {
      throw new RuntimeMemoryNotLoadedError();
    }

    try {
      const deleted = this.dependencies.deleteEntry(organizationId, id);
      const serialized = serializeRuntimeMemoryDeleteResult(id, deleted);
      this.touch('delete', null, organizationId, null);
      return serialized;
    } catch (error) {
      throw toOperationError(error, 'Memory delete failed');
    }
  }

  serialize(): SerializedRuntimeMemorySnapshot {
    return serializeRuntimeMemorySnapshot(this.snapshot);
  }

  reset(): void {
    this.dependencies.resetManager();
    this.snapshot = {
      lastOperation: null,
      lastRunId: null,
      lastOrganizationId: null,
      lastEntryCount: null,
      updatedAt: new Date().toISOString(),
    };
  }

  private requireLoadedContext(): void {
    if (!this.dependencies.getActiveOrganizationId()) {
      throw new RuntimeMemoryNotLoadedError();
    }
  }

  private touch(
    operation: RuntimeMemorySnapshot['lastOperation'],
    runId: string | null,
    organizationId: string | null,
    entryCount: number | null,
  ): void {
    this.snapshot = {
      lastOperation: operation,
      lastRunId: runId,
      lastOrganizationId: organizationId,
      lastEntryCount: entryCount,
      updatedAt: new Date().toISOString(),
    };
  }
}

function toOperationError(
  error: unknown,
  fallback: string,
):
  | RuntimeMemoryOperationError
  | RuntimeMemoryValidationError
  | RuntimeMemoryRequestError
  | RuntimeMemoryNotLoadedError {
  if (
    error instanceof RuntimeMemoryValidationError ||
    error instanceof RuntimeMemoryRequestError ||
    error instanceof RuntimeMemoryNotLoadedError
  ) {
    return error;
  }

  const message = error instanceof Error ? error.message : fallback;
  return new RuntimeMemoryOperationError(message);
}

/**
 * @deprecated Legacy DTO memory path. Use {@link createRuntimeMemoryServiceAdapter} instead.
 */
export function createRuntimeMemoryAdapter(
  options?: RuntimeMemoryAdapterOptions,
): RuntimeMemoryAdapter {
  const provider = options?.provider ?? createMockMemoryProvider();
  const manager = options?.manager ?? createMemoryManager(provider, options?.managerOptions);
  const defaults = createDefaultDependencies(manager, provider);
  const dependencies: RuntimeMemoryDependencies = {
    load: options?.dependencies?.load ?? defaults.load,
    retrieve: options?.dependencies?.retrieve ?? defaults.retrieve,
    store: options?.dependencies?.store ?? defaults.store,
    serializePackage: options?.dependencies?.serializePackage ?? defaults.serializePackage,
    getActiveOrganizationId:
      options?.dependencies?.getActiveOrganizationId ?? defaults.getActiveOrganizationId,
    deleteEntry: options?.dependencies?.deleteEntry ?? defaults.deleteEntry,
    resetManager: options?.dependencies?.resetManager ?? defaults.resetManager,
  };

  return new RuntimeMemoryAdapter(dependencies);
}

/** Default dev/test singleton. Do not use for concurrent production memory operations. */
export const runtimeMemoryAdapter = createRuntimeMemoryAdapter();
