import { createKnowledgePipeline } from '@/services/knowledge/knowledge-pipeline';
import type { KnowledgePipelineIngestResult } from '@/services/knowledge/knowledge-pipeline-types';
import {
  RuntimeKnowledgeOperationError,
  RuntimeKnowledgeValidationError,
} from '@/services/runtime/runtime-knowledge-errors';
import {
  serializeRuntimeKnowledgeContextResult,
  serializeRuntimeKnowledgeSearchResult,
  serializeRuntimeKnowledgeSnapshot,
} from '@/services/runtime/runtime-knowledge-serializer';
import type {
  RuntimeKnowledgeAdapterOptions,
  RuntimeKnowledgeContextQuery,
  RuntimeKnowledgeContextResult,
  RuntimeKnowledgeIngestMarkdownInput,
  RuntimeKnowledgeOperation,
  RuntimeKnowledgeSearchQuery,
  RuntimeKnowledgeSnapshot,
  SerializedRuntimeKnowledgeContextResult,
  SerializedRuntimeKnowledgeSearchResult,
  SerializedRuntimeKnowledgeSnapshot,
} from '@/services/runtime/runtime-knowledge-types';

const DEFAULT_CONTEXT_LIMIT = 5;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeLimit(limit: number | undefined, fallback: number): number {
  if (!limit || !Number.isFinite(limit) || limit <= 0) {
    return fallback;
  }

  return Math.floor(limit);
}

/**
 * Runtime-facing knowledge adapter. Delegates to KnowledgePipeline only.
 */
export class RuntimeKnowledgeAdapter {
  private snapshot: RuntimeKnowledgeSnapshot = {
    lastOperation: null,
    lastQuery: null,
    lastChunkId: null,
    lastChunkCount: null,
    updatedAt: new Date().toISOString(),
  };

  constructor(
    private readonly instanceId: string,
    private readonly pipeline: ReturnType<typeof createKnowledgePipeline>,
    private readonly contextLimit: number,
  ) {}

  async ingestDirectory(directoryPath: string): Promise<KnowledgePipelineIngestResult[]> {
    if (!isNonEmptyString(directoryPath)) {
      throw new RuntimeKnowledgeValidationError('directoryPath is required');
    }

    try {
      const results = await this.pipeline.ingestDirectory(directoryPath);
      this.touch('ingestDirectory', null, null, results.length);
      return results;
    } catch (error) {
      throw toOperationError(error, 'Knowledge directory ingest failed');
    }
  }

  ingestMarkdown(
    markdown: string | RuntimeKnowledgeIngestMarkdownInput,
  ): KnowledgePipelineIngestResult {
    try {
      const result = this.pipeline.ingestMarkdown(markdown);
      this.touch('ingestMarkdown', null, null, result.chunkCount);
      return result;
    } catch (error) {
      throw toOperationError(error, 'Knowledge markdown ingest failed');
    }
  }

  search(input: RuntimeKnowledgeSearchQuery): SerializedRuntimeKnowledgeSearchResult[] {
    if (!input || typeof input !== 'object') {
      throw new RuntimeKnowledgeValidationError('search input must be an object');
    }

    if (!isNonEmptyString(input.query)) {
      throw new RuntimeKnowledgeValidationError('query is required');
    }

    try {
      const limit = normalizeLimit(input.limit, 10);
      const results = this.pipeline
        .search(input.query, limit)
        .map(serializeRuntimeKnowledgeSearchResult);
      this.touch('search', input.query, null, results.length);
      return results;
    } catch (error) {
      throw toOperationError(error, 'Knowledge search failed');
    }
  }

