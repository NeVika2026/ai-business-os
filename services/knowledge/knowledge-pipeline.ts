import { promises as fs } from 'node:fs';
import path from 'node:path';

import { createKnowledgeChunkEngine } from '@/services/knowledge/knowledge-chunk-engine';
import { createKnowledgeImporter } from '@/services/knowledge/knowledge-importer';
import type { KnowledgeImportedDocument } from '@/services/knowledge/knowledge-importer-types';
import { createKnowledgeIndex } from '@/services/knowledge/knowledge-index';
import { createKnowledgeMarkdownParser } from '@/services/knowledge/knowledge-markdown-parser';
import type { ParsedKnowledgeMarkdown } from '@/services/knowledge/knowledge-markdown-parser-types';
import {
  KnowledgePipelineIngestError,
  KnowledgePipelineValidationError,
} from '@/services/knowledge/knowledge-pipeline-errors';
import { serializeKnowledgePipelineSnapshot } from '@/services/knowledge/knowledge-pipeline-serializer';
import type {
  KnowledgePipelineIngestMarkdownInput,
  KnowledgePipelineIngestResult,
  KnowledgePipelineOptions,
  KnowledgePipelineSearchResult,
  KnowledgePipelineStatistics,
  SerializedKnowledgePipelineSnapshot,
} from '@/services/knowledge/knowledge-pipeline-types';
import { createKnowledgeSearchEngine } from '@/services/knowledge/knowledge-search-engine';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function buildSectionsFromParsed(parsed: ParsedKnowledgeMarkdown): Array<{
  heading: string | null;
  level: number | null;
  text: string;
}> {
  const body = parsed.rawContent.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  const lines = body.split(/\r?\n/);
  const sections: Array<{ heading: string | null; level: number | null; text: string }> = [];
  let currentHeading: string | null = parsed.title;
  let currentLevel: number | null = 1;
  let buffer: string[] = [];

  const flush = () => {
    const text = buffer.join('\n').trim();
    if (!text) {
      return;
    }

    sections.push({
      heading: currentHeading,
      level: currentLevel,
      text,
    });
    buffer = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flush();
      currentHeading = headingMatch[2].trim();
      currentLevel = headingMatch[1].length;
      continue;
    }

    buffer.push(line);
  }

  flush();

  if (sections.length > 0) {
    return sections;
  }

  const fallbackText =
    parsed.paragraphs
      .map((paragraph) => paragraph.text)
      .join('\n\n')
      .trim() || body.trim();

  if (!fallbackText) {
    return [];
  }

  return [
    {
      heading: parsed.title,
      level: 1,
      text: fallbackText,
    },
  ];
}

/**
 * Unified in-memory knowledge pipeline: import, parse, chunk, index, search.
 */
export class KnowledgePipeline {
  private lastIngestAt: string | null = null;
  private updatedAt: string = new Date().toISOString();

  constructor(
    private readonly instanceId: string,
    private readonly importer: ReturnType<typeof createKnowledgeImporter>,
    private readonly parser: ReturnType<typeof createKnowledgeMarkdownParser>,
    private readonly chunkEngine: ReturnType<typeof createKnowledgeChunkEngine>,
    private readonly index: ReturnType<typeof createKnowledgeIndex>,
    private readonly searchEngine: ReturnType<typeof createKnowledgeSearchEngine>,
  ) {}

  async ingestDirectory(directoryPath: string): Promise<KnowledgePipelineIngestResult[]> {
    if (!isNonEmptyString(directoryPath)) {
      throw new KnowledgePipelineValidationError('directoryPath is required');
    }

    const documents = await this.importer.importDirectory({ directoryPath });
    return documents.map((document) => this.processDocument(document));
  }

  async ingestFiles(files: string[]): Promise<KnowledgePipelineIngestResult[]> {
    if (!Array.isArray(files) || files.length === 0) {
      throw new KnowledgePipelineValidationError('files must be a non-empty array');
    }

    const results: KnowledgePipelineIngestResult[] = [];

    for (const filePath of files) {
      if (!isNonEmptyString(filePath)) {
        throw new KnowledgePipelineValidationError('each file path must be a non-empty string');
      }

      const resolvedPath = path.resolve(filePath);
      const content = await fs.readFile(resolvedPath, 'utf8');
      const document = this.importer.importMarkdown({
        content,
        path: resolvedPath,
        source: resolvedPath,
      });
      results.push(this.processDocument(document));
    }

    return results;
  }

