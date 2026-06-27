import type {
  RuntimeKnowledgeContextBuildResult,
  RuntimeKnowledgeContextSnapshot,
  RuntimeKnowledgeInjectedChunk,
  SerializedRuntimeKnowledgeContextBuildResult,
  SerializedRuntimeKnowledgeContextSnapshot,
  SerializedRuntimeKnowledgeInjectedChunk,
} from '@/services/runtime/runtime-knowledge-context-types';

export function serializeRuntimeKnowledgeInjectedChunk(
  chunk: RuntimeKnowledgeInjectedChunk,
): SerializedRuntimeKnowledgeInjectedChunk {
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

export function serializeRuntimeKnowledgeContextBuildResult(
  result: RuntimeKnowledgeContextBuildResult,
): SerializedRuntimeKnowledgeContextBuildResult {
  return {
    enabled: result.enabled,
    query: result.query,
    chunkCount: result.chunkCount,
    totalCharacters: result.totalCharacters,
    truncated: result.truncated,
    knowledgeFailed: result.knowledgeFailed,
    failureMessage: result.failureMessage ?? null,
    chunks: result.chunks.map(serializeRuntimeKnowledgeInjectedChunk),
  };
}

export function serializeRuntimeKnowledgeContextSnapshot(input: {
  instanceId: string;
  snapshot: RuntimeKnowledgeContextSnapshot;
}): SerializedRuntimeKnowledgeContextSnapshot {
  return {
    instanceId: input.instanceId,
    lastQuery: input.snapshot.lastQuery ?? null,
    lastChunkCount: input.snapshot.lastChunkCount ?? null,
    lastTotalCharacters: input.snapshot.lastTotalCharacters ?? null,
    lastKnowledgeFailed: input.snapshot.lastKnowledgeFailed ?? null,
    lastFailureMessage: input.snapshot.lastFailureMessage ?? null,
    enabled: input.snapshot.enabled,
    updatedAt: input.snapshot.updatedAt,
  };
}

export function createEmptyRuntimeKnowledgeContextBuildResult(
  query: string,
  enabled: boolean,
): RuntimeKnowledgeContextBuildResult {
  return {
    enabled,
    query,
    chunkCount: 0,
    totalCharacters: 0,
    truncated: false,
    knowledgeFailed: false,
    failureMessage: null,
    chunks: [],
  };
}
