import type { SupabaseClient } from '@supabase/supabase-js';

import { resolveActiveProject } from '@/lib/project-runtime/active-project';
import { resolveProjectRuntimeScope } from '@/lib/project-runtime/scope';
import { loadCabinetRawSnapshot } from '@/utils/cabinet/load-dashboard';
import {
  buildConciergeFromSnapshot,
  createEmptyConcierge,
  type ConciergeData,
} from '@/utils/home/concierge-mappers';
import { loadHomeUserContext } from '@/utils/home/home-loader';
import { loadOsaWorkspacePageData } from '@/utils/workspace/workspace-loader';

import {
  buildMissionControlData,
  resolveMissionControlProjectId,
} from './mission-control-mappers';
import type { MissionControlData } from './mission-control-types';

export type MissionControlLoadResult =
  | { status: 'ok'; data: MissionControlData }
  | { status: 'fallback' }
  | { status: 'unauthorized' };

export async function loadMissionControlData(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<MissionControlData | null> {
  const context = await loadHomeUserContext(supabase);

  if (!context) {
    return null;
  }

  try {
    const snapshot = await loadCabinetRawSnapshot(supabase, organizationId, context.email);
    const concierge = buildConciergeFromSnapshot(snapshot, context);
    const scope = resolveProjectRuntimeScope(snapshot, context);
    const activeRuntime = resolveActiveProject(scope);
    const projectId = resolveMissionControlProjectId(activeRuntime, snapshot);

    let workspace = null;

    if (projectId) {
      workspace = await loadOsaWorkspacePageData(supabase, organizationId, projectId);
    }

    return buildMissionControlData({ concierge, snapshot, workspace, context });
  } catch {
    const concierge = createEmptyConcierge(context);

    return buildMissionControlData({
      concierge,
      snapshot: createFallbackSnapshot(context, organizationId),
      workspace: null,
      context,
    });
  }
}

function createFallbackSnapshot(
  context: NonNullable<Awaited<ReturnType<typeof loadHomeUserContext>>>,
  organizationId: string,
): Parameters<typeof buildMissionControlData>[0]['snapshot'] {
  return {
    runs: [],
    events: [],
    organization: {
      id: organizationId,
      name: context.organizationName,
      settings: {},
      created_at: new Date().toISOString(),
    },
    projects: [],
    projectCount: 0,
    workspaceCount: 0,
    agentCount: 0,
    documentCount: 0,
    knowledgeSourceCount: 0,
    crmLeadCount: 0,
    memoryCount: 0,
    health: {
      database: 'healthy',
      gateway: 'healthy',
      runtime: 'healthy',
      memory: 'healthy',
      knowledge: 'healthy',
      automation: 'healthy',
    },
    userEmail: context.email,
  };
}

export async function loadMissionControlPageData(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<MissionControlLoadResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: 'unauthorized' };
  }

  const data = await loadMissionControlData(supabase, organizationId);

  if (!data) {
    return { status: 'fallback' };
  }

  return { status: 'ok', data };
}

export type { ConciergeData, MissionControlData };
