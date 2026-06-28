import { redirect } from 'next/navigation';

import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import type { OrchestratorEvent, OrchestratorRun } from '@/types/orchestrator';
import {
  groupEventsByRunId,
  isOsaRun,
  OSA_RUN_ACTION,
  OSA_RUN_HISTORY_EVENT_SELECT,
  OSA_RUN_HISTORY_LIMIT,
} from '@/utils/osa/osa-runs';
import { mapOrchestratorEvents, mapOrchestratorRuns, RUN_SELECT } from '@/utils/orchestrator/runs';

export type OsaRunHistoryData = {
  runs: OrchestratorRun[];
  eventsByRunId: Record<string, OrchestratorEvent[]>;
};

export async function loadOsaRunHistory(): Promise<OsaRunHistoryData> {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    redirect('/login');
  }

  const { data: runRows, error: runsError } = await supabase
    .from('agent_runs')
    .select(RUN_SELECT)
    .eq('organization_id', organizationId)
    .filter('input->>action', 'eq', OSA_RUN_ACTION)
    .order('created_at', { ascending: false })
    .limit(OSA_RUN_HISTORY_LIMIT);

  if (runsError) {
    throw runsError;
  }

  const runs = mapOrchestratorRuns(runRows ?? []).filter(isOsaRun);
  const runIds = runs.map((run) => run.id);

  if (runIds.length === 0) {
    return { runs: [], eventsByRunId: {} };
  }

  const { data: eventRows, error: eventsError } = await supabase
    .from('events')
    .select(OSA_RUN_HISTORY_EVENT_SELECT)
    .eq('organization_id', organizationId)
    .in('correlation_id', runIds)
    .order('created_at', { ascending: true });

  if (eventsError) {
    throw eventsError;
  }

  return {
    runs,
    eventsByRunId: groupEventsByRunId(mapOrchestratorEvents(eventRows ?? [])),
  };
}
