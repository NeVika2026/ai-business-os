import type {
  KnowledgePipelineSnapshot,
  KnowledgePipelineStatistics,
  SerializedKnowledgePipelineSnapshot,
  SerializedKnowledgePipelineStatistics,
} from '@/services/knowledge/knowledge-pipeline-types';

export function serializeKnowledgePipelineStatistics(
  statistics: KnowledgePipelineStatistics,
): SerializedKnowledgePipelineStatistics {
  return {
    documentCount: statistics.documentCount,
    chunkCount: statistics.chunkCount,
    indexEntryCount: statistics.indexEntryCount,
    averageChunkTokens: statistics.averageChunkTokens,
    lastIngestAt: statistics.lastIngestAt ?? null,
    updatedAt: statistics.updatedAt,
  };
}

export function serializeKnowledgePipelineSnapshot(input: {
  snapshot: KnowledgePipelineSnapshot;
  importer: SerializedKnowledgePipelineSnapshot['importer'];
  chunks: SerializedKnowledgePipelineSnapshot['chunks'];
  index: SerializedKnowledgePipelineSnapshot['index'];
  search: SerializedKnowledgePipelineSnapshot['search'];
}): SerializedKnowledgePipelineSnapshot {
  return {
    instanceId: input.snapshot.instanceId,
    statistics: serializeKnowledgePipelineStatistics(input.snapshot.statistics),
    importer: input.importer,
    chunks: input.chunks,
    index: input.index,
    search: input.search,
    updatedAt: input.snapshot.updatedAt,
  };
}

export function createEmptyKnowledgePipelineStatistics(): KnowledgePipelineStatistics {
  return {
    documentCount: 0,
    chunkCount: 0,
    indexEntryCount: 0,
    averageChunkTokens: 0,
    lastIngestAt: null,
    updatedAt: new Date().toISOString(),
  };
}
