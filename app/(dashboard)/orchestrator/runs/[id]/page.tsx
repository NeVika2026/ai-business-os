import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { RunSummary } from '@/components/orchestrator/run-summary';
import { RunTimeline } from '@/components/orchestrator/run-timeline';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import type { OrchestratorKnowledgeSource } from '@/types/orchestrator';
import {
  formatDateTime,
  mapMemorySnapshots,
  mapOrchestratorEvents,
  mapOrchestratorRuns,
  RUN_SELECT,
} from '@/utils/orchestrator/runs';

type RunDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RunDetailPage({ params }: RunDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    redirect('/login');
  }

  const { data: runRow, error: runError } = await supabase
    .from('agent_runs')
    .select(RUN_SELECT)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (runError) {
    throw runError;
  }

  if (!runRow) {
    notFound();
  }

  const [run] = mapOrchestratorRuns([runRow]);

  const [
    { data: eventsData, error: eventsError },
    { data: memoriesData, error: memoriesError },
    { data: sourcesData, error: sourcesError },
  ] = await Promise.all([
    supabase
      .from('events')
      .select(
        `
        id,
        organization_id,
        type,
        source,
        actor_type,
        actor_id,
        payload,
        correlation_id,
        created_at
      `,
      )
      .eq('organization_id', organizationId)
      .eq('correlation_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('agent_memories')
      .select('id, scope, content, importance, created_at')
      .eq('organization_id', organizationId)
      .eq('ai_employee_id', run.ai_employee_id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('knowledge_sources')
      .select('id, title, type, status, items_count, chunks_count')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  if (eventsError) {
    throw eventsError;
  }

  if (memoriesError) {
    throw memoriesError;
  }

  if (sourcesError) {
    throw sourcesError;
  }

  const events = mapOrchestratorEvents(eventsData ?? []);
  const memories = mapMemorySnapshots(memoriesData ?? []);
  const sources = (sourcesData ?? []) as OrchestratorKnowledgeSource[];

  return (
    <div className="space-y-8">
      <Link
        href="/orchestrator"
        className="text-sm text-[var(--accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        ← Orchestrator
      </Link>

      <RunSummary run={run} />
      <RunTimeline events={events} />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Memory Snapshot</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Existing memories for {run.employee?.name ?? 'this employee'}
          </p>
        </div>

        {memories.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
            Записей памяти нет.
          </div>
        ) : (
          <div className="space-y-3">
            {memories.map((memory) => (
              <article
                key={memory.id}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-4"
              >
                <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
                  <span>Scope: {memory.scope}</span>
                  <span>Importance: {memory.importance.toFixed(2)}</span>
                  <span>{formatDateTime(memory.created_at)}</span>
                </div>
                <p className="text-sm text-[var(--text-primary)]">{memory.content}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Knowledge Sources</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Available knowledge in organization
          </p>
        </div>

        {sources.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
            Источники знаний не найдены.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)]">
            <table className="min-w-full divide-y divide-[var(--border-subtle)] text-sm">
              <thead className="bg-[var(--surface-1)]">
                <tr>
                  {['Title', 'Type', 'Status', 'Documents', 'Chunks'].map((heading) => (
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
                {sources.map((source) => (
                  <tr key={source.id} className="hover:bg-[var(--surface-1)]">
                    <td className="px-4 py-3">
                      <Link
                        href={`/knowledge/sources/${source.id}`}
                        className="font-medium text-[var(--accent)] hover:underline"
                      >
                        {source.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{source.type}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{source.status}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{source.items_count}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {source.chunks_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
