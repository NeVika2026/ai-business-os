export interface KnowledgeChunkMetadata {
  source: string;
  section: string | null;
  headingLevel: number | null;
  tags: string[];
  tokenCount: number;
}

export interface KnowledgeChunk {
  id: string;
  documentId: string;
  text: string;
  metadata: KnowledgeChunkMetadata;
}

export interface KnowledgeChunkEngineOptions {
  instanceId?: string;
  minTokens?: number;
  maxTokens?: number;
}

export interface ChunkKnowledgeDocumentInput {
  documentId: string;
  source: string;
  title: string | null;
  tags: string[];
  sections: Array<{
    heading: string | null;
    level: number | null;
    text: string;
  }>;
}

export interface SerializedKnowledgeChunk {
  id: string;
  documentId: string;
  text: string;
  metadata: {
    source: string;
    section: string | null;
    headingLevel: number | null;
    tags: string[];
    tokenCount: number;
  };
}

export interface KnowledgeChunkEngineSnapshot {
  chunkCount: number;
  documentCount: number;
  updatedAt: string;
}

export interface SerializedKnowledgeChunkEngineSnapshot {
  chunkCount: number;
  documentCount: number;
  updatedAt: string;
  chunks: SerializedKnowledgeChunk[];
}
