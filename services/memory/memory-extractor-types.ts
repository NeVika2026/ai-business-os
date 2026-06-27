import type { MemoryEntityType, MemoryType } from '@/services/memory/memory-engine-types';

export const EXTRACTOR_FACT_TYPES = [
  'user_fact',
  'business_fact',
  'project_fact',
  'preference',
  'goal',
  'decision',
  'company',
  'document',
  'contact',
  'client',
  'lead',
  'task',
  'event',
] as const;

export type ExtractorFactType = (typeof EXTRACTOR_FACT_TYPES)[number];

export type ExtractorConfidenceLevel = 'explicit' | 'strong' | 'weak';

export interface MemoryExtractorInput {
  text: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface ExtractedFact {
  type: ExtractorFactType;
  text: string;
  confidence: number;
  confidenceLevel: ExtractorConfidenceLevel;
  pattern: string;
  source: string;
  metadata: Record<string, unknown>;
}

export interface ExtractedEntity {
  name: string;
  type: MemoryEntityType;
  aliases: string[];
  confidence: number;
  source: string;
  metadata: Record<string, unknown>;
}

export interface ExtractedRelation {
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  confidenceLevel: ExtractorConfidenceLevel;
  pattern: string;
  source: string;
  metadata: Record<string, unknown>;
}

export interface MemoryExtractionStatistics {
  factCount: number;
  entityCount: number;
  relationCount: number;
  duplicatesSkipped: number;
  sentencesProcessed: number;
}

export interface MemoryExtractionResult {
  input: string;
  facts: ExtractedFact[];
  entities: ExtractedEntity[];
  relations: ExtractedRelation[];
  statistics: MemoryExtractionStatistics;
}

export interface MemoryExtractorSnapshot {
  instanceId: string;
  lastInput: string | null;
  lastExtractedAt: string | null;
  extractionCount: number;
  statistics: MemoryExtractionStatistics;
  updatedAt: string;
}

export interface SerializedExtractedFact {
  type: ExtractorFactType;
  text: string;
  confidence: number;
  confidenceLevel: ExtractorConfidenceLevel;
  pattern: string;
  source: string;
  metadata: Record<string, unknown>;
}

export interface SerializedExtractedEntity {
  name: string;
  type: MemoryEntityType;
  aliases: string[];
  confidence: number;
  source: string;
  metadata: Record<string, unknown>;
}

export interface SerializedExtractedRelation {
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  confidenceLevel: ExtractorConfidenceLevel;
  pattern: string;
  source: string;
  metadata: Record<string, unknown>;
}

export interface SerializedMemoryExtractionStatistics {
  factCount: number;
  entityCount: number;
  relationCount: number;
  duplicatesSkipped: number;
  sentencesProcessed: number;
}

export interface SerializedMemoryExtractionResult {
  input: string;
  facts: SerializedExtractedFact[];
  entities: SerializedExtractedEntity[];
  relations: SerializedExtractedRelation[];
  statistics: SerializedMemoryExtractionStatistics;
}

export interface SerializedMemoryExtractorSnapshot {
  instanceId: string;
  lastInput: string | null;
  lastExtractedAt: string | null;
  extractionCount: number;
  statistics: SerializedMemoryExtractionStatistics;
  updatedAt: string;
  lastResult: SerializedMemoryExtractionResult | null;
}

export interface MemoryExtractorOptions {
  instanceId?: string;
}

export type { MemoryEntityType, MemoryType };
