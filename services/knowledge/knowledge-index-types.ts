export interface KnowledgeIndexEntry {
  chunkId: string;
  documentId: string;
  title: string;
  section: string | null;
  tags: string[];
  keywords: string[];
  searchWords: string[];
  source: string;
}

export interface KnowledgeIndexDocumentRecord {
  documentId: string;
  title: string;
  tags: string[];
  sections: string[];
  source: string;
}

export interface KnowledgeIndexBuildInput {
  documentId: string;
  title: string | null;
  source: string;
  tags: string[];
  chunks: Array<{
    id: string;
    text: string;
    section: string | null;
  }>;
}

export interface KnowledgeIndexOptions {
  instanceId?: string;
}

export interface KnowledgeIndexSnapshot {
  entryCount: number;
  documentCount: number;
  updatedAt: string;
}

export interface SerializedKnowledgeIndexEntry {
  chunkId: string;
  documentId: string;
  title: string;
  section: string | null;
  tags: string[];
  keywords: string[];
  searchWords: string[];
  source: string;
}

export interface SerializedKnowledgeIndexSnapshot {
  entryCount: number;
  documentCount: number;
  updatedAt: string;
  documents: KnowledgeIndexDocumentRecord[];
  entries: SerializedKnowledgeIndexEntry[];
}

export interface KnowledgeSearchResult {
  chunkId: string;
  documentId: string;
  title: string;
  section: string | null;
  text: string;
  score: number;
  tags: string[];
  source: string;
}
