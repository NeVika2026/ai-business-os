export type KnowledgeDocumentFormat = 'markdown' | 'obsidian';

export interface KnowledgeImportedDocument {
  id: string;
  title: string;
  path: string | null;
  content: string;
  format: KnowledgeDocumentFormat;
  source: string;
  tags: string[];
  importedAt: string;
  metadata: Record<string, unknown>;
}

export interface KnowledgeImporterSnapshot {
  documentCount: number;
  vaultPaths: string[];
  lastImportAt: string | null;
  updatedAt: string;
}

export interface SerializedKnowledgeImportedDocument {
  id: string;
  title: string;
  path: string | null;
  content: string;
  format: KnowledgeDocumentFormat;
  source: string;
  tags: string[];
  importedAt: string;
  metadata: Record<string, unknown>;
}

export interface SerializedKnowledgeImporterSnapshot {
  documentCount: number;
  vaultPaths: string[];
  lastImportAt: string | null;
  updatedAt: string;
  documents: SerializedKnowledgeImportedDocument[];
}

export interface ImportMarkdownInput {
  content: string;
  title?: string;
  path?: string | null;
  source?: string;
  format?: KnowledgeDocumentFormat;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface ImportDirectoryInput {
  directoryPath: string;
  recursive?: boolean;
  source?: string;
  format?: KnowledgeDocumentFormat;
}

export interface ScanVaultInput {
  vaultPath: string;
  recursive?: boolean;
  source?: string;
}

export interface KnowledgeImporterOptions {
  instanceId?: string;
}
