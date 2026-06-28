import type { SupabaseClient } from '@supabase/supabase-js';

import { checkAllProvidersHealth } from '@/services/runtime/gateway/health';
import type { OrchestratorEvent, OrchestratorRun } from '@/types/orchestrator';
import {
  buildCabinetDashboardFromSnapshot,
  createEmptyCabinetDashboard,
  type CabinetDashboardData,
  type CabinetOrganizationRow,
  type CabinetProjectRow,
  type CabinetRawSnapshot,
  type HealthDisplayStatus,
  type SystemHealthSnapshot,
} from '@/utils/cabinet/dashboard-mappers';
import { mapOrchestratorEvents, mapOrchestratorRuns, RUN_SELECT } from '@/utils/orchestrator/runs';

const EVENT_SELECT = `
  id,
  organization_id,
  type,
  source,
  actor_type,
  actor_id,
  payload,
  metadata,
  correlation_id,
  created_at
`;

const RUN_FETCH_LIMIT = 250;
const EVENT_FETCH_LIMIT = 120;

async function countRows(
  supabase: SupabaseClient,
  table:
    | 'projects'
    | 'ai_employees'
    | 'knowledge_sources'
    | 'crm_leads'
    | 'agent_memories'
    | 'knowledge_items',
  organizationId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

async function probeDatabaseHealth(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<HealthDisplayStatus> {
  try {
    const { error } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', organizationId)
      .maybeSingle();

    if (error) {
      return 'offline';
    }

    return 'healthy';
  } catch {
    return 'unknown';
  }
}

async function probeGatewayHealth(): Promise<HealthDisplayStatus> {
  try {
    const results = await checkAllProvidersHealth();

    if (results.length === 0) {
      return 'unknown';
    }

    if (results.every((entry) => entry.ok)) {
      return 'healthy';
    }

    if (results.some((entry) => entry.ok)) {
      return 'warning';
    }

    return 'offline';
  } catch {
    return 'unknown';
  }
}

function deriveRuntimeHealth(runs: OrchestratorRun[]): HealthDisplayStatus {
  if (runs.length === 0) {
    return 'unknown';
  }

  const runtimeRuns = runs.filter(
    (run) =>
      run.input.runtime_bridge_enabled === true || run.output?.runtime_bridge_enabled === true,
  );

  if (runtimeRuns.length === 0) {
    return 'unknown';
  }

  if (runtimeRuns.some((run) => run.status === 'running' || run.status === 'pending')) {
    return 'healthy';
  }

  if (runtimeRuns.some((run) => run.status === 'completed')) {
    return 'healthy';
  }

  if (runtimeRuns.some((run) => run.status === 'failed')) {
    return 'warning';
  }

  return 'unknown';
}

function deriveMemoryHealth(memoryCount: number): HealthDisplayStatus {
  if (memoryCount > 0) {
    return 'healthy';
  }

  return 'unknown';
}

function deriveKnowledgeHealth(sourceCount: number, failedSources: number): HealthDisplayStatus {
  if (sourceCount === 0) {
    return 'unknown';
  }

  if (failedSources > 0) {
    return 'warning';
  }

  return 'healthy';
}

function deriveAutomationHealth(runs: OrchestratorRun[]): HealthDisplayStatus {
  if (runs.length === 0) {
    return 'unknown';
  }

  if (runs.some((run) => run.status === 'running' || run.status === 'pending')) {
    return 'healthy';
  }

  return runs.some((run) => run.status === 'completed') ? 'healthy' : 'warning';
}

async function resolveSystemHealth(
  supabase: SupabaseClient,
  organizationId: string,
  runs: OrchestratorRun[],
  memoryCount: number,
  knowledgeSourceCount: number,
  failedKnowledgeSources: number,
): Promise<SystemHealthSnapshot> {
  const [database, gateway] = await Promise.all([
    probeDatabaseHealth(supabase, organizationId),
    probeGatewayHealth(),
  ]);

  return {
    database,
    gateway,
    runtime: deriveRuntimeHealth(runs),
    memory: deriveMemoryHealth(memoryCount),
    knowledge: deriveKnowledgeHealth(knowledgeSourceCount, failedKnowledgeSources),
    automation: deriveAutomationHealth(runs),
  };
}

export async function loadCabinetRawSnapshot(
  supabase: SupabaseClient,
  organizationId: string,
  userEmail: string,
): Promise<CabinetRawSnapshot> {
  const [
    runsResult,
    eventsResult,
    organizationResult,
    projectsResult,
    projectCount,
    agentCount,
    documentCount,
    knowledgeSourceCount,
    crmLeadCount,
    memoryCount,
    knowledgeSourcesResult,
  ] = await Promise.all([
    supabase
      .from('agent_runs')
      .select(RUN_SELECT)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(RUN_FETCH_LIMIT),
    supabase
      .from('events')
      .select(EVENT_SELECT)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(EVENT_FETCH_LIMIT),
    supabase
      .from('organizations')
      .select('id, name, settings, created_at')
      .eq('id', organizationId)
      .maybeSingle(),
    supabase
      .from('projects')
      .select('id, name, status, project_type, created_at, updated_at')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })
      .limit(5),
    countRows(supabase, 'projects', organizationId),
    countRows(supabase, 'ai_employees', organizationId),
    countRows(supabase, 'knowledge_items', organizationId),
    countRows(supabase, 'knowledge_sources', organizationId),
    countRows(supabase, 'crm_leads', organizationId),
    countRows(supabase, 'agent_memories', organizationId),
    supabase.from('knowledge_sources').select('status').eq('organization_id', organizationId),
  ]);

  if (runsResult.error) {
    throw runsResult.error;
  }

  if (eventsResult.error) {
    throw eventsResult.error;
  }

  if (organizationResult.error) {
    throw organizationResult.error;
  }

  if (projectsResult.error) {
    throw projectsResult.error;
  }

  const runs = mapOrchestratorRuns(
    (runsResult.data ?? []) as Parameters<typeof mapOrchestratorRuns>[0],
  );
  const events = mapOrchestratorEvents((eventsResult.data ?? []) as OrchestratorEvent[]);
  const projects = (projectsResult.data ?? []) as CabinetProjectRow[];
  const organization = (organizationResult.data as CabinetOrganizationRow | null) ?? null;
  const failedKnowledgeSources =
    knowledgeSourcesResult.data?.filter((source) => source.status === 'failed').length ?? 0;
  const workspaceCount = Math.max(projectCount, organization ? 1 : 0);

  const health = await resolveSystemHealth(
    supabase,
    organizationId,
    runs,
    memoryCount,
    knowledgeSourceCount,
    failedKnowledgeSources,
  );

  return {
    runs,
    events,
    organization,
    projects,
    projectCount,
    workspaceCount,
    agentCount,
    documentCount,
    knowledgeSourceCount,
    crmLeadCount,
    memoryCount,
    health,
    userEmail,
  };
}

export async function loadCabinetDashboard(
  supabase: SupabaseClient,
  organizationId: string,
  userEmail: string,
): Promise<CabinetDashboardData> {
  try {
    const snapshot = await loadCabinetRawSnapshot(supabase, organizationId, userEmail);

    return buildCabinetDashboardFromSnapshot(snapshot);
  } catch {
    return createEmptyCabinetDashboard(userEmail);
  }
}

export async function loadCabinetExecutionHistory(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<OrchestratorRun[]> {
  const { data, error } = await supabase
    .from('agent_runs')
    .select(RUN_SELECT)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(RUN_FETCH_LIMIT);

  if (error) {
    throw error;
  }

  return mapOrchestratorRuns((data ?? []) as Parameters<typeof mapOrchestratorRuns>[0]);
}
