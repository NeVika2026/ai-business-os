import type { SupabaseClient } from '@supabase/supabase-js';

import type { OrchestratorEvent } from '@/types/orchestrator';
import {
  buildProjectListData,
  buildProjectWorkspaceFromSnapshot,
  createEmptyProjectList,
  filterProjectRuns,
} from '@/utils/projects/project-mappers';
import type {
  ProjectKnowledgeItemRow,
  ProjectKnowledgeSourceRow,
  ProjectListData,
  ProjectMemberRow,
  ProjectRawRow,
  ProjectRawSnapshot,
  ProjectWorkspaceData,
} from '@/utils/projects/project-types';
import { mapOrchestratorEvents, mapOrchestratorRuns, RUN_SELECT } from '@/utils/orchestrator/runs';

export const PROJECT_SELECT = `
  id,
  organization_id,
  name,
  description,
  project_type,
  status,
  icon,
  color,
  created_by,
  updated_by,
  created_at,
  updated_at
`;

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

const KNOWLEDGE_SOURCE_SELECT = `
  id,
  name,
  source_type,
  status,
  project_id,
  created_at,
  updated_at
`;

const KNOWLEDGE_ITEM_SELECT = `
  id,
  title,
  item_type,
  status,
  project_id,
  source_id,
  created_at
`;

const RUN_FETCH_LIMIT = 200;
const EVENT_FETCH_LIMIT = 120;

