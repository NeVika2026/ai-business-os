'use client';

import Link from 'next/link';
import { useState } from 'react';

import { DeleteSourceDialog } from '@/components/knowledge/delete-source-dialog';
import { SourceForm } from '@/components/knowledge/source-form';
import { SourceStatusBadge } from '@/components/knowledge/source-status';
import type { KnowledgeSource } from '@/types/knowledge';
import { KNOWLEDGE_SOURCE_TYPE_LABELS } from '@/types/knowledge';
import { formatBytes, getMetadataSize } from '@/utils/knowledge/sources';

type SourceTableProps = {
  sources: KnowledgeSource[];
  showHeader?: boolean;
};

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function SourceTable({ sources, showHeader = true }: SourceTableProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedSource, setSelectedSource] = useState<KnowledgeSource | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<KnowledgeSource | null>(null);

  function openCreateForm() {
    setFormMode('create');
    setSelectedSource(null);
    setFormOpen(true);
  }

  function openEditForm(source: KnowledgeSource) {
    setFormMode('edit');
    setSelectedSource(source);
    setFormOpen(true);
  }

  function openDeleteDialog(source: KnowledgeSource) {
    setSourceToDelete(source);
    setDeleteOpen(true);
  }

  return (
    <section className="space-y-4">
      {showHeader ? (
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Knowledge Hub</h1>
            <p className="text-sm text-[var(--text-secondary)]">Sources</p>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            aria-label="Create new knowledge source"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            + Новый источник
          </button>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={openCreateForm}
            aria-label="Create new knowledge source"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            + Новый источник
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)]">
        <table className="min-w-full divide-y divide-[var(--border-subtle)] text-sm">
          <thead className="bg-[var(--surface-1)]">
            <tr>
              {[
                'Название',
                'Тип',
                'Статус',
                'Размер',
                'Документов',
                'Чанков',
                'Создан',
                'Действия',
              ].map((heading) => (
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
            {sources.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[var(--text-secondary)]">
                  Источников пока нет. Создайте первый источник знаний.
                </td>
              </tr>
            ) : (
              sources.map((source) => (
                <tr key={source.id} className="hover:bg-[var(--surface-1)]">
                  <td className="px-4 py-3">
                    <Link
                      href={`/knowledge/sources/${source.id}`}
                      className="font-medium text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    >
                      {source.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {KNOWLEDGE_SOURCE_TYPE_LABELS[source.type]}
                  </td>
                  <td className="px-4 py-3">
                    <SourceStatusBadge status={source.status} />
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {formatBytes(getMetadataSize(source.metadata))}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{source.items_count}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{source.chunks_count}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {formatCreatedAt(source.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        aria-label={`Edit source ${source.title}`}
                        onClick={() => openEditForm(source)}
                        className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                      >
                        Редактировать
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete source ${source.title}`}
                        onClick={() => openDeleteDialog(source)}
                        className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <SourceForm
        key={selectedSource?.id ?? 'create'}
        open={formOpen}
        mode={formMode}
        source={selectedSource}
        onClose={() => setFormOpen(false)}
      />

      <DeleteSourceDialog
        open={deleteOpen}
        source={sourceToDelete}
        onClose={() => {
          setDeleteOpen(false);
          setSourceToDelete(null);
        }}
      />
    </section>
  );
}
