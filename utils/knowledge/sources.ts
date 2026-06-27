import type {
  KnowledgeChunkPreview,
  KnowledgeItem,
  KnowledgeSource,
  KnowledgeSourceMetadata,
  KnowledgeStats,
} from '@/types/knowledge';
import type { KnowledgeImportStatus } from '@/types/knowledge';

type RawKnowledgeSource = Omit<KnowledgeSource, 'metadata'> & {
  metadata: KnowledgeSourceMetadata | null;
};

export function mapKnowledgeSources(rows: RawKnowledgeSource[]): KnowledgeSource[] {
  return rows.map((row) => ({
    ...row,
    metadata: row.metadata ?? {},
  }));
}

export function getMetadataSize(metadata: KnowledgeSourceMetadata): number | null {
  return typeof metadata.size_bytes === 'number' ? metadata.size_bytes : null;
}

export function formatBytes(size: number | null) {
  if (size === null || size <= 0) {
    return '—';
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function attachItemChunkCounts(
  items: Omit<KnowledgeItem, 'chunks_count'>[],
  chunks: { item_id: string }[],
): KnowledgeItem[] {
  const counts = chunks.reduce<Record<string, number>>((acc, chunk) => {
    acc[chunk.item_id] = (acc[chunk.item_id] ?? 0) + 1;
    return acc;
  }, {});

  return items.map((item) => ({
    ...item,
    chunks_count: counts[item.id] ?? 0,
  }));
}

export function mapKnowledgeItems(
  rows: (Omit<KnowledgeItem, 'chunks_count' | 'metadata'> & {
    metadata: KnowledgeSourceMetadata | null;
  })[],
  chunks: { item_id: string }[],
): KnowledgeItem[] {
  const items = rows.map((row) => ({
    ...row,
    metadata: row.metadata ?? {},
    chunks_count: 0,
  }));

  return attachItemChunkCounts(items, chunks);
}

export function mapKnowledgeChunks(rows: KnowledgeChunkPreview[]): KnowledgeChunkPreview[] {
  return rows;
}

const PROCESSING_STATUSES = new Set<KnowledgeImportStatus>([
  'pending',
  'parsing',
  'chunking',
  'embedding',
  'extracting',
]);

export function computeKnowledgeStats(sources: KnowledgeSource[]): KnowledgeStats {
  return {
    totalSources: sources.length,
    completedSources: sources.filter((source) => source.status === 'completed').length,
    processingSources: sources.filter((source) => PROCESSING_STATUSES.has(source.status)).length,
    failedSources: sources.filter((source) => source.status === 'failed').length,
    totalDocuments: sources.reduce((sum, source) => sum + source.items_count, 0),
    totalChunks: sources.reduce((sum, source) => sum + source.chunks_count, 0),
  };
}

const SOURCE_SELECT = `
  id,
  organization_id,
  project_id,
  type,
  title,
  source_uri,
  content_hash,
  status,
  metadata,
  error_message,
  items_count,
  chunks_count,
  created_at,
  updated_at,
  completed_at
`;

export { SOURCE_SELECT };
