import type {
  RuntimeKnowledgeContextChunk,
  RuntimeKnowledgeContextResult,
  RuntimeKnowledgeSearchResult,
  RuntimeKnowledgeSnapshot,
  RuntimeKnowledgeStatistics,
  SerializedRuntimeKnowledgeContextChunk,
  SerializedRuntimeKnowledgeContextResult,
  SerializedRuntimeKnowledgeSearchResult,
  SerializedRuntimeKnowledgeSnapshot,
  SerializedRuntimeKnowledgeStatistics,
} from '@/services/runtime/runtime-knowledge-types';

export function serializeRuntimeKnowledgeContextChunk(
  chunk: RuntimeKnowledgeContextChunk,
): SerializedRuntimeKnowledgeContextChunk {
  return {
    chunkId: chunk.chunkId,
    documentId: chunk.documentId,
    sourceTitle: chunk.sourceTitle,
    section: chunk.section ?? null,
    content: chunk.content,
    score: chunk.score,
    source: chunk.source,
    tags: [...chunk.tags],
  };
}

export function serializeRuntimeKnowledgeContextResult(
  result: RuntimeKnowledgeContextResult,
): SerializedRuntimeKnowledgeContextResult {
  return {
    query: result.query,
    chunkCount: result.chunkCount,
    chunks: result.chunks.map(serializeRuntimeKnowledgeContextChunk),
  };
}

export function serializeRuntimeKnowledgeSearchResult(
  result: RuntimeKnowledgeSearchResult,
): SerializedRuntimeKnowledgeSearchResult {
  return {
    chunkId: result.chunkId,
    documentId: result.documentId,
    title: result.title,
    section: result.section ?? null,
    text: result.text,
    score: result.score,
    tags: [...result.tags],
    source: result.source,
  };
}

export function serializeRuntimeKnowledgeStatistics(
  statistics: RuntimeKnowledgeStatistics,
): SerializedRuntimeKnowledgeStatistics {
  return {
    documentCount: statistics.documentCount,
    chunkCount: statistics.chunkCount,
    indexEntryCount: statistics.indexEntryCount,
    averageChunkTokens: statistics.averageChunkTokens,
    lastIngestAt: statistics.lastIngestAt ?? null,
    updatedAt: statistics.updatedAt,
  };
}

export function serializeRuntimeKnowledgeSnapshot(input: {
  instanceId: string;
  snapshot: RuntimeKnowledgeSnapshot;
  statistics: RuntimeKnowledgeStatistics;
}): SerializedRuntimeKnowledgeSnapshot {
  return {
    instanceId: input.instanceId,
    lastOperation: input.snapshot.lastOperation,
    lastQuery: input.snapshot.lastQuery ?? null,
    lastChunkId: input.snapshot.lastChunkId ?? null,
    lastChunkCount: input.snapshot.lastChunkCount ?? null,
    statistics: serializeRuntimeKnowledgeStatistics(input.statistics),
    updatedAt: input.snapshot.updatedAt,
  };
}
