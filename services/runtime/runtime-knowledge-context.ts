import {
  createInjectionBudgetItem,
  dedupeInjectionItems,
  selectInjectionBudgetItems,
} from '@/services/runtime/context/injection-budget-selector';
import type { RuntimeKnowledgeAdapter } from '@/services/runtime/runtime-knowledge-adapter';
import { createRuntimeKnowledgeAdapter } from '@/services/runtime/runtime-knowledge-adapter';
import { RuntimeKnowledgeContextValidationError } from '@/services/runtime/runtime-knowledge-context-errors';
import {
  createEmptyRuntimeKnowledgeContextBuildResult,
  serializeRuntimeKnowledgeContextBuildResult,
  serializeRuntimeKnowledgeContextSnapshot,
} from '@/services/runtime/runtime-knowledge-context-serializer';
import type {
  ContextPackage,
  KnowledgeChunkRef,
  RuntimeKnowledgeContextBuildInput,
  RuntimeKnowledgeContextBuildResult,
  RuntimeKnowledgeContextOptions,
  RuntimeKnowledgeContextSnapshot,
  RuntimeKnowledgeInjectedChunk,
  SerializedRuntimeKnowledgeContextBuildResult,
  SerializedRuntimeKnowledgeContextSnapshot,
} from '@/services/runtime/runtime-knowledge-context-types';
import {
  RUNTIME_KNOWLEDGE_CONTEXT_MAX_CHARACTERS,
  RUNTIME_KNOWLEDGE_CONTEXT_MAX_CHUNKS,
} from '@/services/runtime/runtime-knowledge-context-types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function dedupeInjectedChunks(
  chunks: RuntimeKnowledgeInjectedChunk[],
): RuntimeKnowledgeInjectedChunk[] {
  const items = chunks.map((chunk) =>
    createInjectionBudgetItem({
      kind: 'knowledge',
      id: chunk.chunkId,
      fallbackKey: chunk.content,
      score: chunk.score,
      characters: chunk.content.length,
      value: chunk,
    }),
  );

  return dedupeInjectionItems(items).map((item) => item.value);
}

function applyInjectionLimits(
  chunks: RuntimeKnowledgeInjectedChunk[],
  maxChunks: number,
  maxCharacters: number,
): { chunks: RuntimeKnowledgeInjectedChunk[]; truncated: boolean; totalCharacters: number } {
  const budgetItems = chunks.map((chunk) =>
    createInjectionBudgetItem({
      kind: 'knowledge',
      id: chunk.chunkId,
      fallbackKey: chunk.content,
      score: chunk.score,
      characters: chunk.content.length,
      value: chunk,
    }),
  );

  const selected = selectInjectionBudgetItems(budgetItems, {
    maxKnowledgeChunks: maxChunks,
    maxMemoryFacts: 0,
    maxMemoryEntities: 0,
    maxMemoryRelations: 0,
    maxCharacters,
  });

  return {
    chunks: selected.knowledge as RuntimeKnowledgeInjectedChunk[],
    truncated: selected.truncated,
    totalCharacters: selected.totalCharacters,
  };
}

function toKnowledgeChunkRef(chunk: RuntimeKnowledgeInjectedChunk): KnowledgeChunkRef {
  return {
    chunkId: chunk.chunkId,
    itemId: chunk.documentId,
    sourceId: chunk.documentId,
    sourceTitle: chunk.sourceTitle,
    content: chunk.content,
    score: chunk.score,
  };
}

