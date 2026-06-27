import { createHash } from 'node:crypto';
import { watch, type FSWatcher, promises as fs } from 'node:fs';
import path from 'node:path';

import {
  KnowledgeVaultLoaderFilesystemError,
  KnowledgeVaultLoaderValidationError,
  KnowledgeVaultLoaderWatchError,
} from '@/services/knowledge/knowledge-vault-loader-errors';
import { serializeKnowledgeVaultLoaderSnapshot } from '@/services/knowledge/knowledge-vault-loader-serializer';
import {
  extractFrontmatterTags,
  extractInlineTags,
  extractTitle,
} from '@/services/knowledge/knowledge-markdown-utils';
import type {
  KnowledgeVaultLoaderOptions,
  KnowledgeVaultLoaderSnapshot,
  SerializedKnowledgeVaultLoaderSnapshot,
  VaultDocument,
  VaultDocumentExtension,
  VaultDocumentFormat,
  VaultLoadErrorEntry,
  VaultLoadResult,
  VaultLoadStatistics,
  VaultScanResult,
  VaultScannedFile,
  VaultSkippedEntry,
  VaultValidationResult,
  VaultWatchEvent,
  VaultWatchHandler,
} from '@/services/knowledge/knowledge-vault-loader-types';

const MARKDOWN_EXTENSIONS = new Set(['.md', '.mdx']);
const IGNORED_DIRECTORY_NAMES = new Set(['.git', 'node_modules', 'dist', '.next']);
const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const BINARY_SAMPLE_BYTES = 8192;

interface ScanAccumulator {
  files: VaultScannedFile[];
  skipped: VaultSkippedEntry[];
  errors: VaultLoadErrorEntry[];
  statistics: VaultLoadStatistics;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function createEmptyStatistics(): VaultLoadStatistics {
  return {
    files: 0,
    directories: 0,
    skipped: 0,
    errors: 0,
    duration: 0,
  };
}

function createDocumentId(vaultPath: string, relativePath: string, content: string): string {
  return createHash('sha256')
    .update(`${vaultPath}:${relativePath}:${content}`)
    .digest('hex')
    .slice(0, 32);
}

function extractWikilinks(content: string): string[] {
  return [...content.matchAll(/\[\[([^\]]+)\]\]/g)].map((match) => match[1]);
}

function getDocumentExtension(filePath: string): VaultDocumentExtension | null {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === '.md') {
    return 'md';
  }

  if (extension === '.mdx') {
    return 'mdx';
  }

  return null;
}

