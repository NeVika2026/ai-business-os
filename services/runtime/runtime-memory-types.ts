import type {
  MemoryBudget,
  MemoryKind,
  MemoryLoadContext,
  MemoryManagerOptions,
  MemoryProvider,
  MemoryRetrieveQuery,
  MemoryStoreInput,
  RankedMemoryEntry,
  StoredMemoryEntry,
} from '@/services/runtime/memory/memory-types';
import type { MemoryEntry, MemoryPackage, UUID } from '@/types/runtime/dto';

export type RuntimeMemoryReadRequest = MemoryLoadContext;

export type RuntimeMemoryWriteInput = MemoryStoreInput;

export type RuntimeMemorySearchQuery = MemoryRetrieveQuery;

export interface SerializedRuntimeMemoryEntry {
  id: string;
  scope: string;
  content: string;
  importance: number;
  lastUsedAt: string | null;
}

export interface SerializedRuntimeMemorySearchEntry extends SerializedRuntimeMemoryEntry {
  kind: string;
  relevanceScore: number;
  recencyScore: number;
  importanceScore: number;
  mockScore: number;
  totalScore: number;
}

export interface SerializedRuntimeMemoryPackage {
  organizationId: string;
  employeeId: string;
  runId: string;
  traceId: string;
  correlationId: string | null;
  parentRunId: string | null;
  enabled: boolean;
  retrievedAt: string;
  entryCount: number;
  entries: SerializedRuntimeMemoryEntry[];
}

export interface SerializedRuntimeMemoryWriteResult {
  id: string;
  kind: string;
  scope: string;
  content: string;
  importance: number;
  organizationId: string;
  employeeId: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
}

export interface SerializedRuntimeMemorySearchResult {
  query: string;
  kind: string | null;
  limit: number | null;
  entryCount: number;
  entries: SerializedRuntimeMemorySearchEntry[];
}

export interface SerializedRuntimeMemoryDeleteResult {
  id: string;
  deleted: boolean;
}

export type RuntimeMemoryOperation = 'read' | 'write' | 'search' | 'delete' | null;

export interface RuntimeMemorySnapshot {
  lastOperation: RuntimeMemoryOperation;
  lastRunId: string | null;
  lastOrganizationId: string | null;
  lastEntryCount: number | null;
  updatedAt: string;
}

export interface SerializedRuntimeMemorySnapshot {
  lastOperation: RuntimeMemoryOperation;
  lastRunId: string | null;
  lastOrganizationId: string | null;
  lastEntryCount: number | null;
  updatedAt: string;
}

export interface RuntimeMemoryDependencies {
  load: (request: MemoryLoadContext) => void;
  retrieve: (query: MemoryRetrieveQuery) => RankedMemoryEntry[];
  store: (entry: MemoryStoreInput) => StoredMemoryEntry;
  serializePackage: () => MemoryPackage;
  getActiveOrganizationId: () => UUID | null;
  deleteEntry: (organizationId: UUID, id: UUID) => boolean;
  resetManager: () => void;
}

export interface RuntimeMemoryAdapterOptions {
  manager?: MemoryManager;
  provider?: MemoryProvider;
  managerOptions?: MemoryManagerOptions;
  budget?: Partial<MemoryBudget>;
  dependencies?: Partial<RuntimeMemoryDependencies>;
}

export type {
  MemoryEntry,
  MemoryKind,
  MemoryPackage,
  MemoryStoreInput,
  RankedMemoryEntry,
  StoredMemoryEntry,
};

export type MemoryManager = import('@/services/runtime/memory/memory-manager').MemoryManager;
