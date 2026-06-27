import type { ContextPackage } from '@/types/runtime/dto';

export const RUNTIME_MEMORY_CONTEXT_MAX_FACTS = 20;
export const RUNTIME_MEMORY_CONTEXT_MAX_ENTITIES = 20;
export const RUNTIME_MEMORY_CONTEXT_MAX_RELATIONS = 20;
export const RUNTIME_MEMORY_CONTEXT_MAX_CHARACTERS = 12000;

export interface RuntimeMemoryInjectedFact {
  factId: string;
  type: string;
  text: string;
  confidence: number;
  score: number;
  source: string;
}

export interface RuntimeMemoryInjectedEntity {
  entityId: string;
  name: string;
  type: string;
  aliases: string[];
  score: number;
}

export interface RuntimeMemoryInjectedRelation {
  relationId: string;
  subjectEntityId: string;
  subjectName: string;
  predicate: string;
  objectEntityId: string;
  objectName: string;
  score: number;
}

export interface MemoryFactRef {
  factId: string;
  type: string;
  text: string;
  confidence: number;
  score: number;
  source: string;
}

export interface MemoryEntityRef {
  entityId: string;
  name: string;
  type: string;
  aliases: string[];
  score: number;
}

export interface MemoryRelationRef {
  relationId: string;
  subjectEntityId: string;
  subjectName: string;
  predicate: string;
  objectEntityId: string;
  objectName: string;
  score: number;
}

export interface RuntimeMemoryContextBuildResult {
  enabled: boolean;
  query: string;
  factCount: number;
  entityCount: number;
  relationCount: number;
  totalCharacters: number;
  truncated: boolean;
  memoryFailed: boolean;
  failureMessage: string | null;
  facts: RuntimeMemoryInjectedFact[];
  entities: RuntimeMemoryInjectedEntity[];
  relations: RuntimeMemoryInjectedRelation[];
}

export interface RuntimeMemoryContextOptions {
  instanceId?: string;
  enabled?: boolean;
  maxFacts?: number;
  maxEntities?: number;
  maxRelations?: number;
  maxCharacters?: number;
  memoryServiceAdapter?: import('@/services/runtime/runtime-memory-service-adapter').RuntimeMemoryServiceAdapter;
}

export interface RuntimeMemoryContextSnapshot {
  lastQuery: string | null;
  lastFactCount: number | null;
  lastEntityCount: number | null;
  lastRelationCount: number | null;
  lastTotalCharacters: number | null;
  lastMemoryFailed: boolean | null;
  lastFailureMessage: string | null;
  enabled: boolean;
  updatedAt: string;
}

export interface SerializedRuntimeMemoryInjectedFact {
  factId: string;
  type: string;
  text: string;
  confidence: number;
  score: number;
  source: string;
}

export interface SerializedRuntimeMemoryInjectedEntity {
  entityId: string;
  name: string;
  type: string;
  aliases: string[];
  score: number;
}

export interface SerializedRuntimeMemoryInjectedRelation {
  relationId: string;
  subjectEntityId: string;
  subjectName: string;
  predicate: string;
  objectEntityId: string;
  objectName: string;
  score: number;
}

export interface SerializedRuntimeMemoryContextBuildResult {
  enabled: boolean;
  query: string;
  factCount: number;
  entityCount: number;
  relationCount: number;
  totalCharacters: number;
  truncated: boolean;
  memoryFailed: boolean;
  failureMessage: string | null;
  facts: SerializedRuntimeMemoryInjectedFact[];
  entities: SerializedRuntimeMemoryInjectedEntity[];
  relations: SerializedRuntimeMemoryInjectedRelation[];
}

export interface SerializedRuntimeMemoryContextSnapshot {
  instanceId: string;
  lastQuery: string | null;
  lastFactCount: number | null;
  lastEntityCount: number | null;
  lastRelationCount: number | null;
  lastTotalCharacters: number | null;
  lastMemoryFailed: boolean | null;
  lastFailureMessage: string | null;
  enabled: boolean;
  updatedAt: string;
}

export type { ContextPackage };
