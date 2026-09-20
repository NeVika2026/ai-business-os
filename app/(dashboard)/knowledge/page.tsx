import { redirect } from 'next/navigation';

import { KnowledgeAutoImport } from '@/components/knowledge/knowledge-auto-import';
import { KnowledgeStats } from '@/components/knowledge/knowledge-stats';
import { SourceTable } from '@/components/knowledge/source-table';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import {
  computeKnowledgeStats,
  mapKnowledgeSources,
  SOURCE_SELECT,
} from '@/utils/knowledge/sources';

type KnowledgePageProps = {
  searchParams: Promise<{ project?: string }>;
};

export default async function KnowledgePage({ searchParams }: KnowledgePageProps) {
  const { project } = await searchParams;
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    redirect('/login');
  }

  let query = supabase
    .from('knowledge_sources')
    .select(SOURCE_SELECT)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (project) {
    query = query.eq('project_id', project);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const sources = mapKnowledgeSources((data ?? []) as Parameters<typeof mapKnowledgeSources>[0]);
  const stats = computeKnowledgeStats(sources);

  return (
    <main className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
          Бизнес-завод
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">База знаний</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
          Загружайте материалы пачкой. После обработки OSA сможет использовать их при выполнении
          задач.
        </p>
      </header>

      <KnowledgeAutoImport projectId={project ?? null} />
      <KnowledgeStats stats={stats} />
      <SourceTable sources={sources} />
    </main>
  );
}
