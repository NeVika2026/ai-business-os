import type { KnowledgePipelineIngestMarkdownInput } from '@/services/knowledge/knowledge-pipeline-types';
import type { KnowledgeSearchResult } from '@/services/knowledge/knowledge-index-types';

export interface RuntimeKnowledgeContextChunk {
  chunkId: string;
  documentId: string;
  sourceTitle: string;
  section: string | null;
  content: string;
  score: number;
  source: string;
  tags: string[];
}

export interface RuntimeKnowledgeContextResult {
  query: string;
  chunkCount: number;
  chunks: RuntimeKnowledgeContextChunk[];
}

export interface RuntimeKnowledgeContextQuery {
  query: string;
  limit?: number;
}

export interface RuntimeKnowledgeSearchQuery {
  query: string;
  limit?: number;
}

export interface RuntimeKnowledgeChunkQuery {
  chunkId: string;
  limit?: number;
}

export interface RuntimeKnowledgeStatistics {
  documentCount: number;
  chunkCount: number;
  indexEntryCount: number;
  averageChunkTokens: number;
  lastIngestAt: string | null;
  updatedAt: string;
}

export type RuntimeKnowledgeOperation =
  | 'ingestDirectory'
  | 'ingestMarkdown'
  | 'search'
  | 'context'
  | 'related'
  | 'similar'
  | null;

export interface RuntimeKnowledgeSnapshot {
  lastOperation: RuntimeKnowledgeOperation;
  lastQuery: string | null;
  lastChunkId: string | null;
  lastChunkCount: number | null;
  updatedAt: string;
}

export interface SerializedRuntimeKnowledgeContextChunk {
  chunkId: string;
  documentId: string;
  sourceTitle: string;
  section: string | null;
  content: string;
  score: number;
  source: string;
  tags: string[];
}

export interface SerializedRuntimeKnowledgeContextResult {
  query: string;
  chunkCount: number;
  chunks: SerializedRuntimeKnowledgeContextChunk[];
}

export interface SerializedRuntimeKnowledgeSearchResult {
  chunkId: string;
  documentId: string;
  title: string;
  section: string | null;
  text: string;
  score: number;
  tags: string[];
  source: string;
}

export interface SerializedRuntimeKnowledgeStatistics {
  documentCount: number;
  chunkCount: number;
  indexEntryCount: number;
  averageChunkTokens: number;
  lastIngestAt: string | null;
  updatedAt: string;
}

export interface SerializedRuntimeKnowledgeSnapshot {
  instanceId: string;
  lastOperation: RuntimeKnowledgeOperation;
  lastQuery: string | null;
  lastChunkId: string | null;
  lastChunkCount: number | null;
  statistics: SerializedRuntimeKnowledgeStatistics;
  updatedAt: string;
}

export interface RuntimeKnowledgeAdapterOptions {
  instanceId?: string;
  contextLimit?: number;
  pipeline?: import('@/services/knowledge/knowledge-pipeline').KnowledgePipeline;
}

export type RuntimeKnowledgeIngestMarkdownInput = KnowledgePipelineIngestMarkdownInput;
export type RuntimeKnowledgeSearchResult = KnowledgeSearchResult;
