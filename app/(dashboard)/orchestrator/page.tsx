import { redirect } from 'next/navigation';

import { RunsTable } from '@/components/orchestrator/runs-table';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import type { OrchestratorStats } from '@/types/orchestrator';
import {
  computeOrchestratorStats,
  mapOrchestratorRuns,
  RUN_SELECT,
} from '@/utils/orchestrator/runs';

const STAT_CARDS: { key: keyof OrchestratorStats; label: string }[] = [
  { key: 'totalRuns', label: 'Всего запусков' },
  { key: 'successfulRuns', label: 'Успешных' },
  { key: 'failedRuns', label: 'Ошибок' },
  { key: 'runningRuns', label: 'Выполняется' },
  { key: 'todayRuns', label: 'Сегодня' },
];

export default async function OrchestratorPage() {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    redirect('/login');
  }

  const { data, error } = await supabase
    .from('agent_runs')
    .select(RUN_SELECT)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const runs = mapOrchestratorRuns(data ?? []);
  const stats = computeOrchestratorStats(runs);
  const recentRuns = runs.slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Orchestrator</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Execution engine for AI employee task runs
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {STAT_CARDS.map((card) => (
          <article
            key={card.key}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4"
          >
            <p className="text-sm text-[var(--text-secondary)]">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
              {stats[card.key]}
            </p>
          </article>
        ))}
      </div>

      <RunsTable
        runs={recentRuns}
        title="Последние Agent Runs"
        description="Последние 10 запусков"
        showViewAll
      />
    </div>
  );
}
