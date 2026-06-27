import type {
  KnowledgeImportedDocument,
  KnowledgeImporterSnapshot,
  SerializedKnowledgeImportedDocument,
  SerializedKnowledgeImporterSnapshot,
} from '@/services/knowledge/knowledge-importer-types';

function nullifyRecord(value: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    result[key] = entry === undefined ? null : entry;
  }

  return result;
}

export function serializeKnowledgeImportedDocument(
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
    metadata: nullifyRecord(document.metadata),
  };
}

export function serializeKnowledgeImporterSnapshot(input: {
  snapshot: KnowledgeImporterSnapshot;
  documents: KnowledgeImportedDocument[];
}): SerializedKnowledgeImporterSnapshot {
  return {
    documentCount: input.snapshot.documentCount,
    vaultPaths: [...input.snapshot.vaultPaths],
    lastImportAt: input.snapshot.lastImportAt ?? null,
    updatedAt: input.snapshot.updatedAt,
    documents: input.documents.map(serializeKnowledgeImportedDocument),
  };
}
