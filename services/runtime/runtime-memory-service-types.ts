import type {
  MemoryEntityFilter,
  MemoryFactFilter,
  MemoryRelationFilter,
  MemoryType,
  RememberInput,
} from '@/services/memory/memory-engine-types';

export const RUNTIME_MEMORY_SERVICE_CONTEXT_MAX_FACTS = 20;
export const RUNTIME_MEMORY_SERVICE_CONTEXT_MAX_ENTITIES = 20;
export const RUNTIME_MEMORY_SERVICE_CONTEXT_MAX_RELATIONS = 20;
export const RUNTIME_MEMORY_SERVICE_CONTEXT_MAX_CHARACTERS = 12000;

export type RuntimeMemoryServiceOperation =
  | 'process'
  | 'preview'
  | 'remember'
  | 'search'
  | 'context'
  | 'facts'
  | 'entities'
  | 'relations'
  | null;

export interface RuntimeMemoryServiceInput {
  text: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface RuntimeMemoryServiceRememberInput {
  type: MemoryType;
  text: string;
  confidence?: number;
  source?: string;
  metadata?: Record<string, unknown>;
  entities?: RememberInput['entities'];
  relations?: RememberInput['relations'];
}

export interface RuntimeMemoryServiceContextFact {
  factId: string;
  type: MemoryType;
  text: string;
  confidence: number;
  score: number;
  source: string;
}

export interface RuntimeMemoryServiceContextEntity {
  entityId: string;
  name: string;
  type: string;
  aliases: string[];
  score: number;
}

export interface RuntimeMemoryServiceContextRelation {
  relationId: string;
  subjectEntityId: string;
  subjectName: string;
  predicate: string;
  objectEntityId: string;
  objectName: string;
  score: number;
}

export interface RuntimeMemoryServiceContextResult {
  query: string;
  factCount: number;
  entityCount: number;
  relationCount: number;
  totalCharacters: number;
  truncated: boolean;
  memoryFailed: boolean;
  failureMessage: string | null;
  facts: RuntimeMemoryServiceContextFact[];
  entities: RuntimeMemoryServiceContextEntity[];
  relations: RuntimeMemoryServiceContextRelation[];
}

export interface RuntimeMemoryServiceSnapshot {
  instanceId: string;
  lastOperation: RuntimeMemoryServiceOperation;
  lastQuery: string | null;
  lastInput: string | null;
  lastFailureMessage: string | null;
  factCount: number;
  entityCount: number;
  relationCount: number;
  updatedAt: string;
}

export interface RuntimeMemoryServiceProcessResult {
  input: string;
  memoryFailed: boolean;
  failureMessage: string | null;
  facts: ReturnType<import('@/services/memory/memory-service').MemoryService['facts']>;
  entities: ReturnType<import('@/services/memory/memory-service').MemoryService['entities']>;
  relations: ReturnType<import('@/services/memory/memory-service').MemoryService['relations']>;
  statistics: {
    factsSaved: number;
    entitiesSaved: number;
    relationsSaved: number;
    duplicatesSkipped: number;
    errors: number;
    duration: number;
  };
  errors: Array<{
    stage: string;
    message: string;
    source: string | null;
  }>;
}

export interface SerializedRuntimeMemoryServiceContextFact {
  factId: string;
  type: MemoryType;
  text: string;
  confidence: number;
  score: number;
  source: string;
}

export interface SerializedRuntimeMemoryServiceContextEntity {
  entityId: string;
  name: string;
  type: string;
  aliases: string[];
  score: number;
}

export interface SerializedRuntimeMemoryServiceContextRelation {
  relationId: string;
  subjectEntityId: string;
  subjectName: string;
  predicate: string;
  objectEntityId: string;
  objectName: string;
  score: number;
}

export interface SerializedRuntimeMemoryServiceContextResult {
  query: string;
  factCount: number;
  entityCount: number;
  relationCount: number;
  totalCharacters: number;
  truncated: boolean;
  memoryFailed: boolean;
  failureMessage: string | null;
  facts: SerializedRuntimeMemoryServiceContextFact[];
  entities: SerializedRuntimeMemoryServiceContextEntity[];
  relations: SerializedRuntimeMemoryServiceContextRelation[];
}

export interface SerializedRuntimeMemoryServiceSnapshot {
  instanceId: string;
  lastOperation: RuntimeMemoryServiceOperation;
  lastQuery: string | null;
  lastInput: string | null;
  lastFailureMessage: string | null;
  factCount: number;
  entityCount: number;
  relationCount: number;
  updatedAt: string;
  service: ReturnType<import('@/services/memory/memory-service').MemoryService['serialize']>;
}

export interface RuntimeMemoryServiceAdapterOptions {
  instanceId?: string;
  maxFacts?: number;
  maxEntities?: number;
  maxRelations?: number;
  maxCharacters?: number;
  memoryService?: import('@/services/memory/memory-service').MemoryService;
}

export type {
  MemoryEntityFilter,
  MemoryFactFilter,
  MemoryRelationFilter,
  MemoryType,
  RememberInput,
};
