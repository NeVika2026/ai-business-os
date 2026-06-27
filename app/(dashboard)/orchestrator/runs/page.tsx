import { redirect } from 'next/navigation';

import { RunsTable } from '@/components/orchestrator/runs-table';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { mapOrchestratorRuns, RUN_SELECT } from '@/utils/orchestrator/runs';

export default async function OrchestratorRunsPage() {
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Agent Runs</h1>
        <p className="text-sm text-[var(--text-secondary)]">Полная история запусков</p>
      </div>
      <RunsTable runs={runs} />
    </div>
  );
}
