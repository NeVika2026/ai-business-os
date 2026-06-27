import { KnowledgeIndexValidationError } from '@/services/knowledge/knowledge-index-errors';
import type {
  KnowledgeIndexBuildInput,
  KnowledgeIndexDocumentRecord,
  KnowledgeIndexEntry,
  KnowledgeIndexOptions,
  SerializedKnowledgeIndexEntry,
  SerializedKnowledgeIndexSnapshot,
} from '@/services/knowledge/knowledge-index-types';

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'to',
  'with',
]);

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function uniqueTokens(values: string[]): string[] {
  return [...new Set(values)];
}

function extractKeywords(text: string, title: string | null, tags: string[]): string[] {
  const tokens = tokenize(`${title ?? ''} ${text}`);
  const tagTokens = tags.flatMap((tag) => tokenize(tag.replace(/[-_/]/g, ' ')));
  return uniqueTokens([...tokens.slice(0, 12), ...tagTokens]).slice(0, 24);
}

/**
 * In-memory inverted index for knowledge chunks.
 */
export class KnowledgeIndex {
  private readonly entries = new Map<string, KnowledgeIndexEntry>();
  private readonly documents = new Map<string, KnowledgeIndexDocumentRecord>();
  private updatedAt: string = new Date().toISOString();

  constructor(private readonly instanceId: string) {}

  build(input: KnowledgeIndexBuildInput): KnowledgeIndexEntry[] {
    if (!input || typeof input !== 'object') {
      throw new KnowledgeIndexValidationError('index build input must be an object');
    }

    if (!input.documentId?.trim()) {
      throw new KnowledgeIndexValidationError('documentId is required');
    }

    if (!Array.isArray(input.chunks)) {
      throw new KnowledgeIndexValidationError('chunks must be an array');
    }

    this.removeDocument(input.documentId);

    const title = input.title?.trim() || 'Untitled';
    const sections = uniqueTokens(
      input.chunks
        .map((chunk) => chunk.section)
        .filter((section): section is string => Boolean(section)),
    );

    this.documents.set(input.documentId, {
      documentId: input.documentId,
      title,
      tags: [...input.tags],
      sections,
      source: input.source,
    });

    const created: KnowledgeIndexEntry[] = [];

    for (const chunk of input.chunks) {
      const searchWords = uniqueTokens([
        ...tokenize(title),
        ...tokenize(chunk.section ?? ''),
        ...tokenize(chunk.text),
        ...input.tags.flatMap((tag) => tokenize(tag)),
      ]);

      const entry: KnowledgeIndexEntry = {
        chunkId: chunk.id,
        documentId: input.documentId,
        title,
        section: chunk.section,
        tags: [...input.tags],
        keywords: extractKeywords(chunk.text, title, input.tags),
        searchWords,
        source: input.source,
      };

      this.entries.set(entry.chunkId, entry);
      created.push(entry);
    }

    this.updatedAt = new Date().toISOString();
    return created;
  }

  getEntry(chunkId: string): KnowledgeIndexEntry | null {
    return this.entries.get(chunkId) ?? null;
  }

  getEntries(): KnowledgeIndexEntry[] {
    return [...this.entries.values()];
  }

  getDocuments(): KnowledgeIndexDocumentRecord[] {
    return [...this.documents.values()];
  }

  findByTitle(query: string): KnowledgeIndexEntry[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return [];
    }

    return this.getEntries().filter((entry) => entry.title.toLowerCase().includes(normalized));
  }

  findByTag(tag: string): KnowledgeIndexEntry[] {
    const normalized = tag.trim().toLowerCase().replace(/^#/, '');
    if (!normalized) {
      return [];
    }

    return this.getEntries().filter((entry) =>
      entry.tags.some((value) => value.toLowerCase() === normalized),
    );
  }

  findBySearchWords(query: string): Array<KnowledgeIndexEntry & { score: number }> {
    const terms = tokenize(query);
    if (terms.length === 0) {
      return [];
    }

    return this.getEntries()
      .map((entry) => {
        const wordSet = new Set(entry.searchWords);
        const keywordSet = new Set(entry.keywords);
        let score = 0;

        for (const term of terms) {
          if (entry.title.toLowerCase().includes(term)) {
            score += 4;
          }
          if (entry.section?.toLowerCase().includes(term)) {
            score += 3;
          }
          if (wordSet.has(term)) {
            score += 2;
          }
          if (keywordSet.has(term)) {
            score += 1;
          }
        }

        return { ...entry, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score);
  }

  serialize(): SerializedKnowledgeIndexSnapshot {
    const entries: SerializedKnowledgeIndexEntry[] = this.getEntries().map((entry) => ({
      chunkId: entry.chunkId,
      documentId: entry.documentId,
      title: entry.title,
      section: entry.section ?? null,
      tags: [...entry.tags],
      keywords: [...entry.keywords],
      searchWords: [...entry.searchWords],
      source: entry.source,
    }));

    return {
      entryCount: entries.length,
      documentCount: this.documents.size,
      updatedAt: this.updatedAt,
      documents: this.getDocuments(),
      entries,
    };
  }

  reset(): void {
    this.entries.clear();
    this.documents.clear();
    this.updatedAt = new Date().toISOString();
  }

  private removeDocument(documentId: string): void {
    this.documents.delete(documentId);

    for (const [chunkId, entry] of this.entries.entries()) {
      if (entry.documentId === documentId) {
        this.entries.delete(chunkId);
      }
    }
  }
}

export function createKnowledgeIndex(options?: KnowledgeIndexOptions): KnowledgeIndex {
  const instanceId = options?.instanceId?.trim() || 'default-knowledge-index';
  return new KnowledgeIndex(instanceId);
}

/** Default dev/test singleton. In-memory only. */
export const knowledgeIndex = createKnowledgeIndex();
