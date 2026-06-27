import type { KnowledgePackage } from '@/types/runtime/dto';
import type { ContextBudget } from '@/services/runtime/context/budget';
import type { KnowledgeProviderResult } from '@/services/runtime/context/types';
import { mockScore, rankByScore } from '@/services/runtime/context/ranking';

export function selectKnowledgeChunks(
  knowledge: KnowledgeProviderResult,
  query: string,
  budget: ContextBudget,
): KnowledgePackage['chunks'] {
  const ranked = rankByScore(knowledge.chunks, (chunk) =>
    mockScore(`${query}:${chunk.chunkId}:${chunk.content}`),
  );

  return ranked.slice(0, budget.knowledgeChunks).map((chunk) => ({
    chunkId: chunk.chunkId,
    itemId: chunk.itemId,
    sourceId: chunk.sourceId,
    sourceTitle: chunk.sourceTitle,
    content: chunk.content,
    score: chunk.score,
  }));
}

export function buildKnowledgePackage(
  scope: KnowledgePackage['scope'],
  trace: KnowledgePackage['trace'],
  knowledge: KnowledgeProviderResult,
  query: string,
  budget: ContextBudget,
): KnowledgePackage {
  const chunks = selectKnowledgeChunks(knowledge, query, budget);

  return {
    scope,
    trace,
    query,
    chunks,
    totalChunks: knowledge.chunks.length,
    truncated: chunks.length < knowledge.chunks.length,
    retrievedAt: new Date().toISOString(),
  };
}
