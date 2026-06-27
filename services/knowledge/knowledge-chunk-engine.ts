import { createHash } from 'node:crypto';

import { KnowledgeChunkEngineValidationError } from '@/services/knowledge/knowledge-chunk-engine-errors';
import type {
  ChunkKnowledgeDocumentInput,
  KnowledgeChunk,
  KnowledgeChunkEngineOptions,
  SerializedKnowledgeChunk,
  SerializedKnowledgeChunkEngineSnapshot,
} from '@/services/knowledge/knowledge-chunk-engine-types';

const DEFAULT_MIN_TOKENS = 500;
const DEFAULT_MAX_TOKENS = 1000;

function estimateTokenCount(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words * 1.3));
}

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function createChunkId(documentId: string, index: number, text: string): string {
  return createHash('sha256').update(`${documentId}:${index}:${text}`).digest('hex').slice(0, 32);
}

function chunkSectionText(
  documentId: string,
  source: string,
  section: string | null,
  headingLevel: number | null,
  tags: string[],
  text: string,
  minTokens: number,
  maxTokens: number,
  startIndex: number,
): { chunks: KnowledgeChunk[]; nextIndex: number } {
  const sentences = splitIntoSentences(text);
  const chunks: KnowledgeChunk[] = [];
  let buffer = '';
  let bufferTokens = 0;
  let chunkIndex = startIndex;

  const flush = () => {
    const trimmed = buffer.trim();
    if (!trimmed) {
      return;
    }

    const tokenCount = estimateTokenCount(trimmed);
    chunks.push({
      id: createChunkId(documentId, chunkIndex, trimmed),
      documentId,
      text: trimmed,
      metadata: {
        source,
        section,
        headingLevel,
        tags: [...tags],
        tokenCount,
      },
    });
    chunkIndex += 1;
    buffer = '';
    bufferTokens = 0;
  };

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokenCount(sentence);
    if (bufferTokens + sentenceTokens > maxTokens && bufferTokens >= minTokens) {
      flush();
    }

    buffer = buffer ? `${buffer} ${sentence}` : sentence;
    bufferTokens += sentenceTokens;

    if (bufferTokens >= maxTokens) {
      flush();
    }
  }

  flush();

  return {
    chunks,
    nextIndex: chunkIndex,
  };
}

/**
 * Semantic chunk engine targeting roughly 500-1000 tokens per chunk.
 */
export class KnowledgeChunkEngine {
  private readonly chunks = new Map<string, KnowledgeChunk>();
  private readonly documentIds = new Set<string>();
  private updatedAt: string = new Date().toISOString();

  constructor(
    private readonly instanceId: string,
    private readonly minTokens: number,
    private readonly maxTokens: number,
  ) {}

  chunkDocument(input: ChunkKnowledgeDocumentInput): KnowledgeChunk[] {
    if (!input || typeof input !== 'object') {
      throw new KnowledgeChunkEngineValidationError('chunk input must be an object');
    }

    if (!input.documentId?.trim()) {
      throw new KnowledgeChunkEngineValidationError('documentId is required');
    }

    if (!input.source?.trim()) {
      throw new KnowledgeChunkEngineValidationError('source is required');
    }

    if (!Array.isArray(input.sections) || input.sections.length === 0) {
      throw new KnowledgeChunkEngineValidationError('sections must be a non-empty array');
    }

    this.removeDocumentChunks(input.documentId);
    this.documentIds.add(input.documentId);

    const created: KnowledgeChunk[] = [];
    let chunkIndex = 0;

    for (const section of input.sections) {
      const sectionTitle = section.heading ?? input.title ?? null;
      const result = chunkSectionText(
        input.documentId,
        input.source,
        sectionTitle,
        section.level,
        input.tags,
        section.text,
        this.minTokens,
        this.maxTokens,
        chunkIndex,
      );

      created.push(...result.chunks);
      chunkIndex = result.nextIndex;
    }

    for (const chunk of created) {
      this.chunks.set(chunk.id, chunk);
    }

    this.updatedAt = new Date().toISOString();
    return created;
  }

  listChunks(documentId?: string): SerializedKnowledgeChunk[] {
    const values = [...this.chunks.values()].filter((chunk) =>
      documentId ? chunk.documentId === documentId : true,
    );

    return values.map((chunk) => ({
      id: chunk.id,
      documentId: chunk.documentId,
      text: chunk.text,
      metadata: {
        source: chunk.metadata.source,
        section: chunk.metadata.section ?? null,
        headingLevel: chunk.metadata.headingLevel ?? null,
        tags: [...chunk.metadata.tags],
        tokenCount: chunk.metadata.tokenCount,
      },
    }));
  }

  getChunk(id: string): KnowledgeChunk | null {
    return this.chunks.get(id) ?? null;
  }

  getChunks(): KnowledgeChunk[] {
    return [...this.chunks.values()];
  }

  serialize(): SerializedKnowledgeChunkEngineSnapshot {
    return {
      chunkCount: this.chunks.size,
      documentCount: this.documentIds.size,
      updatedAt: this.updatedAt,
      chunks: this.listChunks(),
    };
  }

  reset(): void {
    this.chunks.clear();
    this.documentIds.clear();
    this.updatedAt = new Date().toISOString();
  }

  private removeDocumentChunks(documentId: string): void {
    for (const [id, chunk] of this.chunks.entries()) {
      if (chunk.documentId === documentId) {
        this.chunks.delete(id);
      }
    }
  }
}

export function createKnowledgeChunkEngine(
  options?: KnowledgeChunkEngineOptions,
): KnowledgeChunkEngine {
  const instanceId = options?.instanceId?.trim() || 'default-knowledge-chunk-engine';
  const minTokens = options?.minTokens ?? DEFAULT_MIN_TOKENS;
  const maxTokens = options?.maxTokens ?? DEFAULT_MAX_TOKENS;

  if (minTokens <= 0 || maxTokens <= 0 || minTokens > maxTokens) {
    throw new KnowledgeChunkEngineValidationError('invalid token range configuration');
  }

  return new KnowledgeChunkEngine(instanceId, minTokens, maxTokens);
}

/** Default dev/test singleton. In-memory only. */
export const knowledgeChunkEngine = createKnowledgeChunkEngine();
