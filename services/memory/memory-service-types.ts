import type {
  MemoryEntity,
  MemoryEntityFilter,
  MemoryEntityType,
  MemoryFact,
  MemoryFactFilter,
  MemoryRelation,
  MemoryRelationFilter,
  MemorySearchResult,
  RememberInput,
} from '@/services/memory/memory-engine-types';
import type {
  ExtractedEntity,
  ExtractedFact,
  ExtractedRelation,
  MemoryExtractionResult,
} from '@/services/memory/memory-extractor-types';

export interface MemoryServiceInput {
  text: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryServiceErrorEntry {
  stage: 'extract' | 'remember';
  message: string;
  source: string | null;
}

export interface MemoryServiceStatistics {
  factsSaved: number;
  entitiesSaved: number;
  relationsSaved: number;
  duplicatesSkipped: number;
  errors: number;
  duration: number;
}

export interface MemoryProcessResult {
  input: string;
  facts: MemoryFact[];
  entities: MemoryEntity[];
  relations: MemoryRelation[];
  statistics: MemoryServiceStatistics;
  errors: MemoryServiceErrorEntry[];
}

export interface MemoryPreviewResult {
  input: string;
  facts: ExtractedFact[];
  entities: ExtractedEntity[];
  relations: ExtractedRelation[];
  statistics: {
    factCount: number;
    entityCount: number;
    relationCount: number;
    duplicatesSkipped: number;
    sentencesProcessed: number;
  };
}

export interface MemoryServiceSnapshot {
  instanceId: string;
  lastOperation: 'process' | 'remember' | 'preview' | null;
  lastInput: string | null;
  lastProcessedAt: string | null;
  factCount: number;
  entityCount: number;
  relationCount: number;
  updatedAt: string;
}

export interface SerializedMemoryServiceErrorEntry {
  stage: 'extract' | 'remember';
  message: string;
  source: string | null;
}

export interface SerializedMemoryServiceStatistics {
  factsSaved: number;
  entitiesSaved: number;
  relationsSaved: number;
  duplicatesSkipped: number;
  errors: number;
  duration: number;
}

export interface SerializedMemoryFact {
  id: string;
  type: MemoryFact['type'];
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

export interface SerializedMemoryProcessResult {
  input: string;
  facts: SerializedMemoryFact[];
  entities: SerializedMemoryEntity[];
  relations: SerializedMemoryRelation[];
  statistics: SerializedMemoryServiceStatistics;
  errors: SerializedMemoryServiceErrorEntry[];
}

export interface SerializedMemoryPreviewResult {
  input: string;
  facts: MemoryExtractionResult['facts'];
  entities: MemoryExtractionResult['entities'];
  relations: MemoryExtractionResult['relations'];
  statistics: {
    factCount: number;
    entityCount: number;
    relationCount: number;
    duplicatesSkipped: number;
    sentencesProcessed: number;
  };
}

export interface SerializedMemoryServiceSnapshot {
  instanceId: string;
  lastOperation: 'process' | 'remember' | 'preview' | null;
  lastInput: string | null;
  lastProcessedAt: string | null;
  factCount: number;
  entityCount: number;
  relationCount: number;
  updatedAt: string;
  engine: ReturnType<import('@/services/memory/memory-engine').MemoryEngine['serialize']>;
  extractor: ReturnType<import('@/services/memory/memory-extractor').MemoryExtractor['serialize']>;
  lastProcess: SerializedMemoryProcessResult | null;
}

export interface MemoryServiceOptions {
  instanceId?: string;
  engine?: import('@/services/memory/memory-engine').MemoryEngine;
  extractor?: import('@/services/memory/memory-extractor').MemoryExtractor;
}

export type {
  MemoryEntity,
  MemoryEntityFilter,
  MemoryFact,
  MemoryFactFilter,
  MemoryRelation,
  MemoryRelationFilter,
  MemorySearchResult,
  RememberInput,
};
