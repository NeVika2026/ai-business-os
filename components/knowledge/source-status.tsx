import type { KnowledgeImportStatus } from '@/types/knowledge';
import { KNOWLEDGE_IMPORT_STATUS_LABELS } from '@/types/knowledge';

const STATUS_STYLES: Record<KnowledgeImportStatus, string> = {
  pending: 'bg-[var(--accent-soft)] text-[var(--accent)]',
  parsing: 'bg-sky-500/15 text-sky-300',
  chunking: 'bg-indigo-500/15 text-indigo-300',
  embedding: 'bg-violet-500/15 text-violet-300',
  extracting: 'bg-purple-500/15 text-purple-300',
  completed: 'bg-emerald-500/15 text-emerald-300',
  failed: 'bg-red-500/15 text-red-300',
};

type SourceStatusBadgeProps = {
  status: KnowledgeImportStatus;
};

export function SourceStatusBadge({ status }: SourceStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {KNOWLEDGE_IMPORT_STATUS_LABELS[status]}
    </span>
  );
}
