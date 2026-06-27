import type { KnowledgeChunkEngine } from '@/services/knowledge/knowledge-chunk-engine';
import { createKnowledgeChunkEngine } from '@/services/knowledge/knowledge-chunk-engine';
import type { KnowledgeIndex } from '@/services/knowledge/knowledge-index';
import { createKnowledgeIndex } from '@/services/knowledge/knowledge-index';
import {
  KnowledgeSearchEngineNotFoundError,
  KnowledgeSearchEngineValidationError,
} from '@/services/knowledge/knowledge-search-engine-errors';
import type {
  KnowledgeRelatedChunksQuery,
  KnowledgeSearchByTagQuery,
  KnowledgeSearchByTitleQuery,
  KnowledgeSearchEngineOptions,
  KnowledgeSearchQuery,
  KnowledgeSimilarChunksQuery,
  SerializedKnowledgeSearchEngineSnapshot,
} from '@/services/knowledge/knowledge-search-engine-types';
import type { KnowledgeSearchResult } from '@/services/knowledge/knowledge-index-types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeLimit(limit: number | undefined, fallback = 10): number {
  if (!limit || !Number.isFinite(limit) || limit <= 0) {
    return fallback;
  }

  return Math.floor(limit);
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function toSearchResult(
  entry: {
    chunkId: string;
    documentId: string;
    title: string;
    section: string | null;
    tags: string[];
    source: string;
    score: number;
  },
  text: string,
): KnowledgeSearchResult {
  return {
    chunkId: entry.chunkId,
    documentId: entry.documentId,
    title: entry.title,
    section: entry.section,
    text,
    score: entry.score,
    tags: [...entry.tags],
    source: entry.source,
  };
}

/**
 * In-memory knowledge search engine over indexed chunks.
 */
export class KnowledgeSearchEngine {
  private updatedAt: string = new Date().toISOString();

  constructor(
    private readonly instanceId: string,
    private readonly index: KnowledgeIndex,
    private readonly chunkEngine: KnowledgeChunkEngine,
  ) {}

  search(input: KnowledgeSearchQuery): KnowledgeSearchResult[] {
    if (!input || typeof input !== 'object') {
      throw new KnowledgeSearchEngineValidationError('search input must be an object');
    }

    if (!isNonEmptyString(input.query)) {
      throw new KnowledgeSearchEngineValidationError('query is required');
    }

    const limit = normalizeLimit(input.limit);
    const matches = this.index.findBySearchWords(input.query).slice(0, limit);

    return matches
      .map((entry) => {
        const chunk = this.chunkEngine.getChunk(entry.chunkId);
        if (!chunk) {
          return null;
        }

        return toSearchResult(entry, chunk.text);
      })
      .filter((entry): entry is KnowledgeSearchResult => entry !== null);
  }

  searchByTag(input: KnowledgeSearchByTagQuery): KnowledgeSearchResult[] {
    if (!input || typeof input !== 'object') {
      throw new KnowledgeSearchEngineValidationError('searchByTag input must be an object');
    }

    if (!isNonEmptyString(input.tag)) {
      throw new KnowledgeSearchEngineValidationError('tag is required');
    }

    const limit = normalizeLimit(input.limit);
    const matches = this.index.findByTag(input.tag).slice(0, limit);

    return matches
      .map((entry, index) => {
        const chunk = this.chunkEngine.getChunk(entry.chunkId);
        if (!chunk) {
          return null;
        }

        return toSearchResult({ ...entry, score: matches.length - index }, chunk.text);
      })
      .filter((entry): entry is KnowledgeSearchResult => entry !== null);
  }

  searchByTitle(input: KnowledgeSearchByTitleQuery): KnowledgeSearchResult[] {
    if (!input || typeof input !== 'object') {
      throw new KnowledgeSearchEngineValidationError('searchByTitle input must be an object');
    }

    if (!isNonEmptyString(input.title)) {
      throw new KnowledgeSearchEngineValidationError('title is required');
    }

    const limit = normalizeLimit(input.limit);
    const matches = this.index.findByTitle(input.title).slice(0, limit);

    return matches
      .map((entry, index) => {
        const chunk = this.chunkEngine.getChunk(entry.chunkId);
        if (!chunk) {
          return null;
        }

        return toSearchResult({ ...entry, score: matches.length - index }, chunk.text);
      })
      .filter((entry): entry is KnowledgeSearchResult => entry !== null);
  }