async function countRowsForProject(
  supabase: SupabaseClient,
  table: 'knowledge_items' | 'agent_memories' | 'crm_leads',
  organizationId: string,
  projectId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('project_id', projectId);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

async function loadProjectCounts(
  supabase: SupabaseClient,
  organizationId: string,
  projectIds: string[],
): Promise<{
  documentCounts: Record<string, number>;
}> {
  if (projectIds.length === 0) {
    return { documentCounts: {} };
  }

  const { data, error } = await supabase
    .from('knowledge_items')
    .select('project_id')
    .eq('organization_id', organizationId)
    .in('project_id', projectIds);

  if (error) {
    return { documentCounts: {} };
  }

  const documentCounts = (data ?? []).reduce<Record<string, number>>((acc, row) => {
    if (typeof row.project_id === 'string') {
      acc[row.project_id] = (acc[row.project_id] ?? 0) + 1;
    }

    return acc;
  }, {});

  return { documentCounts };
}

function countRunsByProject(
  runs: ReturnType<typeof mapOrchestratorRuns>,
  projectIds: string[],
  employeesByProject: Record<string, string[]>,
  tasksByProject: Record<string, string[]>,
): Record<string, number> {
  const counts = Object.fromEntries(projectIds.map((id) => [id, 0]));

  for (const projectId of projectIds) {
    const projectRuns = filterProjectRuns(
      runs,
      projectId,
      employeesByProject[projectId] ?? [],
      tasksByProject[projectId] ?? [],
    );

    counts[projectId] = projectRuns.length;
  }

  return counts;
}

export async function loadProjectList(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<ProjectListData> {
  try {
    const [projectsResult, runsResult, employeesResult, tasksResult] = await Promise.all([
      supabase
        .from('projects')
        .select(PROJECT_SELECT)
        .eq('organization_id', organizationId)
        .order('updated_at', { ascending: false }),
      supabase
        .from('agent_runs')
        .select(RUN_SELECT)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(RUN_FETCH_LIMIT),
      supabase
        .from('ai_employees')
        .select('id, project_id')
        .eq('organization_id', organizationId)
        .not('project_id', 'is', null),
      supabase.from('tasks').select('id, project_id').eq('organization_id', organizationId),
    ]);

    if (projectsResult.error) {
      throw projectsResult.error;
    }

    if (runsResult.error) {
      throw runsResult.error;
    }

    const rows = (projectsResult.data ?? []) as ProjectRawRow[];
    const projectIds = rows.map((row) => row.id);
    const runs = mapOrchestratorRuns(
      (runsResult.data ?? []) as Parameters<typeof mapOrchestratorRuns>[0],
    );

    const employeesByProject = (employeesResult.data ?? []).reduce<Record<string, string[]>>(
      (acc, row) => {
        if (typeof row.project_id !== 'string') {
          return acc;
        }

        acc[row.project_id] = [...(acc[row.project_id] ?? []), row.id];
        return acc;
      },
      {},
    );

    const tasksByProject = (tasksResult.data ?? []).reduce<Record<string, string[]>>((acc, row) => {
      if (typeof row.project_id !== 'string') {
        return acc;
      }

      acc[row.project_id] = [...(acc[row.project_id] ?? []), row.id];
      return acc;
    }, {});

    const [{ documentCounts }] = await Promise.all([
      loadProjectCounts(supabase, organizationId, projectIds),
    ]);

    const runCounts = countRunsByProject(runs, projectIds, employeesByProject, tasksByProject);

    return buildProjectListData(rows, runCounts, documentCounts);
  } catch {
    return createEmptyProjectList();
  }
}

export async function loadProjectRawSnapshot(
  supabase: SupabaseClient,
  organizationId: string,
  projectId: string,
): Promise<ProjectRawSnapshot | null> {
  const [
    projectResult,
    employeesResult,
    tasksResult,
    knowledgeSourcesResult,
    knowledgeItemsResult,
    crmLeadCount,
    memoryCount,
    agentCountResult,
    membersResult,
    runsResult,
    eventsResult,
  ] = await Promise.all([
    supabase
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('organization_id', organizationId)
      .eq('id', projectId)
      .maybeSingle(),
    supabase
      .from('ai_employees')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('project_id', projectId),
    supabase
      .from('tasks')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('project_id', projectId),
    supabase
      .from('knowledge_sources')
      .select(KNOWLEDGE_SOURCE_SELECT)
      .eq('organization_id', organizationId)
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false })
      .limit(12),
    supabase
      .from('knowledge_items')
      .select(KNOWLEDGE_ITEM_SELECT)
      .eq('organization_id', organizationId)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(12),
    countRowsForProject(supabase, 'crm_leads', organizationId, projectId),
    countRowsForProject(supabase, 'agent_memories', organizationId, projectId),
    supabase
      .from('ai_employees')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('project_id', projectId),
    supabase
      .from('organization_members')
      .select(
        `
          user_id,
          role,
          profile:user_id (
            full_name
          )
        `,
      )
      .eq('organization_id', organizationId),
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
  ]);

  if (projectResult.error) {
    throw projectResult.error;
  }

  if (!projectResult.data) {
    return null;
  }

  if (runsResult.error) {
    throw runsResult.error;
  }

  if (eventsResult.error) {
    throw eventsResult.error;
  }

  if (knowledgeSourcesResult.error) {
    throw knowledgeSourcesResult.error;
  }

  if (knowledgeItemsResult.error) {
    throw knowledgeItemsResult.error;
  }

  return {
    project: projectResult.data as ProjectRawRow,
    employeeIds: (employeesResult.data ?? []).map((row) => row.id),
    taskIds: (tasksResult.data ?? []).map((row) => row.id),
    runs: mapOrchestratorRuns((runsResult.data ?? []) as Parameters<typeof mapOrchestratorRuns>[0]),
    events: mapOrchestratorEvents((eventsResult.data ?? []) as OrchestratorEvent[]),
    knowledgeSources: (knowledgeSourcesResult.data ?? []) as ProjectKnowledgeSourceRow[],
    knowledgeItems: (knowledgeItemsResult.data ?? []) as ProjectKnowledgeItemRow[],
    crmLeadCount,
    memoryCount,
    agentCount: agentCountResult.count ?? 0,
    members: (membersResult.data ?? []) as ProjectMemberRow[],
  };
}

export async function loadProjectWorkspace(
  supabase: SupabaseClient,
  organizationId: string,
  projectId: string,
): Promise<ProjectWorkspaceData | null> {
  const snapshot = await loadProjectRawSnapshot(supabase, organizationId, projectId);

  if (!snapshot) {
    return null;
  }

  return buildProjectWorkspaceFromSnapshot(snapshot);
}
