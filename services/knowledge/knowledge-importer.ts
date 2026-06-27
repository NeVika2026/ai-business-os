import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  KnowledgeImporterFilesystemError,
  KnowledgeImporterValidationError,
} from '@/services/knowledge/knowledge-importer-errors';
import { serializeKnowledgeImporterSnapshot } from '@/services/knowledge/knowledge-importer-serializer';
import {
  extractFrontmatterTags,
  extractInlineTags,
  extractTitle,
} from '@/services/knowledge/knowledge-markdown-utils';
import type {
  ImportDirectoryInput,
  ImportMarkdownInput,
  KnowledgeImportedDocument,
  KnowledgeImporterOptions,
  KnowledgeImporterSnapshot,
  ScanVaultInput,
  SerializedKnowledgeImporterSnapshot,
  SerializedKnowledgeImportedDocument,
} from '@/services/knowledge/knowledge-importer-types';

const MARKDOWN_EXTENSIONS = new Set(['.md', '.markdown']);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function createDocumentId(source: string, content: string): string {
  return createHash('sha256').update(`${source}:${content}`).digest('hex').slice(0, 32);
}

function isMarkdownFile(filePath: string): boolean {
  return MARKDOWN_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

async function collectMarkdownFiles(directoryPath: string, recursive: boolean): Promise<string[]> {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue;
    }

    const fullPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      if (recursive) {
        files.push(...(await collectMarkdownFiles(fullPath, recursive)));
      }
      continue;
    }

    if (entry.isFile() && isMarkdownFile(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function toSerializedDocument(
  document: KnowledgeImportedDocument,
): SerializedKnowledgeImportedDocument {
  return {
    id: document.id,
    title: document.title,
    path: document.path ?? null,
    content: document.content,
    format: document.format,
    source: document.source,
    tags: [...document.tags],
    importedAt: document.importedAt,
    metadata: { ...document.metadata },
  };
}

/**
 * In-memory markdown and Obsidian vault importer.
 */
export class KnowledgeImporter {
  private readonly documents = new Map<string, KnowledgeImportedDocument>();
  private readonly vaultPaths = new Set<string>();
  private lastImportAt: string | null = null;
  private updatedAt: string = new Date().toISOString();

  constructor(private readonly instanceId: string) {}

  importMarkdown(input: ImportMarkdownInput): KnowledgeImportedDocument {
    if (!input || typeof input !== 'object') {
      throw new KnowledgeImporterValidationError('import input must be an object');
    }

    if (!isNonEmptyString(input.content)) {
      throw new KnowledgeImporterValidationError('content is required');
    }

    const source = input.source?.trim() || 'inline-markdown';
    const format = input.format ?? 'markdown';
    const title = input.title?.trim() || extractTitle(input.content, source);
    const frontmatterTags = extractFrontmatterTags(input.content);
    const inlineTags = extractInlineTags(input.content);
    const tags = [...new Set([...(input.tags ?? []), ...frontmatterTags, ...inlineTags])];
    const importedAt = new Date().toISOString();
    const document: KnowledgeImportedDocument = {
      id: createDocumentId(source, input.content),
      title,
      path: input.path ?? null,
      content: input.content,
      format,
      source,
      tags,
      importedAt,
      metadata: {
        ...(input.metadata ?? {}),
        instanceId: this.instanceId,
      },
    };

    this.documents.set(document.id, document);
    this.lastImportAt = importedAt;
    this.updatedAt = importedAt;
    return document;
  }

  async importDirectory(input: ImportDirectoryInput): Promise<KnowledgeImportedDocument[]> {
    if (!input || typeof input !== 'object') {
      throw new KnowledgeImporterValidationError('directory input must be an object');
    }

    if (!isNonEmptyString(input.directoryPath)) {
      throw new KnowledgeImporterValidationError('directoryPath is required');
    }

    const directoryPath = path.resolve(input.directoryPath);
    const recursive = input.recursive ?? true;
    const format = input.format ?? 'markdown';
    const sourcePrefix = input.source?.trim() || directoryPath;

    let stat;
    try {
      stat = await fs.stat(directoryPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'directory is not accessible';
      throw new KnowledgeImporterFilesystemError(message);
    }

    if (!stat.isDirectory()) {
      throw new KnowledgeImporterValidationError('directoryPath must point to a directory');
    }

    const files = await collectMarkdownFiles(directoryPath, recursive);
    const imported: KnowledgeImportedDocument[] = [];

    for (const filePath of files) {
      const content = await fs.readFile(filePath, 'utf8');
      imported.push(
        this.importMarkdown({
          content,
          path: filePath,
          source: `${sourcePrefix}:${path.relative(directoryPath, filePath)}`,
          format,
          metadata: {
            directoryPath,
            relativePath: path.relative(directoryPath, filePath),
          },
        }),
      );
    }

    return imported;
  }

  async scanVault(input: ScanVaultInput): Promise<KnowledgeImportedDocument[]> {
    if (!input || typeof input !== 'object') {
      throw new KnowledgeImporterValidationError('vault input must be an object');
    }

    if (!isNonEmptyString(input.vaultPath)) {
      throw new KnowledgeImporterValidationError('vaultPath is required');
    }

    const vaultPath = path.resolve(input.vaultPath);
    const recursive = input.recursive ?? true;
    const sourcePrefix = input.source?.trim() || vaultPath;

    let stat;
    try {
      stat = await fs.stat(vaultPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'vault path is not accessible';
      throw new KnowledgeImporterFilesystemError(message);
    }

    if (!stat.isDirectory()) {
      throw new KnowledgeImporterValidationError('vaultPath must point to a directory');
    }

    this.vaultPaths.add(vaultPath);

    const files = await collectMarkdownFiles(vaultPath, recursive);
    const imported: KnowledgeImportedDocument[] = [];

    for (const filePath of files) {
      const content = await fs.readFile(filePath, 'utf8');
      const wikilinks = [...content.matchAll(/\[\[([^\]]+)\]\]/g)].map((match) => match[1]);
      imported.push(
        this.importMarkdown({
          content,
          path: filePath,
          source: `${sourcePrefix}:${path.relative(vaultPath, filePath)}`,
          format: 'obsidian',
          metadata: {
            vaultPath,
            relativePath: path.relative(vaultPath, filePath),
            wikilinks,
            isObsidianVault: true,
          },
        }),
      );
    }

    return imported;
  }

  listDocuments(): SerializedKnowledgeImportedDocument[] {
    return [...this.documents.values()]
      .sort((left, right) => left.title.localeCompare(right.title))
      .map(toSerializedDocument);
  }

  serialize(): SerializedKnowledgeImporterSnapshot {
    return serializeKnowledgeImporterSnapshot({
      snapshot: this.buildSnapshot(),
      documents: [...this.documents.values()],
    });
  }

  reset(): void {
    this.documents.clear();
    this.vaultPaths.clear();
    this.lastImportAt = null;
    this.updatedAt = new Date().toISOString();
  }

  getDocument(id: string): KnowledgeImportedDocument | null {
    return this.documents.get(id) ?? null;
  }

  getDocuments(): KnowledgeImportedDocument[] {
    return [...this.documents.values()];
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  private buildSnapshot(): KnowledgeImporterSnapshot {
    return {
      documentCount: this.documents.size,
      vaultPaths: [...this.vaultPaths],
      lastImportAt: this.lastImportAt,
      updatedAt: this.updatedAt,
    };
  }
}

export function createKnowledgeImporter(options?: KnowledgeImporterOptions): KnowledgeImporter {
  const instanceId = options?.instanceId?.trim() || 'default-knowledge-importer';
  return new KnowledgeImporter(instanceId);
}

/** Default dev/test singleton. In-memory only. */
export const knowledgeImporter = createKnowledgeImporter();
