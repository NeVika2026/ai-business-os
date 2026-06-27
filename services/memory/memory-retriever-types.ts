import type {
  MemoryEntity,
  MemoryFact,
  MemoryRelation,
} from '@/services/memory/memory-engine-types';

export const MEMORY_RETRIEVER_MAX_FACTS = 20;
export const MEMORY_RETRIEVER_MAX_ENTITIES = 20;
export const MEMORY_RETRIEVER_MAX_RELATIONS = 20;
export const MEMORY_RETRIEVER_MAX_CHARACTERS = 12000;

export const MEMORY_RETRIEVER_SCORE_MAX = 100;

export interface MemoryRetrieverScoreComponents {
  lexical: number;
  entityOverlap: number;
  relationOverlap: number;
  recency: number;
  confidence: number;
  frequency: number;
}

export interface MemoryRetrieverInput {
  query: string;
  facts: MemoryFact[];
  entities: MemoryEntity[];
  relations: MemoryRelation[];
}

export interface MemoryRetrieverRankedFact {
  fact: MemoryFact;
  score: number;
  matchedTokens: string[];
  reason: string[];
  components: MemoryRetrieverScoreComponents;
}

export interface MemoryRetrieverRankedEntity {
  entity: MemoryEntity;
  score: number;
  matchedTokens: string[];
  reason: string[];
  components: MemoryRetrieverScoreComponents;
}

export interface MemoryRetrieverRankedRelation {
  relation: MemoryRelation;
  score: number;
  matchedTokens: string[];
  reason: string[];
  components: MemoryRetrieverScoreComponents;
  subjectName: string;
  objectName: string;
}

export interface MemoryRetrieverRankResult {
  query: string;
  facts: MemoryRetrieverRankedFact[];
  entities: MemoryRetrieverRankedEntity[];
  relations: MemoryRetrieverRankedRelation[];
}

export interface MemoryRetrieverResult {
  query: string;
  selectedFacts: MemoryRetrieverRankedFact[];
  selectedEntities: MemoryRetrieverRankedEntity[];
  selectedRelations: MemoryRetrieverRankedRelation[];
  score: number;
  reason: string[];
  truncated: boolean;
  totalCharacters: number;
}

export interface MemoryRetrieverSnapshot {
  instanceId: string;
  lastQuery: string | null;
  lastScore: number | null;
  lastFactCount: number | null;
  lastEntityCount: number | null;
  lastRelationCount: number | null;
  lastTotalCharacters: number | null;
  lastTruncated: boolean | null;
  updatedAt: string;
}

export interface SerializedMemoryRetrieverScoreComponents {
  lexical: number;
  entityOverlap: number;
  relationOverlap: number;
  recency: number;
  confidence: number;
  frequency: number;
}

export interface SerializedMemoryRetrieverRankedFact {
  factId: string;
  type: MemoryFact['type'];
  text: string;
  confidence: number;
  score: number;
  matchedTokens: string[];
  reason: string[];
  components: SerializedMemoryRetrieverScoreComponents;
}

export interface SerializedMemoryRetrieverRankedEntity {
  entityId: string;
  name: string;
  type: MemoryEntity['type'];
  aliases: string[];
  score: number;
  matchedTokens: string[];
  reason: string[];
  components: SerializedMemoryRetrieverScoreComponents;
}

export interface SerializedMemoryRetrieverRankedRelation {
  relationId: string;
  subjectEntityId: string;
  subjectName: string;
  predicate: string;
  objectEntityId: string;
  objectName: string;
  score: number;
  matchedTokens: string[];
  reason: string[];
  components: SerializedMemoryRetrieverScoreComponents;
}

export interface SerializedMemoryRetrieverRankResult {
  query: string;
  facts: SerializedMemoryRetrieverRankedFact[];
  entities: SerializedMemoryRetrieverRankedEntity[];
  relations: SerializedMemoryRetrieverRankedRelation[];
}

export interface SerializedMemoryRetrieverResult {
  query: string;
  selectedFacts: SerializedMemoryRetrieverRankedFact[];
  selectedEntities: SerializedMemoryRetrieverRankedEntity[];
  selectedRelations: SerializedMemoryRetrieverRankedRelation[];
  score: number;
  reason: string[];
  truncated: boolean;
  totalCharacters: number;
}

export interface SerializedMemoryRetrieverSnapshot {
  instanceId: string;
  lastQuery: string | null;
  lastScore: number | null;
  lastFactCount: number | null;
  lastEntityCount: number | null;
  lastRelationCount: number | null;
  lastTotalCharacters: number | null;
  lastTruncated: boolean | null;
  updatedAt: string;
  lastResult: SerializedMemoryRetrieverResult | null;
}

export interface MemoryRetrieverOptions {
  instanceId?: string;
  maxFacts?: number;
  maxEntities?: number;
  maxRelations?: number;
  maxCharacters?: number;
}
