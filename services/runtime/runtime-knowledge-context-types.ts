import type { ContextPackage, KnowledgeChunkRef } from '@/types/runtime/dto';

export const RUNTIME_KNOWLEDGE_CONTEXT_MAX_CHUNKS = 10;
export const RUNTIME_KNOWLEDGE_CONTEXT_MAX_CHARACTERS = 12000;

export interface RuntimeKnowledgeContextBuildInput {
  query: string;
  enabled?: boolean;
}

export interface RuntimeKnowledgeInjectedChunk {
  chunkId: string;
  documentId: string;
  sourceTitle: string;
  section: string | null;
  content: string;
  score: number;
  source: string;
  tags: string[];
}

export interface RuntimeKnowledgeContextBuildResult {
  enabled: boolean;
  query: string;
  chunkCount: number;
  totalCharacters: number;
  truncated: boolean;
  knowledgeFailed: boolean;
  failureMessage: string | null;
  chunks: RuntimeKnowledgeInjectedChunk[];
}

export interface RuntimeKnowledgeContextOptions {
  instanceId?: string;
  enabled?: boolean;
  maxChunks?: number;
  maxCharacters?: number;
  knowledgeAdapter?: import('@/services/runtime/runtime-knowledge-adapter').RuntimeKnowledgeAdapter;
}

export interface RuntimeKnowledgeContextSnapshot {
  lastQuery: string | null;
  lastChunkCount: number | null;
  lastTotalCharacters: number | null;
  lastKnowledgeFailed: boolean | null;
  lastFailureMessage: string | null;
  enabled: boolean;
  updatedAt: string;
}

export interface SerializedRuntimeKnowledgeInjectedChunk {
  chunkId: string;
  documentId: string;
  sourceTitle: string;
  section: string | null;
  content: string;
  score: number;
  source: string;
  tags: string[];
}

export interface SerializedRuntimeKnowledgeContextBuildResult {
  enabled: boolean;
  query: string;
  chunkCount: number;
  totalCharacters: number;
  truncated: boolean;
  knowledgeFailed: boolean;
  failureMessage: string | null;
  chunks: SerializedRuntimeKnowledgeInjectedChunk[];
}

export interface SerializedRuntimeKnowledgeContextSnapshot {
  instanceId: string;
  lastQuery: string | null;
  lastChunkCount: number | null;
  lastTotalCharacters: number | null;
  lastKnowledgeFailed: boolean | null;
  lastFailureMessage: string | null;
  enabled: boolean;
  updatedAt: string;
}

export type RuntimeKnowledgeContextMergeInput = RuntimeKnowledgeContextBuildResult;

export type { ContextPackage, KnowledgeChunkRef };
