export const KNOWLEDGE_SOURCE_TYPES = [
  'telegram',
  'vk',
  'youtube',
  'pdf',
  'docx',
  'html',
  'website',
  'book',
  'zip',
  'audio',
  'video',
  'manual',
] as const;

export type KnowledgeSourceType = (typeof KNOWLEDGE_SOURCE_TYPES)[number];

export const KNOWLEDGE_IMPORT_STATUSES = [
  'pending',
  'parsing',
  'chunking',
  'embedding',
  'extracting',
  'completed',
  'failed',
] as const;

export type KnowledgeImportStatus = (typeof KNOWLEDGE_IMPORT_STATUSES)[number];

export const KNOWLEDGE_ITEM_TYPES = ['document', 'section', 'entity', 'insight'] as const;

export type KnowledgeItemType = (typeof KNOWLEDGE_ITEM_TYPES)[number];

export const KNOWLEDGE_SOURCE_FORM_TYPES = [
  { label: 'PDF', value: 'pdf' },
  { label: 'DOCX', value: 'docx' },
  { label: 'TXT', value: 'manual' },
  { label: 'Markdown', value: 'manual-md' },
  { label: 'HTML', value: 'html' },
  { label: 'ZIP', value: 'zip' },
  { label: 'Telegram Export', value: 'telegram' },
  { label: 'Website', value: 'website' },
] as const;

export type KnowledgeSourceFormType = (typeof KNOWLEDGE_SOURCE_FORM_TYPES)[number]['value'];

export const KNOWLEDGE_SOURCE_TYPE_LABELS: Record<KnowledgeSourceType, string> = {
  telegram: 'Telegram Export',
  vk: 'VK',
  youtube: 'YouTube',
  pdf: 'PDF',
  docx: 'DOCX',
  html: 'HTML',
  website: 'Website',
  book: 'Book',
  zip: 'ZIP',
  audio: 'Audio',
  video: 'Video',
  manual: 'Manual',
};

export const KNOWLEDGE_IMPORT_STATUS_LABELS: Record<KnowledgeImportStatus, string> = {
  pending: 'Pending',
  parsing: 'Parsing',
  chunking: 'Chunking',
  embedding: 'Embedding',
  extracting: 'Extracting',
  completed: 'Completed',
  failed: 'Failed',
};

export const KNOWLEDGE_ITEM_TYPE_LABELS: Record<KnowledgeItemType, string> = {
  document: 'Document',
  section: 'Section',
  entity: 'Entity',
  insight: 'Insight',
};

export type KnowledgeSourceMetadata = {
  size_bytes?: number;
  filename?: string;
  mime_type?: string;
  format?: string;
};

export type KnowledgeSource = {
  id: string;
  organization_id: string;
  project_id: string | null;
  type: KnowledgeSourceType;
  title: string;
  source_uri: string | null;
  content_hash: string | null;
  status: KnowledgeImportStatus;
  metadata: KnowledgeSourceMetadata;
  error_message: string | null;
  items_count: number;
  chunks_count: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type KnowledgeItem = {
  id: string;
  organization_id: string;
  source_id: string;
  type: KnowledgeItemType;
  title: string;
  content: string | null;
  metadata: KnowledgeSourceMetadata;
  position: number | null;
  created_at: string;
  updated_at: string;
  chunks_count: number;
};

export type KnowledgeChunkPreview = {
  id: string;
  source_id: string;
  item_id: string;
  content: string;
  token_count: number | null;
  position: number;
  created_at: string;
};

export type KnowledgeStats = {
  totalSources: number;
  completedSources: number;
  processingSources: number;
  failedSources: number;
  totalDocuments: number;
  totalChunks: number;
};

export function mapFormTypeToDbType(formType: string): KnowledgeSourceType {
  if (formType === 'manual-md') {
    return 'manual';
  }

  if (KNOWLEDGE_SOURCE_TYPES.includes(formType as KnowledgeSourceType)) {
    return formType as KnowledgeSourceType;
  }

  return 'manual';
}

export function sourceTypesWithUrl(type: KnowledgeSourceType) {
  return type === 'website' || type === 'html' || type === 'youtube' || type === 'vk';
}

export function sourceTypesWithFile(type: KnowledgeSourceType) {
  return ['pdf', 'docx', 'zip', 'telegram', 'manual', 'book', 'audio', 'video'].includes(type);
}