function readExistingKnowledgeChunks(payload: Record<string, unknown>): KnowledgeChunkRef[] {
  const raw = payload.knowledgeChunks;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter(
      (entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object',
    )
    .map((entry) => ({
      chunkId: typeof entry.chunkId === 'string' ? entry.chunkId : '',
      itemId: typeof entry.itemId === 'string' ? entry.itemId : '',
      sourceId: typeof entry.sourceId === 'string' ? entry.sourceId : '',
      sourceTitle: typeof entry.sourceTitle === 'string' ? entry.sourceTitle : '',
      content: typeof entry.content === 'string' ? entry.content : '',
      score: typeof entry.score === 'number' ? entry.score : 0,
    }))
    .filter((entry) => entry.chunkId.length > 0);
}

/**
 * Runtime knowledge context injection layer over RuntimeKnowledgeAdapter.
 */
export class RuntimeKnowledgeContext {
  private enabled: boolean;
  private snapshot: RuntimeKnowledgeContextSnapshot = {
    lastQuery: null,
    lastChunkCount: null,
    lastTotalCharacters: null,
    lastKnowledgeFailed: null,
    lastFailureMessage: null,
    enabled: false,
    updatedAt: new Date().toISOString(),
  };

  constructor(
    private readonly instanceId: string,
    private readonly knowledgeAdapter: RuntimeKnowledgeAdapter,
    enabled: boolean,
    private readonly maxChunks: number,
    private readonly maxCharacters: number,
  ) {
    this.enabled = enabled;
    this.snapshot.enabled = enabled;
  }

  build(input: RuntimeKnowledgeContextBuildInput): RuntimeKnowledgeContextBuildResult {
    if (!input || typeof input !== 'object') {
      throw new RuntimeKnowledgeContextValidationError('build input must be an object');
    }

    const query = input.query?.trim() ?? '';
    const enabled = input.enabled ?? this.enabled;

    if (!enabled) {
      const empty = createEmptyRuntimeKnowledgeContextBuildResult(query, false);
      this.storeSnapshot(query, empty);
      return empty;
    }

    if (!isNonEmptyString(query)) {
      const empty = createEmptyRuntimeKnowledgeContextBuildResult(query, true);
      this.storeSnapshot(query, empty);
      return empty;
    }

    try {
      const searchResults = this.knowledgeAdapter.search({
        query,
        limit: this.maxChunks,
      });

      const injected = dedupeInjectedChunks(
        searchResults.map((result) => ({
          chunkId: result.chunkId,
          documentId: result.documentId,
          sourceTitle: result.title,
          section: result.section,
          content: result.text,
          score: result.score,
          source: result.source,
          tags: [...result.tags],
        })),
      );

      const limited = applyInjectionLimits(injected, this.maxChunks, this.maxCharacters);
      const result: RuntimeKnowledgeContextBuildResult = {
        enabled: true,
        query,
        chunkCount: limited.chunks.length,
        totalCharacters: limited.totalCharacters,
        truncated: limited.truncated,
        knowledgeFailed: false,
        failureMessage: null,
        chunks: limited.chunks,
      };

      this.storeSnapshot(query, result);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Knowledge search failed';
      const failed: RuntimeKnowledgeContextBuildResult = {
        enabled: true,
        query,
        chunkCount: 0,
        totalCharacters: 0,
        truncated: false,
        knowledgeFailed: true,
        failureMessage: message,
        chunks: [],
      };
      this.storeSnapshot(query, failed);
      return failed;
    }
  }

  mergeKnowledge(
    context: ContextPackage,
    injection: RuntimeKnowledgeContextBuildResult,
  ): ContextPackage {
    if (!injection.enabled || injection.chunks.length === 0) {
      return context;
    }

    const existing = readExistingKnowledgeChunks(context.userIntent.payload);
    const mergedMap = new Map<string, KnowledgeChunkRef>();

    for (const chunk of existing) {
      mergedMap.set(chunk.chunkId, chunk);
    }

    for (const chunk of injection.chunks.map(toKnowledgeChunkRef)) {
      mergedMap.set(chunk.chunkId, chunk);
    }

    const merged = [...mergedMap.values()].sort(
      (left, right) => (right.score ?? 0) - (left.score ?? 0),
    );

    return {
      ...context,
      userIntent: {
        ...context.userIntent,
        payload: {
          ...context.userIntent.payload,
          knowledgeChunks: merged,
        },
      },
    };
  }

  serialize(): SerializedRuntimeKnowledgeContextSnapshot {
    return serializeRuntimeKnowledgeContextSnapshot({
      instanceId: this.instanceId,
      snapshot: this.snapshot,
    });
  }

  serializeBuildResult(
    result: RuntimeKnowledgeContextBuildResult,
  ): SerializedRuntimeKnowledgeContextBuildResult {
    return serializeRuntimeKnowledgeContextBuildResult(result);
  }

  reset(): void {
    this.snapshot = {
      lastQuery: null,
      lastChunkCount: null,
      lastTotalCharacters: null,
      lastKnowledgeFailed: null,
      lastFailureMessage: null,
      enabled: this.enabled,
      updatedAt: new Date().toISOString(),
    };
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.snapshot.enabled = enabled;
    this.snapshot.updatedAt = new Date().toISOString();
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  private storeSnapshot(query: string, result: RuntimeKnowledgeContextBuildResult): void {
    this.snapshot = {
      lastQuery: query || null,
      lastChunkCount: result.chunkCount,
      lastTotalCharacters: result.totalCharacters,
      lastKnowledgeFailed: result.knowledgeFailed,
      lastFailureMessage: result.failureMessage,
      enabled: result.enabled,
      updatedAt: new Date().toISOString(),
    };
  }
}

export function createRuntimeKnowledgeContext(
  options?: RuntimeKnowledgeContextOptions,
): RuntimeKnowledgeContext {
  const instanceId = options?.instanceId?.trim() || 'default-runtime-knowledge-context';
  const enabled = options?.enabled ?? false;
  const maxChunks = options?.maxChunks ?? RUNTIME_KNOWLEDGE_CONTEXT_MAX_CHUNKS;
  const maxCharacters = options?.maxCharacters ?? RUNTIME_KNOWLEDGE_CONTEXT_MAX_CHARACTERS;
  const knowledgeAdapter =
    options?.knowledgeAdapter ??
    createRuntimeKnowledgeAdapter({ instanceId: `${instanceId}-adapter` });

  if (maxChunks <= 0) {
    throw new RuntimeKnowledgeContextValidationError('maxChunks must be greater than 0');
  }

  if (maxCharacters <= 0) {
    throw new RuntimeKnowledgeContextValidationError('maxCharacters must be greater than 0');
  }

  return new RuntimeKnowledgeContext(
    instanceId,
    knowledgeAdapter,
    enabled,
    maxChunks,
    maxCharacters,
  );
}

/** Default dev/test singleton. In-memory only. */
export const runtimeKnowledgeContext = createRuntimeKnowledgeContext();
