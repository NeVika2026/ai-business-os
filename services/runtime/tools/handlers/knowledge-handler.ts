import { createKnowledgeSearchEngine } from '@/services/knowledge/knowledge-search-engine';
import { BaseToolHandler } from '@/services/runtime/tools/handlers/base-handler';
import type { ToolHandlerContext } from '@/services/runtime/tools/tool-types';

export class KnowledgeSearchHandler extends BaseToolHandler {
  async execute(
    args: Record<string, unknown>,
    ctx: ToolHandlerContext,
  ): Promise<Record<string, unknown>> {
    const query = typeof args.query === 'string' ? args.query.trim() : '';
    const limit = typeof args.limit === 'number' && Number.isFinite(args.limit) ? args.limit : 5;

    if (!query) {
      return { chunks: [], count: 0 };
    }

    const engine = createKnowledgeSearchEngine({
      instanceId: `tool-knowledge-${ctx.organizationId}`,
    });
    const results = engine.search({ query, limit });

    return {
      chunks: results.map((chunk) => ({
        chunkId: chunk.chunkId,
        title: chunk.title,
        text: chunk.text,
        score: chunk.score,
        source: chunk.source,
      })),
      count: results.length,
    };
  }
}

export const knowledgeSearchHandler = new KnowledgeSearchHandler();