  relatedChunks(input: KnowledgeRelatedChunksQuery): KnowledgeSearchResult[] {
    if (!input || typeof input !== 'object') {
      throw new KnowledgeSearchEngineValidationError('relatedChunks input must be an object');
    }

    if (!isNonEmptyString(input.chunkId)) {
      throw new KnowledgeSearchEngineValidationError('chunkId is required');
    }

    const sourceEntry = this.index.getEntry(input.chunkId);
    const sourceChunk = this.chunkEngine.getChunk(input.chunkId);

    if (!sourceEntry || !sourceChunk) {
      throw new KnowledgeSearchEngineNotFoundError(`chunk not found: ${input.chunkId}`);
    }

    const limit = normalizeLimit(input.limit);
    const tagQuery = sourceEntry.tags[0] ?? sourceEntry.section ?? sourceEntry.title;
    const candidates = this.index
      .findBySearchWords(`${tagQuery} ${sourceEntry.section ?? ''} ${sourceEntry.title}`)
      .filter((entry) => entry.chunkId !== input.chunkId)
      .slice(0, limit);

    return candidates
      .map((entry) => {
        const chunk = this.chunkEngine.getChunk(entry.chunkId);
        if (!chunk) {
          return null;
        }

        return toSearchResult(entry, chunk.text);
      })
      .filter((entry): entry is KnowledgeSearchResult => entry !== null);
  }

  similarChunks(input: KnowledgeSimilarChunksQuery): KnowledgeSearchResult[] {
    if (!input || typeof input !== 'object') {
      throw new KnowledgeSearchEngineValidationError('similarChunks input must be an object');
    }

    if (!isNonEmptyString(input.chunkId)) {
      throw new KnowledgeSearchEngineValidationError('chunkId is required');
    }

    const sourceEntry = this.index.getEntry(input.chunkId);
    const sourceChunk = this.chunkEngine.getChunk(input.chunkId);

    if (!sourceEntry || !sourceChunk) {
      throw new KnowledgeSearchEngineNotFoundError(`chunk not found: ${input.chunkId}`);
    }

    const limit = normalizeLimit(input.limit);
    const sourceTerms = new Set([
      ...tokenize(sourceChunk.text),
      ...sourceEntry.keywords.map((keyword) => keyword.toLowerCase()),
    ]);

    const scored = this.index
      .getEntries()
      .filter((entry) => entry.chunkId !== input.chunkId)
      .map((entry) => {
        const chunk = this.chunkEngine.getChunk(entry.chunkId);
        if (!chunk) {
          return null;
        }

        const terms = new Set([
          ...tokenize(chunk.text),
          ...entry.keywords.map((keyword) => keyword.toLowerCase()),
        ]);

        let overlap = 0;
        for (const term of sourceTerms) {
          if (terms.has(term)) {
            overlap += 1;
          }
        }

        if (entry.documentId === sourceEntry.documentId) {
          overlap += 1;
        }

        if (entry.section && entry.section === sourceEntry.section) {
          overlap += 2;
        }

        return overlap > 0 ? toSearchResult({ ...entry, score: overlap }, chunk.text) : null;
      })
      .filter((entry): entry is KnowledgeSearchResult => entry !== null)
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);

    return scored;
  }

  serialize(): SerializedKnowledgeSearchEngineSnapshot {
    return {
      instanceId: this.instanceId,
      indexedEntries: this.index.serialize().entryCount,
      indexedChunks: this.chunkEngine.serialize().chunkCount,
      updatedAt: this.updatedAt,
    };
  }

  reset(): void {
    this.index.reset();
    this.chunkEngine.reset();
    this.updatedAt = new Date().toISOString();
  }

  getIndex(): KnowledgeIndex {
    return this.index;
  }

  getChunkEngine(): KnowledgeChunkEngine {
    return this.chunkEngine;
  }
}

export function createKnowledgeSearchEngine(
  options?: KnowledgeSearchEngineOptions,
): KnowledgeSearchEngine {
  const instanceId = options?.instanceId?.trim() || 'default-knowledge-search-engine';
  return new KnowledgeSearchEngine(
    instanceId,
    options?.index ?? createKnowledgeIndex(),
    options?.chunkEngine ?? createKnowledgeChunkEngine(),
  );
}

/** Default dev/test singleton. In-memory only. */
export const knowledgeSearchEngine = createKnowledgeSearchEngine();
