export type VaultDocumentExtension = 'md' | 'mdx';
export type VaultDocumentFormat = 'markdown' | 'obsidian';

export interface VaultDocument {
  id: string;
  title: string;
  path: string;
  relativePath: string;
  vaultPath: string;
  extension: VaultDocumentExtension;
  format: VaultDocumentFormat;
  content: string;
  sizeBytes: number;
  tags: string[];
  wikilinks: string[];
  loadedAt: string;
  metadata: Record<string, unknown>;
}

export interface VaultLoadStatistics {
  files: number;
  directories: number;
  skipped: number;
  errors: number;
  duration: number;
}

export interface VaultSkippedEntry {
  path: string;
  reason: string;
}

export interface VaultLoadErrorEntry {
  path: string;
  message: string;
}

export interface VaultScannedFile {
  path: string;
  relativePath: string;
  extension: VaultDocumentExtension;
  sizeBytes: number;
}

export interface VaultScanResult {
  vaultPath: string;
  files: VaultScannedFile[];
  statistics: VaultLoadStatistics;
  skipped: VaultSkippedEntry[];
  errors: VaultLoadErrorEntry[];
}

export interface VaultValidationResult {
  valid: boolean;
  vaultPath: string;
  errors: string[];
  warnings: string[];
  statistics: VaultLoadStatistics;
  skipped: VaultSkippedEntry[];
  scanErrors: VaultLoadErrorEntry[];
}

export interface VaultLoadResult {
  vaultPath: string;
  documents: VaultDocument[];
  statistics: VaultLoadStatistics;
  skipped: VaultSkippedEntry[];
  errors: VaultLoadErrorEntry[];
}

export type VaultWatchEventType = 'add' | 'change' | 'remove';

export interface VaultWatchEvent {
  type: VaultWatchEventType;
  path: string;
  relativePath: string;
  timestamp: string;
}

export interface VaultWatchHandler {
  (event: VaultWatchEvent): void;
}

export interface KnowledgeVaultLoaderSnapshot {
  instanceId: string;
  lastVaultPath: string | null;
  lastLoadedAt: string | null;
  documentCount: number;
  watchEnabled: boolean;
  updatedAt: string;
}

export interface SerializedVaultDocument {
  id: string;
  title: string;
  path: string;
  relativePath: string;
  vaultPath: string;
  extension: VaultDocumentExtension;
  format: VaultDocumentFormat;
  content: string;
  sizeBytes: number;
  tags: string[];
  wikilinks: string[];
  loadedAt: string;
  metadata: Record<string, unknown>;
}

export interface SerializedVaultLoadStatistics {
  files: number;
  directories: number;
  skipped: number;
  errors: number;
  duration: number;
}

export interface SerializedVaultSkippedEntry {
  path: string;
  reason: string;
}

export interface SerializedVaultLoadErrorEntry {
  path: string;
  message: string;
}

export interface SerializedVaultScannedFile {
  path: string;
  relativePath: string;
  extension: VaultDocumentExtension;
  sizeBytes: number;
}

export interface SerializedVaultScanResult {
  vaultPath: string;
  files: SerializedVaultScannedFile[];
  statistics: SerializedVaultLoadStatistics;
  skipped: SerializedVaultSkippedEntry[];
  errors: SerializedVaultLoadErrorEntry[];
}

export interface SerializedVaultValidationResult {
  valid: boolean;
  vaultPath: string;
  errors: string[];
  warnings: string[];
  statistics: SerializedVaultLoadStatistics;
  skipped: SerializedVaultSkippedEntry[];
  scanErrors: SerializedVaultLoadErrorEntry[];
}

export interface SerializedVaultLoadResult {
  vaultPath: string;
  documents: SerializedVaultDocument[];
  statistics: SerializedVaultLoadStatistics;
  skipped: SerializedVaultSkippedEntry[];
  errors: SerializedVaultLoadErrorEntry[];
}

export interface SerializedKnowledgeVaultLoaderSnapshot {
  instanceId: string;
  lastVaultPath: string | null;
  lastLoadedAt: string | null;
  documentCount: number;
  watchEnabled: boolean;
  updatedAt: string;
  documents: SerializedVaultDocument[];
}

export interface KnowledgeVaultLoaderOptions {
  instanceId?: string;
  maxFileSizeBytes?: number;
  watchEnabled?: boolean;
  recursive?: boolean;
}