function isMarkdownFile(filePath: string): boolean {
  return MARKDOWN_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function normalizeRelativePath(relativePath: string): string {
  return relativePath.split(path.sep).join('/');
}

function shouldIgnoreRelativePath(relativePath: string): boolean {
  const normalized = normalizeRelativePath(relativePath);

  if (normalized.includes('.obsidian/cache')) {
    return true;
  }

  const segments = normalized.split('/').filter(Boolean);
  return segments.some((segment) => IGNORED_DIRECTORY_NAMES.has(segment));
}

function isHiddenEntry(name: string): boolean {
  return name.startsWith('.');
}

function isBinaryBuffer(buffer: Buffer): boolean {
  const sample = buffer.subarray(0, Math.min(buffer.length, BINARY_SAMPLE_BYTES));
  return sample.includes(0);
}

async function resolveVaultDirectory(vaultPath: string): Promise<string> {
  if (!isNonEmptyString(vaultPath)) {
    throw new KnowledgeVaultLoaderValidationError('vault path is required');
  }

  const resolvedPath = path.resolve(vaultPath);

  try {
    const stat = await fs.stat(resolvedPath);
    if (!stat.isDirectory()) {
      throw new KnowledgeVaultLoaderValidationError('vault path must point to a directory');
    }
  } catch (error) {
    if (error instanceof KnowledgeVaultLoaderValidationError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'vault path is not accessible';
    throw new KnowledgeVaultLoaderFilesystemError(message);
  }

  return resolvedPath;
}

async function detectVaultFormat(vaultPath: string): Promise<VaultDocumentFormat> {
  try {
    const obsidianPath = path.join(vaultPath, '.obsidian');
    const stat = await fs.stat(obsidianPath);
    if (stat.isDirectory()) {
      return 'obsidian';
    }
  } catch {
    return 'markdown';
  }

  return 'markdown';
}

/**
 * Loads Obsidian and Markdown vaults from disk without touching the Knowledge Pipeline.
 */
export class KnowledgeVaultLoader {
  private readonly documents = new Map<string, VaultDocument>();
  private lastVaultPath: string | null = null;
  private lastLoadedAt: string | null = null;
  private updatedAt = new Date().toISOString();
  private watcher: FSWatcher | null = null;
  private watchVaultPath: string | null = null;
  private watchHandler: VaultWatchHandler | null = null;

  constructor(
    private readonly instanceId: string,
    private readonly maxFileSizeBytes: number,
    private readonly recursive: boolean,
    private watchEnabled: boolean,
  ) {}

  async loadVault(vaultPath: string): Promise<VaultLoadResult> {
    const startedAt = Date.now();
    const resolvedVaultPath = await resolveVaultDirectory(vaultPath);
    const scan = await this.scanMarkdownFiles(resolvedVaultPath);
    const documents: VaultDocument[] = [];
    const errors: VaultLoadErrorEntry[] = [...scan.errors];
    const skipped: VaultSkippedEntry[] = [...scan.skipped];
    const vaultFormat = await detectVaultFormat(resolvedVaultPath);

    for (const file of scan.files) {
      try {
        const document = await this.loadFile(file.path, resolvedVaultPath, vaultFormat);
        documents.push(document);
        this.documents.set(document.id, document);
      } catch (error) {
        errors.push({
          path: file.path,
          message: error instanceof Error ? error.message : 'Failed to load vault file',
        });
      }
    }

    const statistics: VaultLoadStatistics = {
      files: documents.length,
      directories: scan.statistics.directories,
      skipped: skipped.length,
      errors: errors.length,
      duration: Date.now() - startedAt,
    };

    this.lastVaultPath = resolvedVaultPath;
    this.lastLoadedAt = new Date().toISOString();
    this.updatedAt = this.lastLoadedAt;

    if (this.watchEnabled) {
      this.startWatch(resolvedVaultPath, this.watchHandler ?? undefined);
    }

    return {
      vaultPath: resolvedVaultPath,
      documents,
      statistics,
      skipped,
      errors,
    };
  }

  async validateVault(vaultPath: string): Promise<VaultValidationResult> {
    const startedAt = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let resolvedVaultPath = '';

    try {
      resolvedVaultPath = await resolveVaultDirectory(vaultPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Vault validation failed';
      errors.push(message);

      return {
        valid: false,
        vaultPath: path.resolve(vaultPath || ''),
        errors,
        warnings,
        statistics: {
          ...createEmptyStatistics(),
          errors: errors.length,
          duration: Date.now() - startedAt,
        },
        skipped: [],
        scanErrors: [],
      };
    }

    const scan = await this.scanMarkdownFiles(resolvedVaultPath);

    if (scan.files.length === 0) {
      warnings.push('No markdown files found in vault');
    }

    if (scan.skipped.length > 0) {
      warnings.push(`${scan.skipped.length} entries were skipped during scan`);
    }

    if (scan.errors.length > 0) {
      warnings.push(`${scan.errors.length} scan errors encountered`);
    }

    return {
      valid: errors.length === 0,
      vaultPath: resolvedVaultPath,
      errors,
      warnings,
      statistics: {
        files: scan.files.length,
        directories: scan.statistics.directories,
        skipped: scan.skipped.length,
        errors: scan.errors.length,
        duration: Date.now() - startedAt,
      },
      skipped: scan.skipped,
      scanErrors: scan.errors,
    };
  }

  async scanMarkdownFiles(vaultPath: string): Promise<VaultScanResult> {
    const startedAt = Date.now();
    const resolvedVaultPath = await resolveVaultDirectory(vaultPath);
    const accumulator: ScanAccumulator = {
      files: [],
      skipped: [],
      errors: [],
      statistics: createEmptyStatistics(),
    };

    await this.walkDirectory(resolvedVaultPath, resolvedVaultPath, accumulator);

    return {
      vaultPath: resolvedVaultPath,
      files: accumulator.files.sort((left, right) =>
        left.relativePath.localeCompare(right.relativePath),
      ),
      statistics: {
        files: accumulator.files.length,
        directories: accumulator.statistics.directories,
        skipped: accumulator.skipped.length,
        errors: accumulator.errors.length,
        duration: Date.now() - startedAt,
      },
      skipped: accumulator.skipped,
      errors: accumulator.errors,
    };
  }

  async loadFile(
    filePath: string,
    vaultPath?: string,
    format?: VaultDocumentFormat,
  ): Promise<VaultDocument> {
    if (!isNonEmptyString(filePath)) {
      throw new KnowledgeVaultLoaderValidationError('file path is required');
    }

    const resolvedFilePath = path.resolve(filePath);
    const extension = getDocumentExtension(resolvedFilePath);

    if (!extension) {
      throw new KnowledgeVaultLoaderValidationError('file must use .md or .mdx extension');
    }

    if (isHiddenEntry(path.basename(resolvedFilePath))) {
      throw new KnowledgeVaultLoaderValidationError('hidden files are not supported');
    }

    let stat;
    try {
      stat = await fs.stat(resolvedFilePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'file is not accessible';
      throw new KnowledgeVaultLoaderFilesystemError(message);
    }

    if (!stat.isFile()) {
      throw new KnowledgeVaultLoaderValidationError('file path must point to a file');
    }

    if (stat.size > this.maxFileSizeBytes) {
      throw new KnowledgeVaultLoaderValidationError(
        `file exceeds maximum size of ${this.maxFileSizeBytes} bytes`,
      );
    }

    let buffer: Buffer;
    try {
      buffer = await fs.readFile(resolvedFilePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'failed to read file';
      throw new KnowledgeVaultLoaderFilesystemError(message);
    }

    if (isBinaryBuffer(buffer)) {
      throw new KnowledgeVaultLoaderValidationError('binary files are not supported');
    }

    const content = buffer.toString('utf8');
    const resolvedVaultPath = vaultPath ? path.resolve(vaultPath) : path.dirname(resolvedFilePath);
    const relativePath = normalizeRelativePath(path.relative(resolvedVaultPath, resolvedFilePath));
    const documentFormat = format ?? (await detectVaultFormat(resolvedVaultPath));
    const basename = path.basename(resolvedFilePath, path.extname(resolvedFilePath));
    const frontmatterTags = extractFrontmatterTags(content);
    const inlineTags = extractInlineTags(content);
    const wikilinks = extractWikilinks(content);
    const loadedAt = new Date().toISOString();

    const document: VaultDocument = {
      id: createDocumentId(resolvedVaultPath, relativePath, content),
      title: extractTitle(content, basename),
      path: resolvedFilePath,
      relativePath,
      vaultPath: resolvedVaultPath,
      extension,
      format: documentFormat,
      content,
      sizeBytes: stat.size,
      tags: [...new Set([...frontmatterTags, ...inlineTags])],
      wikilinks,
      loadedAt,
      metadata: {
        instanceId: this.instanceId,
        basename,
        hasFrontmatter: content.startsWith('---'),
        hasWikilinks: wikilinks.length > 0,
      },
    };

    this.documents.set(document.id, document);
    this.updatedAt = loadedAt;
    return document;
  }

  startWatch(vaultPath: string, onEvent?: VaultWatchHandler): void {
    if (!this.watchEnabled) {
      throw new KnowledgeVaultLoaderWatchError('watch mode is disabled');
    }

    this.stopWatch();

    const resolvedVaultPath = path.resolve(vaultPath);
    this.watchHandler = onEvent ?? this.watchHandler;
    this.watchVaultPath = resolvedVaultPath;

    try {
      this.watcher = watch(
        resolvedVaultPath,
        { recursive: this.recursive },
        (eventType, filename) => {
          if (!filename || !this.watchVaultPath || !this.watchHandler) {
            return;
          }

          const absolutePath = path.join(this.watchVaultPath, filename.toString());
          const relativePath = normalizeRelativePath(
            path.relative(this.watchVaultPath, absolutePath),
          );

          if (
            shouldIgnoreRelativePath(relativePath) ||
            isHiddenEntry(path.basename(absolutePath))
          ) {
            return;
          }

          const type: VaultWatchEvent['type'] =
            eventType === 'rename' ? 'remove' : eventType === 'change' ? 'change' : 'add';

          this.watchHandler({
            type,
            path: absolutePath,
            relativePath,
            timestamp: new Date().toISOString(),
          });
        },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start vault watch';
      throw new KnowledgeVaultLoaderWatchError(message);
    }
  }

  stopWatch(): void {
    this.watcher?.close();
    this.watcher = null;
    this.watchVaultPath = null;
  }

  setWatchEnabled(enabled: boolean): void {
    this.watchEnabled = enabled;
    if (!enabled) {
      this.stopWatch();
    }
    this.updatedAt = new Date().toISOString();
  }

  isWatchEnabled(): boolean {
    return this.watchEnabled;
  }

  listDocuments(): VaultDocument[] {
    return [...this.documents.values()].sort((left, right) =>
      left.relativePath.localeCompare(right.relativePath),
    );
  }

  serialize(): SerializedKnowledgeVaultLoaderSnapshot {
    return serializeKnowledgeVaultLoaderSnapshot({
      snapshot: this.buildSnapshot(),
      documents: this.listDocuments(),
    });
  }

  reset(): void {
    this.stopWatch();
    this.documents.clear();
    this.lastVaultPath = null;
    this.lastLoadedAt = null;
    this.watchHandler = null;
    this.updatedAt = new Date().toISOString();
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  private buildSnapshot(): KnowledgeVaultLoaderSnapshot {
    return {
      instanceId: this.instanceId,
      lastVaultPath: this.lastVaultPath,
      lastLoadedAt: this.lastLoadedAt,
      documentCount: this.documents.size,
      watchEnabled: this.watchEnabled,
      updatedAt: this.updatedAt,
    };
  }

  private async walkDirectory(
    currentPath: string,
    vaultPath: string,
    accumulator: ScanAccumulator,
  ): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(currentPath, { withFileTypes: true });
    } catch (error) {
      accumulator.errors.push({
        path: currentPath,
        message: error instanceof Error ? error.message : 'Failed to read directory',
      });
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relativePath = normalizeRelativePath(path.relative(vaultPath, fullPath));

      if (shouldIgnoreRelativePath(relativePath)) {
        accumulator.skipped.push({
          path: fullPath,
          reason: 'ignored directory',
        });
        continue;
      }

      if (entry.isDirectory()) {
        accumulator.statistics.directories += 1;

        if (this.recursive) {
          await this.walkDirectory(fullPath, vaultPath, accumulator);
        }

        continue;
      }

      if (!entry.isFile()) {
        accumulator.skipped.push({
          path: fullPath,
          reason: 'unsupported entry type',
        });
        continue;
      }

      if (isHiddenEntry(entry.name)) {
        accumulator.skipped.push({
          path: fullPath,
          reason: 'hidden file',
        });
        continue;
      }

      if (!isMarkdownFile(fullPath)) {
        continue;
      }

      let stat;
      try {
        stat = await fs.stat(fullPath);
      } catch (error) {
        accumulator.errors.push({
          path: fullPath,
          message: error instanceof Error ? error.message : 'Failed to stat file',
        });
        continue;
      }

      if (stat.size > this.maxFileSizeBytes) {
        accumulator.skipped.push({
          path: fullPath,
          reason: 'file exceeds maximum size',
        });
        continue;
      }

      const extension = getDocumentExtension(fullPath);
      if (!extension) {
        continue;
      }

      let buffer: Buffer;
      try {
        buffer = await fs.readFile(fullPath);
      } catch (error) {
        accumulator.errors.push({
          path: fullPath,
          message: error instanceof Error ? error.message : 'Failed to read file',
        });
        continue;
      }

      if (isBinaryBuffer(buffer)) {
        accumulator.skipped.push({
          path: fullPath,
          reason: 'binary file',
        });
        continue;
      }

      accumulator.files.push({
        path: fullPath,
        relativePath,
        extension,
        sizeBytes: stat.size,
      });
    }
  }
}

export function createKnowledgeVaultLoader(
  options?: KnowledgeVaultLoaderOptions,
): KnowledgeVaultLoader {
  const instanceId = options?.instanceId?.trim() || 'default-knowledge-vault-loader';
  const maxFileSizeBytes = options?.maxFileSizeBytes ?? DEFAULT_MAX_FILE_SIZE_BYTES;
  const recursive = options?.recursive ?? true;
  const watchEnabled = options?.watchEnabled ?? false;

  if (maxFileSizeBytes <= 0) {
    throw new KnowledgeVaultLoaderValidationError('maxFileSizeBytes must be greater than 0');
  }

  return new KnowledgeVaultLoader(instanceId, maxFileSizeBytes, recursive, watchEnabled);
}

/** Default dev/test singleton. Filesystem-backed vault loader. */
export const knowledgeVaultLoader = createKnowledgeVaultLoader();
