import type {
  ISODateTime,
  MemoryEntry,
  MemoryPackage,
  TenantScope,
  TraceContext,
  UUID,
} from '@/types/runtime/dto';

export type MemoryKind = 'working' | 'semantic' | 'episodic';

export interface MemoryBudget {
  maxWorkingEntries: number;
  maxSemanticEntries: number;
  maxEpisodicEntries: number;
  maxSerializedEntries: number;
}

export interface MemoryLoadContext {
  scope: TenantScope;
  trace: TraceContext;
  employeeId: UUID;
  enabled?: boolean;
  budget?: Partial<MemoryBudget>;
}

export interface MemoryRetrieveQuery {
  query: string;
  kind?: MemoryKind | MemoryKind[];
  limit?: number;
}

export interface MemoryStoreInput {
  id?: UUID;
  kind: MemoryKind;
  scope: MemoryEntry['scope'];
  content: string;
  importance: number;
  payload?: Record<string, unknown>;
  createdAt?: ISODateTime;
  updatedAt?: ISODateTime;
  lastUsedAt?: ISODateTime | null;
}

export interface StoredMemoryEntry extends MemoryEntry {
  kind: MemoryKind;
  organizationId: UUID;
  employeeId: UUID;
  payload: Record<string, unknown>;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface MemoryRankScores {
  recency: number;
  importance: number;
  relevance: number;
  mock: number;
  total: number;
}

export interface RankedMemoryEntry extends StoredMemoryEntry {
  scores: MemoryRankScores;
}

export interface MemoryPruneResult {
  working: { before: number; after: number; removed: number };
  semantic: { before: number; after: number; removed: number };
  episodic: { before: number; after: number; removed: number };
}

export type SerializedMemoryPackage = MemoryPackage;

export interface MemoryProvider {
  ensureSeed(organizationId: UUID, employeeId: UUID): void;
  list(organizationId: UUID, kind?: MemoryKind | MemoryKind[]): StoredMemoryEntry[];
  upsert(
    organizationId: UUID,
    employeeId: UUID,
    input: MemoryStoreInput,
    now: ISODateTime,
  ): StoredMemoryEntry;
  replaceAll(organizationId: UUID, entries: StoredMemoryEntry[]): void;
  countByKind(organizationId: UUID): Record<MemoryKind, number>;
  reset?(): void;
}

export interface MemoryManagerOptions {
  budget?: Partial<MemoryBudget>;
}
