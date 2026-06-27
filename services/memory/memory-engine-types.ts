export const MEMORY_TYPES = [
  'user_fact',
  'business_fact',
  'project_fact',
  'preference',
  'company',
  'document',
  'task',
  'goal',
  'decision',
  'contact',
  'lead',
  'client',
  'event',
] as const;

export type MemoryType = (typeof MEMORY_TYPES)[number];

export type MemoryEntityType =
  | 'person'
  | 'company'
  | 'project'
  | 'document'
  | 'task'
  | 'goal'
  | 'event'
  | 'contact'
  | 'lead'
  | 'client'
  | 'organization'
  | 'generic';

export interface MemoryFact {
  id: string;
  type: MemoryType;
  text: string;
  entityIds: string[];
  confidence: number;
  source: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface MemoryEntity {
  id: string;
  name: string;
  type: MemoryEntityType;
  aliases: string[];
  factIds: string[];
  relationIds: string[];
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface MemoryRelation {
  id: string;
  subjectEntityId: string;
  predicate: string;
  objectEntityId: string;
  factIds: string[];
  confidence: number;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface RememberEntityInput {
  name: string;
  type?: MemoryEntityType;
  aliases?: string[];
  metadata?: Record<string, unknown>;
}

export interface RememberRelationInput {
  subject: string;
  predicate: string;
  object: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface RememberInput {
  type: MemoryType;
  text: string;
  confidence?: number;
  source?: string;
  metadata?: Record<string, unknown>;
  entities?: RememberEntityInput[];
  relations?: RememberRelationInput[];
}

export interface MemoryFactPatch {
  type?: MemoryType;
  text?: string;
  confidence?: number;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryEntityPatch {
  name?: string;
  type?: MemoryEntityType;
  aliases?: string[];
  metadata?: Record<string, unknown>;
}

export interface MemoryRelationPatch {
  predicate?: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export type MemoryUpdatePatch = MemoryFactPatch | MemoryEntityPatch | MemoryRelationPatch;

export interface MemoryFactFilter {
  type?: MemoryType;
  entityId?: string;
  source?: string;
  text?: string;
}

export interface MemoryEntityFilter {
  type?: MemoryEntityType;
  name?: string;
  alias?: string;
}

export interface MemoryRelationFilter {
  subjectEntityId?: string;
  objectEntityId?: string;
  predicate?: string;
}

export interface MemorySearchMatchReason {
  field: string;
  value: string;
}

export interface MemorySearchFactResult {
  fact: MemoryFact;
  score: number;
  reason: MemorySearchMatchReason[];
}

export interface MemorySearchEntityResult {
  entity: MemoryEntity;
  score: number;
  reason: MemorySearchMatchReason[];
}

export interface MemorySearchRelationResult {
  relation: MemoryRelation;
  score: number;
  reason: MemorySearchMatchReason[];
}

export interface MemorySearchResult {
  facts: MemorySearchFactResult[];
  entities: MemorySearchEntityResult[];
  relations: MemorySearchRelationResult[];
}

export interface MemoryEngineSnapshot {
  instanceId: string;
  factCount: number;
  entityCount: number;
  relationCount: number;
  updatedAt: string;
}

export interface SerializedMemoryFact {
  id: string;
  type: MemoryType;
  text: string;
  entityIds: string[];
  confidence: number;
  source: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface SerializedMemoryEntity {
  id: string;
  name: string;
  type: MemoryEntityType;
  aliases: string[];
  factIds: string[];
  relationIds: string[];
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface SerializedMemoryRelation {
  id: string;
  subjectEntityId: string;
  predicate: string;
  objectEntityId: string;
  factIds: string[];
  confidence: number;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface SerializedMemorySearchMatchReason {
  field: string;
  value: string;
}

export interface SerializedMemorySearchFactResult {
  fact: SerializedMemoryFact;
  score: number;
  reason: SerializedMemorySearchMatchReason[];
}

export interface SerializedMemorySearchEntityResult {
  entity: SerializedMemoryEntity;
  score: number;
  reason: SerializedMemorySearchMatchReason[];
}

export interface SerializedMemorySearchRelationResult {
  relation: SerializedMemoryRelation;
  score: number;
  reason: SerializedMemorySearchMatchReason[];
}

export interface SerializedMemorySearchResult {
  facts: SerializedMemorySearchFactResult[];
  entities: SerializedMemorySearchEntityResult[];
  relations: SerializedMemorySearchRelationResult[];
}

export interface SerializedMemoryEngineSnapshot {
  instanceId: string;
  factCount: number;
  entityCount: number;
  relationCount: number;
  updatedAt: string;
  facts: SerializedMemoryFact[];
  entities: SerializedMemoryEntity[];
  relations: SerializedMemoryRelation[];
}

export interface MemoryEngineOptions {
  instanceId?: string;
  defaultConfidence?: number;
}
