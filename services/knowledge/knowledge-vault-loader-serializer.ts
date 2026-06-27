import type {
  KnowledgeVaultLoaderSnapshot,
  SerializedKnowledgeVaultLoaderSnapshot,
  SerializedVaultDocument,
  SerializedVaultLoadErrorEntry,
  SerializedVaultLoadResult,
  SerializedVaultLoadStatistics,
  SerializedVaultScanResult,
  SerializedVaultScannedFile,
  SerializedVaultSkippedEntry,
  SerializedVaultValidationResult,
  VaultDocument,
  VaultLoadErrorEntry,
  VaultLoadResult,
  VaultLoadStatistics,
  VaultScanResult,
  VaultScannedFile,
  VaultSkippedEntry,
  VaultValidationResult,
} from '@/services/knowledge/knowledge-vault-loader-types';

function nullifyRecord(value: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    result[key] = entry === undefined ? null : entry;
  }

  return result;
}

export function serializeVaultLoadStatistics(
  statistics: VaultLoadStatistics,
): SerializedVaultLoadStatistics {
  return {
    files: statistics.files,
    directories: statistics.directories,
    skipped: statistics.skipped,
    errors: statistics.errors,
    duration: statistics.duration,
  };
}

export function serializeVaultSkippedEntry(entry: VaultSkippedEntry): SerializedVaultSkippedEntry {
  return {
    path: entry.path,
    reason: entry.reason,
  };
}

export function serializeVaultLoadErrorEntry(
  entry: VaultLoadErrorEntry,
): SerializedVaultLoadErrorEntry {
  return {
    path: entry.path,
    message: entry.message,
  };
}

export function serializeVaultScannedFile(file: VaultScannedFile): SerializedVaultScannedFile {
  return {
    path: file.path,
    relativePath: file.relativePath,
    extension: file.extension,
    sizeBytes: file.sizeBytes,
  };
}

export function serializeVaultDocument(document: VaultDocument): SerializedVaultDocument {
  return {
    id: document.id,
    title: document.title,
    path: document.path,
    relativePath: document.relativePath,
    vaultPath: document.vaultPath,
    extension: document.extension,
    format: document.format,
    content: document.content,
    sizeBytes: document.sizeBytes,
    tags: [...document.tags],
    wikilinks: [...document.wikilinks],
    loadedAt: document.loadedAt,
    metadata: nullifyRecord(document.metadata),
  };
}

export function serializeVaultScanResult(result: VaultScanResult): SerializedVaultScanResult {
  return {
    vaultPath: result.vaultPath,
    files: result.files.map(serializeVaultScannedFile),
    statistics: serializeVaultLoadStatistics(result.statistics),
    skipped: result.skipped.map(serializeVaultSkippedEntry),
    errors: result.errors.map(serializeVaultLoadErrorEntry),
  };
}

export function serializeVaultValidationResult(
  result: VaultValidationResult,
): SerializedVaultValidationResult {
  return {
    valid: result.valid,
    vaultPath: result.vaultPath,
    errors: [...result.errors],
    warnings: [...result.warnings],
    statistics: serializeVaultLoadStatistics(result.statistics),
    skipped: result.skipped.map(serializeVaultSkippedEntry),
    scanErrors: result.scanErrors.map(serializeVaultLoadErrorEntry),
  };
}

export function serializeVaultLoadResult(result: VaultLoadResult): SerializedVaultLoadResult {
  return {
    vaultPath: result.vaultPath,
    documents: result.documents.map(serializeVaultDocument),
    statistics: serializeVaultLoadStatistics(result.statistics),
    skipped: result.skipped.map(serializeVaultSkippedEntry),
    errors: result.errors.map(serializeVaultLoadErrorEntry),
  };
}

export function serializeKnowledgeVaultLoaderSnapshot(input: {
  snapshot: KnowledgeVaultLoaderSnapshot;
  documents: VaultDocument[];
}): SerializedKnowledgeVaultLoaderSnapshot {
  return {
    instanceId: input.snapshot.instanceId,
    lastVaultPath: input.snapshot.lastVaultPath ?? null,
    lastLoadedAt: input.snapshot.lastLoadedAt ?? null,
    documentCount: input.snapshot.documentCount,
    watchEnabled: input.snapshot.watchEnabled,
    updatedAt: input.snapshot.updatedAt,
    documents: input.documents.map(serializeVaultDocument),
  };
}
