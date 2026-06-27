import type { UUID } from '@/types/runtime/dto';
import type { KnowledgeProviderResult } from '@/services/runtime/context/types';

/**
 * Legacy context provider stub. Knowledge injection is handled by
 * RuntimeKnowledgeContext via runtime-knowledge-context.ts.
 */
export function fetchKnowledge(organizationId: UUID, query: string): KnowledgeProviderResult {
  void organizationId;
  void query;

  return {
    items: [],
    chunks: [],
  };
}
