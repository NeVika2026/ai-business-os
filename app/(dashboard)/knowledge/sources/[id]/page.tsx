import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { KnowledgeItemsTable } from '@/components/knowledge/knowledge-items-table';
import { SourceStatusBadge } from '@/components/knowledge/source-status';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { mapKnowledgeItems, SOURCE_SELECT } from '@/utils/knowledge/sources';
import type { KnowledgeSource } from '@/types/knowledge';

type SourceDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SourceDetailPage({ params }: SourceDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    redirect('/login');
  }

  const [sourceResult, itemsResult, chunksResult] = await Promise.all([
    supabase
      .from('knowledge_sources')
      .select(SOURCE_SELECT)
      .eq('organization_id', organizationId)
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('knowledge_items')
      .select(
        'id, organization_id, source_id, type, title, content, metadata, position, created_at, updated_at',
      )
      .eq('organization_id', organizationId)
      .eq('source_id', id)
      .order('position', { ascending: true }),
    supabase
      .from('knowledge_chunks')
      .select('item_id')
      .eq('organization_id', organizationId)
      .eq('source_id', id),
  ]);

  if (sourceResult.error) {
    throw sourceResult.error;
  }

  if (!sourceResult.data) {
    notFound();
  }

  if (itemsResult.error) {
    throw itemsResult.error;
  }

  if (chunksResult.error) {
    throw chunksResult.error;
  }

  const source = {
    ...sourceResult.data,
    metadata: sourceResult.data.metadata ?? {},
  } as KnowledgeSource;

  const items = mapKnowledgeItems(
    (itemsResult.data ?? []) as Parameters<typeof mapKnowledgeItems>[0],
    chunksResult.data ?? [],
  );

  return (
    <main className="space-y-6">
      <div>
        <Link href="/knowledge" className="text-sm text-[var(--accent)] hover:underline">
          ← База знаний
        </Link>
      </div>

      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
              Источник
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
              {source.title}
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {String(source.metadata.filename ?? source.source_uri ?? 'Без имени файла')}
            </p>
          </div>
          <SourceStatusBadge status={source.status} />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Metric label="Документов" value={source.items_count} />
          <Metric label="Чанков" value={source.chunks_count} />
          <Metric
            label="Размер"
            value={
              typeof source.metadata.size_bytes === 'number'
                ? Math.max(1, Math.round(source.metadata.size_bytes / 1024)) + ' КБ'
                : '—'
            }
          />
        </div>

        {source.error_message ? (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm font-semibold text-red-200">Ошибка обработки</p>
            <p className="mt-1 text-sm text-red-200/80">{source.error_message}</p>
          </div>
        ) : null}
      </section>

      <KnowledgeItemsTable items={items} sourceStatus={source.status} />
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-4">
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
