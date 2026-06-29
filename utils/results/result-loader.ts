import type { SupabaseClient } from '@supabase/supabase-js';

import type { OrchestratorEvent } from '@/types/orchestrator';
import { mapRunToResult, type ResultData } from '@/utils/results/result-mappers';
import {
  mapOrchestratorEvents,
  mapOrchestratorRuns,
  RUN_SELECT,
} from '@/utils/orchestrator/runs';

function readProjectId(input: Record<string, unknown>): string | null {
  const projectId = input.project_id ?? input.projectId;

  return typeof projectId === 'string' && projectId.trim().length > 0 ? projectId.trim() : null;
}

async function loadProjectName(
  supabase: SupabaseClient,
  organizationId: string,
  projectId: string | null,
): Promise<string | null> {
  if (!projectId) {
    return null;
  }

  const { data } = await supabase
    .from('projects')
    .select('name')
    .eq('organization_id', organizationId)
    .eq('id', projectId)
    .maybeSingle();

  return typeof data?.name === 'string' ? data.name : null;
}

export async function loadResult(
  supabase: SupabaseClient,
  organizationId: string,
  resultId: string,
): Promise<ResultData | null> {
  const { data: runRow, error: runError } = await supabase
    .from('agent_runs')
    .select(RUN_SELECT)
    .eq('id', resultId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (runError) {
    throw runError;
  }

  if (!runRow) {
    return null;
  }

  const [run] = mapOrchestratorRuns([runRow]);
  const projectId = readProjectId(run.input);

  const [{ data: eventsData, error: eventsError }, projectName] = await Promise.all([
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
      .eq('correlation_id', resultId)
      .order('created_at', { ascending: true }),
    loadProjectName(supabase, organizationId, projectId),
  ]);

  if (eventsError) {
    throw eventsError;
  }

  const events = mapOrchestratorEvents((eventsData ?? []) as OrchestratorEvent[]);

  return mapRunToResult(run, events, projectName);
}
