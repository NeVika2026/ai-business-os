import type { KnowledgePipelineIngestResult } from '@/services/knowledge/knowledge-pipeline-types';
import type {
  KnowledgeIngestDocumentsResult,
  KnowledgeIngestErrorEntry,
  KnowledgeIngestMarkdownResult,
  KnowledgeIngestReindexResult,
  KnowledgeIngestServiceSnapshot,
  KnowledgeIngestStatistics,
  KnowledgeIngestVaultResult,
  SerializedKnowledgeIngestDocumentsResult,
  SerializedKnowledgeIngestErrorEntry,
  SerializedKnowledgeIngestMarkdownResult,
  SerializedKnowledgeIngestReindexResult,
  SerializedKnowledgeIngestServiceSnapshot,
  SerializedKnowledgeIngestStatistics,
  SerializedKnowledgeIngestVaultResult,
} from '@/services/knowledge/knowledge-ingest-service-types';

function serializeIngestResult(result: KnowledgePipelineIngestResult) {
  return {
    documentId: result.documentId,
    title: result.title,
    chunkCount: result.chunkCount,
    indexedChunkCount: result.indexedChunkCount,
  };
}

export function serializeKnowledgeIngestErrorEntry(
  entry: KnowledgeIngestErrorEntry,
): SerializedKnowledgeIngestErrorEntry {
  return {
    source: entry.source,
    path: entry.path ?? null,
    message: entry.message,
  };
}

export function serializeKnowledgeIngestStatistics(
  statistics: KnowledgeIngestStatistics,
): SerializedKnowledgeIngestStatistics {
  return {
    documents: statistics.documents,
    chunks: statistics.chunks,
    headings: statistics.headings,
    links: statistics.links,
    tags: statistics.tags,
    indexSize: statistics.indexSize,
    duration: statistics.duration,
    errors: statistics.errors,
  };
}

export function serializeKnowledgeIngestVaultResult(
  result: KnowledgeIngestVaultResult,
): SerializedKnowledgeIngestVaultResult {
  return {
    vaultPath: result.vaultPath,
    ingestedDocuments: result.ingestedDocuments,
    results: result.results.map(serializeIngestResult),
    errors: result.errors.map(serializeKnowledgeIngestErrorEntry),
    statistics: serializeKnowledgeIngestStatistics(result.statistics),
  };
}

export function serializeKnowledgeIngestDocumentsResult(
  result: KnowledgeIngestDocumentsResult,
): SerializedKnowledgeIngestDocumentsResult {
  return {
    ingestedDocuments: result.ingestedDocuments,
    results: result.results.map(serializeIngestResult),
    errors: result.errors.map(serializeKnowledgeIngestErrorEntry),
    statistics: serializeKnowledgeIngestStatistics(result.statistics),
  };
}

export function serializeKnowledgeIngestMarkdownResult(
  result: KnowledgeIngestMarkdownResult,
): SerializedKnowledgeIngestMarkdownResult {
  return {
    result: result.result ? serializeIngestResult(result.result) : null,
    errors: result.errors.map(serializeKnowledgeIngestErrorEntry),
    statistics: serializeKnowledgeIngestStatistics(result.statistics),
  };
}

export function serializeKnowledgeIngestReindexResult(
  result: KnowledgeIngestReindexResult,
): SerializedKnowledgeIngestReindexResult {
  return {
    reindexedDocuments: result.reindexedDocuments,
    results: result.results.map(serializeIngestResult),
    errors: result.errors.map(serializeKnowledgeIngestErrorEntry),
    statistics: serializeKnowledgeIngestStatistics(result.statistics),
  };
}

export function serializeKnowledgeIngestServiceSnapshot(input: {
  snapshot: KnowledgeIngestServiceSnapshot;
  pipeline: SerializedKnowledgeIngestServiceSnapshot['pipeline'];
  vaultLoader: SerializedKnowledgeIngestServiceSnapshot['vaultLoader'];
}): SerializedKnowledgeIngestServiceSnapshot {
  return {
    instanceId: input.snapshot.instanceId,
    lastVaultPath: input.snapshot.lastVaultPath ?? null,
    lastOperation: input.snapshot.lastOperation ?? null,
    lastIngestAt: input.snapshot.lastIngestAt ?? null,
    statistics: serializeKnowledgeIngestStatistics(input.snapshot.statistics),
    updatedAt: input.snapshot.updatedAt,
    pipeline: input.pipeline,
    vaultLoader: input.vaultLoader,
  };
}
