export interface KnowledgeSearchEngineOptions {
  instanceId?: string;
  index?: import('@/services/knowledge/knowledge-index').KnowledgeIndex;
  chunkEngine?: import('@/services/knowledge/knowledge-chunk-engine').KnowledgeChunkEngine;
}

export interface KnowledgeSearchQuery {
  query: string;
  limit?: number;
}

export interface KnowledgeSearchByTagQuery {
  tag: string;
  limit?: number;
}

export interface KnowledgeSearchByTitleQuery {
  title: string;
  limit?: number;
}

export interface KnowledgeRelatedChunksQuery {
  chunkId: string;
  limit?: number;
}

export interface KnowledgeSimilarChunksQuery {
  chunkId: string;
  limit?: number;
}

export interface SerializedKnowledgeSearchEngineSnapshot {
  instanceId: string;
  indexedEntries: number;
  indexedChunks: number;
  updatedAt: string;
}