  ingestMarkdown(
    markdown: string | KnowledgePipelineIngestMarkdownInput,
  ): KnowledgePipelineIngestResult {
    const input = typeof markdown === 'string' ? { content: markdown } : markdown;

    if (!isNonEmptyString(input.content)) {
      throw new KnowledgePipelineValidationError('markdown content is required');
    }

    const document = this.importer.importMarkdown(input);
    return this.processDocument(document);
  }

  search(query: string, limit?: number): KnowledgePipelineSearchResult[] {
    if (!isNonEmptyString(query)) {
      throw new KnowledgePipelineValidationError('query is required');
    }

    return this.searchEngine.search({ query, limit });
  }

  related(chunkId: string, limit?: number): KnowledgePipelineSearchResult[] {
    if (!isNonEmptyString(chunkId)) {
      throw new KnowledgePipelineValidationError('chunkId is required');
    }

    return this.searchEngine.relatedChunks({ chunkId, limit });
  }

  similar(chunkId: string, limit?: number): KnowledgePipelineSearchResult[] {
    if (!isNonEmptyString(chunkId)) {
      throw new KnowledgePipelineValidationError('chunkId is required');
    }

    return this.searchEngine.similarChunks({ chunkId, limit });
  }

  statistics(): KnowledgePipelineStatistics {
    const chunks = this.chunkEngine.getChunks();
    const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.metadata.tokenCount, 0);
    const indexSnapshot = this.index.serialize();

    return {
      documentCount: this.importer.serialize().documentCount,
      chunkCount: chunks.length,
      indexEntryCount: indexSnapshot.entryCount,
      averageChunkTokens: chunks.length > 0 ? totalTokens / chunks.length : 0,
      lastIngestAt: this.lastIngestAt,
      updatedAt: this.updatedAt,
    };
  }

  serialize(): SerializedKnowledgePipelineSnapshot {
    const statistics = this.statistics();

    return serializeKnowledgePipelineSnapshot({
      snapshot: {
        instanceId: this.instanceId,
        statistics,
        updatedAt: this.updatedAt,
      },
      importer: this.importer.serialize(),
      chunks: this.chunkEngine.serialize(),
      index: this.index.serialize(),
      search: this.searchEngine.serialize(),
    });
  }

  reset(): void {
    this.importer.reset();
    this.searchEngine.reset();
    this.lastIngestAt = null;
    this.updatedAt = new Date().toISOString();
  }

  private processDocument(document: KnowledgeImportedDocument): KnowledgePipelineIngestResult {
    try {
      const parsed = this.parser.parse({
        content: document.content,
        fallbackTitle: document.title,
      });
      const tags = [...new Set([...document.tags, ...parsed.tags])];
      const sections = buildSectionsFromParsed(parsed);

      if (sections.length === 0) {
        throw new KnowledgePipelineIngestError(
          `document has no ingestible content: ${document.id}`,
        );
      }

      const title = parsed.title ?? document.title;
      const chunks = this.chunkEngine.chunkDocument({
        documentId: document.id,
        source: document.source,
        title,
        tags,
        sections,
      });

      this.index.build({
        documentId: document.id,
        title,
        source: document.source,
        tags,
        chunks: chunks.map((chunk) => ({
          id: chunk.id,
          text: chunk.text,
          section: chunk.metadata.section,
        })),
      });

      this.lastIngestAt = new Date().toISOString();
      this.updatedAt = this.lastIngestAt;

      return {
        documentId: document.id,
        title,
        chunkCount: chunks.length,
        indexedChunkCount: chunks.length,
      };
    } catch (error) {
      if (error instanceof KnowledgePipelineIngestError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'document ingest failed';
      throw new KnowledgePipelineIngestError(message);
    }
  }
}

export function createKnowledgePipeline(options?: KnowledgePipelineOptions): KnowledgePipeline {
  const instanceId = options?.instanceId?.trim() || 'default-knowledge-pipeline';
  const importer =
    options?.importer ?? createKnowledgeImporter({ instanceId: `${instanceId}-importer` });
  const parser =
    options?.parser ?? createKnowledgeMarkdownParser({ instanceId: `${instanceId}-parser` });
  const chunkEngine =
    options?.chunkEngine ?? createKnowledgeChunkEngine({ instanceId: `${instanceId}-chunks` });
  const index = options?.index ?? createKnowledgeIndex({ instanceId: `${instanceId}-index` });
  const searchEngine =
    options?.searchEngine ??
    createKnowledgeSearchEngine({
      instanceId: `${instanceId}-search`,
      index,
      chunkEngine,
    });

  return new KnowledgePipeline(instanceId, importer, parser, chunkEngine, index, searchEngine);
}

/** Default dev/test singleton. In-memory only. */
export const knowledgePipeline = createKnowledgePipeline();
