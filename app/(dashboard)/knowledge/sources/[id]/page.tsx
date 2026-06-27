import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { KnowledgeItemsTable } from '@/components/knowledge/knowledge-items-table';
import { SourceStatusBadge } from '@/components/knowledge/source-status';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import {
  formatBytes,
  getMetadataSize,
  mapKnowledgeChunks,
  mapKnowledgeItems,
  mapKnowledgeSources,
  SOURCE_SELECT,
} from '@/utils/knowledge/sources';
import { KNOWLEDGE_SOURCE_TYPE_LABELS } from '@/types/knowledge';

type SourceDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default async function SourceDetailPage({ params }: SourceDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    redirect('/login');
  }

  const { data: sourceRow, error: sourceError } = await supabase
    .from('knowledge_sources')
    .select(SOURCE_SELECT)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (sourceError) {
    throw sourceError;
  }

  if (!sourceRow) {
    notFound();
  }

  const [source] = mapKnowledgeSources([sourceRow]);

  const [{ data: itemRows, error: itemsError }, { data: chunkRows, error: chunksError }] =
    await Promise.all([
      supabase
        .from('knowledge_items')
        .select(
          `
          id,
          organization_id,
          source_id,
          type,
          title,
          content,
          metadata,
          position,
          created_at,
          updated_at
        `,
        )
        .eq('source_id', id)
        .eq('organization_id', organizationId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase
        .from('knowledge_chunks')
        .select('id, source_id, item_id, content, token_count, position, created_at')
        .eq('source_id', id)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

  if (itemsError) {
    throw itemsError;
  }

  if (chunksError) {
    throw chunksError;
  }

  const { data: itemChunkRows, error: itemChunksError } = await supabase
    .from('knowledge_chunks')
    .select('item_id')
    .eq('source_id', id)
    .eq('organization_id', organizationId);

  if (itemChunksError) {
    throw itemChunksError;
  }

  const items = mapKnowledgeItems(itemRows ?? [], itemChunkRows ?? []);
  const recentChunks = mapKnowledgeChunks(chunkRows ?? []);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link
          href="/knowledge"
          className="text-sm text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          ← Knowledge Hub
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{source.title}</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {KNOWLEDGE_SOURCE_TYPE_LABELS[source.type]}
            </p>
          </div>
          <SourceStatusBadge status={source.status} />
        </div>
      </div>

      <section className="grid gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Создан</p>
          <p className="mt-1 text-[var(--text-primary)]">{formatDateTime(source.created_at)}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Обновлён</p>
          <p className="mt-1 text-[var(--text-primary)]">{formatDateTime(source.updated_at)}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Завершён</p>
          <p className="mt-1 text-[var(--text-primary)]">{formatDateTime(source.completed_at)}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Документов</p>
          <p className="mt-1 text-[var(--text-primary)]">{source.items_count}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Чанков</p>
          <p className="mt-1 text-[var(--text-primary)]">{source.chunks_count}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Размер</p>
          <p className="mt-1 text-[var(--text-primary)]">
            {formatBytes(getMetadataSize(source.metadata))}
          </p>
        </div>
        {source.source_uri ? (
          <div className="sm:col-span-2">
            <p className="text-sm text-[var(--text-secondary)]">URL</p>
            <a
              href={source.source_uri}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block break-all text-[var(--accent)] hover:underline"
            >
              {source.source_uri}
            </a>
          </div>
        ) : null}
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Content hash</p>
          <p className="mt-1 font-mono text-xs text-[var(--text-primary)]">
            {source.content_hash ?? '—'}
          </p>
        </div>
        {source.error_message ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-sm text-[var(--text-secondary)]">Ошибка</p>
            <p className="mt-1 text-sm text-red-300">{source.error_message}</p>
          </div>
        ) : null}
      </section>

      <KnowledgeItemsTable items={items} sourceStatus={source.status} />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Последние чанки</h2>
          <p className="text-sm text-[var(--text-secondary)]">Последние 20 чанков источника</p>
        </div>

        {recentChunks.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
            Чанки появятся после обработки источника.
          </div>
        ) : (
          <div className="space-y-3">
            {recentChunks.map((chunk) => (
              <article
                key={chunk.id}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-4"
              >
                <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
                  <span>Позиция: {chunk.position}</span>
                  {chunk.token_count !== null ? <span>Токены: {chunk.token_count}</span> : null}
                  <span>{formatDateTime(chunk.created_at)}</span>
                </div>
                <p className="line-clamp-4 whitespace-pre-wrap text-sm text-[var(--text-primary)]">
                  {chunk.content}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
