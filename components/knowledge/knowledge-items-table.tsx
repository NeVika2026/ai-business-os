import { SourceStatusBadge } from '@/components/knowledge/source-status';
import type { KnowledgeImportStatus, KnowledgeItem } from '@/types/knowledge';
import { KNOWLEDGE_ITEM_TYPE_LABELS } from '@/types/knowledge';
import { formatBytes, getMetadataSize } from '@/utils/knowledge/sources';

type KnowledgeItemsTableProps = {
  items: KnowledgeItem[];
  sourceStatus: KnowledgeImportStatus;
};

export function KnowledgeItemsTable({ items, sourceStatus }: KnowledgeItemsTableProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Документы</h2>
        <p className="text-sm text-[var(--text-secondary)]">Knowledge items for this source</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)]">
        <table className="min-w-full divide-y divide-[var(--border-subtle)] text-sm">
          <thead className="bg-[var(--surface-1)]">
            <tr>
              {['Название', 'Тип', 'Размер', 'Статус', 'Количество чанков'].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--surface-0)]">
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-secondary)]">
                  Документы появятся после обработки источника.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--surface-1)]">
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{item.title}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {KNOWLEDGE_ITEM_TYPE_LABELS[item.type]}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {formatBytes(getMetadataSize(item.metadata))}
                  </td>
                  <td className="px-4 py-3">
                    <SourceStatusBadge status={sourceStatus} />
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{item.chunks_count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
