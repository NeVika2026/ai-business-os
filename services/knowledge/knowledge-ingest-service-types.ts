import type { KnowledgePipelineIngestResult } from '@/services/knowledge/knowledge-pipeline-types';
import type { VaultDocument } from '@/services/knowledge/knowledge-vault-loader-types';

export interface KnowledgeIngestErrorEntry {
  source: string;
  path: string | null;
  message: string;
}

export interface KnowledgeIngestStatistics {
  documents: number;
  chunks: number;
  headings: number;
  links: number;
  tags: number;
  indexSize: number;
  duration: number;
  errors: number;
}

export interface KnowledgeIngestVaultResult {
  vaultPath: string;
  ingestedDocuments: number;
  results: KnowledgePipelineIngestResult[];
  errors: KnowledgeIngestErrorEntry[];
  statistics: KnowledgeIngestStatistics;
}

export interface KnowledgeIngestDocumentsResult {
  ingestedDocuments: number;
  results: KnowledgePipelineIngestResult[];
  errors: KnowledgeIngestErrorEntry[];
  statistics: KnowledgeIngestStatistics;
}

export interface KnowledgeIngestMarkdownResult {
  result: KnowledgePipelineIngestResult | null;
  errors: KnowledgeIngestErrorEntry[];
  statistics: KnowledgeIngestStatistics;
}

export interface KnowledgeIngestReindexResult {
  reindexedDocuments: number;
  results: KnowledgePipelineIngestResult[];
  errors: KnowledgeIngestErrorEntry[];
  statistics: KnowledgeIngestStatistics;
}

export interface KnowledgeIngestServiceSnapshot {
  instanceId: string;
  lastVaultPath: string | null;
  lastOperation: 'ingestVault' | 'ingestDocuments' | 'ingestMarkdown' | 'reindex' | null;
  lastIngestAt: string | null;
  statistics: KnowledgeIngestStatistics;
  updatedAt: string;
}

export interface SerializedKnowledgeIngestErrorEntry {
  source: string;
  path: string | null;
  message: string;
}

export interface SerializedKnowledgeIngestStatistics {
  documents: number;
  chunks: number;
  headings: number;
  links: number;
  tags: number;
  indexSize: number;
  duration: number;
  errors: number;
}

export interface SerializedKnowledgeIngestVaultResult {
  vaultPath: string;
  ingestedDocuments: number;
  results: Array<{
    documentId: string;
    title: string;
    chunkCount: number;
    indexedChunkCount: number;
  }>;
  errors: SerializedKnowledgeIngestErrorEntry[];
  statistics: SerializedKnowledgeIngestStatistics;
}

export interface SerializedKnowledgeIngestDocumentsResult {
  ingestedDocuments: number;
  results: Array<{
    documentId: string;
    title: string;
    chunkCount: number;
    indexedChunkCount: number;
  }>;
  errors: SerializedKnowledgeIngestErrorEntry[];
  statistics: SerializedKnowledgeIngestStatistics;
}

export interface SerializedKnowledgeIngestMarkdownResult {
  result: {
    documentId: string;
    title: string;
    chunkCount: number;
    indexedChunkCount: number;
  } | null;
  errors: SerializedKnowledgeIngestErrorEntry[];
  statistics: SerializedKnowledgeIngestStatistics;
}

export interface SerializedKnowledgeIngestReindexResult {
  reindexedDocuments: number;
  results: Array<{
    documentId: string;
    title: string;
    chunkCount: number;
    indexedChunkCount: number;
  }>;
  errors: SerializedKnowledgeIngestErrorEntry[];
  statistics: SerializedKnowledgeIngestStatistics;
}

export interface SerializedKnowledgeIngestServiceSnapshot {
  instanceId: string;
  lastVaultPath: string | null;
  lastOperation: 'ingestVault' | 'ingestDocuments' | 'ingestMarkdown' | 'reindex' | null;
  lastIngestAt: string | null;
  statistics: SerializedKnowledgeIngestStatistics;
  updatedAt: string;
  pipeline: ReturnType<
    import('@/services/knowledge/knowledge-pipeline').KnowledgePipeline['serialize']
  >;
  vaultLoader: ReturnType<
    import('@/services/knowledge/knowledge-vault-loader').KnowledgeVaultLoader['serialize']
  >;
}

export interface KnowledgeIngestServiceOptions {
  instanceId?: string;
  pipeline?: import('@/services/knowledge/knowledge-pipeline').KnowledgePipeline;
  vaultLoader?: import('@/services/knowledge/knowledge-vault-loader').KnowledgeVaultLoader;
}

export type { VaultDocument };