  context(input: RuntimeKnowledgeContextQuery): SerializedRuntimeKnowledgeContextResult {
    if (!input || typeof input !== 'object') {
      throw new RuntimeKnowledgeValidationError('context input must be an object');
    }

    if (!isNonEmptyString(input.query)) {
      throw new RuntimeKnowledgeValidationError('query is required');
    }

    try {
      const limit = normalizeLimit(input.limit, this.contextLimit);
      const results = this.pipeline.search(input.query, limit);
      const contextResult: RuntimeKnowledgeContextResult = {
        query: input.query,
        chunkCount: results.length,
        chunks: results.map((result) => ({
          chunkId: result.chunkId,
          documentId: result.documentId,
          sourceTitle: result.title,
          section: result.section,
          content: result.text,
          score: result.score,
          source: result.source,
          tags: [...result.tags],
        })),
      };

      this.touch('context', input.query, null, contextResult.chunkCount);
      return serializeRuntimeKnowledgeContextResult(contextResult);
    } catch (error) {
      throw toOperationError(error, 'Knowledge context retrieval failed');
    }
  }

  related(chunkId: string, limit?: number): SerializedRuntimeKnowledgeSearchResult[] {
    if (!isNonEmptyString(chunkId)) {
      throw new RuntimeKnowledgeValidationError('chunkId is required');
    }

    try {
      const results = this.pipeline
        .related(chunkId, normalizeLimit(limit, 5))
        .map(serializeRuntimeKnowledgeSearchResult);
      this.touch('related', null, chunkId, results.length);
      return results;
    } catch (error) {
      throw toOperationError(error, 'Knowledge related lookup failed');
    }
  }

  similar(chunkId: string, limit?: number): SerializedRuntimeKnowledgeSearchResult[] {
    if (!isNonEmptyString(chunkId)) {
      throw new RuntimeKnowledgeValidationError('chunkId is required');
    }

    try {
      const results = this.pipeline
        .similar(chunkId, normalizeLimit(limit, 5))
        .map(serializeRuntimeKnowledgeSearchResult);
      this.touch('similar', null, chunkId, results.length);
      return results;
    } catch (error) {
      throw toOperationError(error, 'Knowledge similar lookup failed');
    }
  }

  statistics() {
    return this.pipeline.statistics();
  }

  serialize(): SerializedRuntimeKnowledgeSnapshot {
    return serializeRuntimeKnowledgeSnapshot({
      instanceId: this.instanceId,
      snapshot: this.snapshot,
      statistics: this.pipeline.statistics(),
    });
  }

  reset(): void {
    this.pipeline.reset();
    this.snapshot = {
      lastOperation: null,
      lastQuery: null,
      lastChunkId: null,
      lastChunkCount: null,
      updatedAt: new Date().toISOString(),
    };
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  private touch(
    operation: RuntimeKnowledgeOperation,
    query: string | null,
    chunkId: string | null,
    chunkCount: number | null,
  ): void {
    this.snapshot = {
      lastOperation: operation,
      lastQuery: query,
      lastChunkId: chunkId,
      lastChunkCount: chunkCount,
      updatedAt: new Date().toISOString(),
    };
  }
}

function toOperationError(error: unknown, fallback: string): RuntimeKnowledgeOperationError {
  if (
    error instanceof RuntimeKnowledgeValidationError ||
    error instanceof RuntimeKnowledgeOperationError
  ) {
    return error;
  }

  const message = error instanceof Error ? error.message : fallback;
  return new RuntimeKnowledgeOperationError(message);
}

export function createRuntimeKnowledgeAdapter(
  options?: RuntimeKnowledgeAdapterOptions,
): RuntimeKnowledgeAdapter {
  const instanceId = options?.instanceId?.trim() || 'default-runtime-knowledge-adapter';
  const contextLimit = options?.contextLimit ?? DEFAULT_CONTEXT_LIMIT;
  const pipeline =
    options?.pipeline ?? createKnowledgePipeline({ instanceId: `${instanceId}-pipeline` });

  if (contextLimit <= 0) {
    throw new RuntimeKnowledgeValidationError('contextLimit must be greater than 0');
  }

  return new RuntimeKnowledgeAdapter(instanceId, pipeline, contextLimit);
}

/** Default dev/test singleton. In-memory only. */
export const runtimeKnowledgeAdapter = createRuntimeKnowledgeAdapter();
