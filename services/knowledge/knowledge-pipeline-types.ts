import type { KnowledgeSearchResult } from '@/services/knowledge/knowledge-index-types';
import type { KnowledgeImporter } from '@/services/knowledge/knowledge-importer';
import type { KnowledgeMarkdownParser } from '@/services/knowledge/knowledge-markdown-parser';
import type { KnowledgeChunkEngine } from '@/services/knowledge/knowledge-chunk-engine';
import type { KnowledgeIndex } from '@/services/knowledge/knowledge-index';
import type { KnowledgeSearchEngine } from '@/services/knowledge/knowledge-search-engine';

export interface KnowledgePipelineIngestMarkdownInput {
  content: string;
  title?: string;
  path?: string | null;
  source?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface KnowledgePipelineIngestResult {
  documentId: string;
  title: string;
  chunkCount: number;
  indexedChunkCount: number;
}

export interface KnowledgePipelineStatistics {
  documentCount: number;
  chunkCount: number;
  indexEntryCount: number;
  averageChunkTokens: number;
  lastIngestAt: string | null;
  updatedAt: string;
}

export interface KnowledgePipelineSnapshot {
  instanceId: string;
  statistics: KnowledgePipelineStatistics;
  updatedAt: string;
}

export interface SerializedKnowledgePipelineStatistics {
  documentCount: number;
  chunkCount: number;
  indexEntryCount: number;
  averageChunkTokens: number;
  lastIngestAt: string | null;
  updatedAt: string;
}

export interface SerializedKnowledgePipelineSnapshot {
  instanceId: string;
  statistics: SerializedKnowledgePipelineStatistics;
  importer: ReturnType<KnowledgeImporter['serialize']>;
  chunks: ReturnType<KnowledgeChunkEngine['serialize']>;
  index: ReturnType<KnowledgeIndex['serialize']>;
  search: ReturnType<KnowledgeSearchEngine['serialize']>;
  updatedAt: string;
}

export interface KnowledgePipelineOptions {
  instanceId?: string;
  importer?: KnowledgeImporter;
  parser?: KnowledgeMarkdownParser;
  chunkEngine?: KnowledgeChunkEngine;
  index?: KnowledgeIndex;
  searchEngine?: KnowledgeSearchEngine;
}

export type KnowledgePipelineSearchResult = KnowledgeSearchResult;
