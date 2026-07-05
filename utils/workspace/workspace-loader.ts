import type { SupabaseClient } from '@supabase/supabase-js';

import { getLastExecutiveDecision } from '@/lib/executive/executive-engine';
import { goalLabel } from '@/lib/executive/executive-goals';
import { setActiveProject } from '@/lib/project-runtime/active-project';
import { findProjectRuntime } from '@/lib/project-runtime/project-runtime-engine';
import { syncProjectRuntimesFromSnapshot } from '@/lib/project-runtime/project-runtime-sync';
import { buildProjectTodayBriefing } from '@/lib/project-runtime/today-briefing';
import { loadProjectLifecycleSnapshot } from '@/lib/storage/project-lifecycle-storage';
import { loadAiOrchestraState } from '@/lib/storage/ai-orchestra-storage';
import { getRuntimeStorage } from '@/lib/storage/storage-factory';
import { loadCabinetRawSnapshot } from '@/utils/cabinet/load-dashboard';
import { loadHomeUserContext } from '@/utils/home/home-loader';
import { getNextBestStepContent } from '@/utils/navigator/default-next-steps';
import { loadProjectWorkspace } from '@/utils/projects/project-loader';
import { PROJECT_STATUS_LABELS } from '@/utils/projects/project-types';

import { buildWorkspaceTimeline } from './workspace-timeline';
import { buildMorningBriefing } from './morning-briefing';
import type { OsaWorkspacePageData } from './workspace-types';
import { publishRuntimeEvent } from '@/lib/events/event-runtime';
import { RUNTIME_EVENT_TYPES } from '@/types/event-runtime';

export async function loadOsaWorkspacePageData(
  supabase: SupabaseClient,
  organizationId: string,
  projectId: string,
): Promise<OsaWorkspacePageData | null> {
  const workspace = await loadProjectWorkspace(supabase, organizationId, projectId);

  if (!workspace) {
    return null;
  }

  const context = await loadHomeUserContext(supabase);

  if (!context) {
    return null;
  }

  const snapshot = await loadCabinetRawSnapshot(supabase, organizationId, context.email);

  syncProjectRuntimesFromSnapshot(snapshot, context);
  setActiveProject(
    {
      organizationId,
      userId: context.email,
    },
    projectId,
  );

  const runtime = findProjectRuntime(projectId);

  if (!runtime) {
    return null;
  }

  const briefing = buildProjectTodayBriefing(runtime, snapshot);
  const executive = getLastExecutiveDecision({
    organizationId,
    userId: context.email,
  });
  const scope = {
    organizationId,
    userId: context.email,
  };

  const data: OsaWorkspacePageData = {
    projectId,
    userName: context.userName,
    header: {
      title: runtime.title,
      description: runtime.description || workspace.project.description || '',
      status: PROJECT_STATUS_LABELS[workspace.project.status] ?? workspace.project.status,
      lastActivity: runtime.lastActivity,
    },
    today: {
      headline: briefing.headline,
      mission: runtime.mission,
      nextStep: briefing.nextStep,
      priority: executive ? goalLabel(executive.goal) : briefing.nextStep,
      progressPercent: briefing.progressPercent,
      lastResult: briefing.lastResult,
    },
    navigator: getNextBestStepContent(scope),
    timeline: buildWorkspaceTimeline(runtime),
    lifecycle: loadProjectLifecycleSnapshot(getRuntimeStorage(), projectId),
    orchestra: loadAiOrchestraState(getRuntimeStorage(), projectId),
    scope,
  };

  publishWorkspaceRuntimeEvents(projectId, data, context.email, context.userName);

  return data;
}

function publishWorkspaceRuntimeEvents(
  projectId: string,
  data: OsaWorkspacePageData,
  userEmail: string,
  userName: string | null,
): void {
  const storage = getRuntimeStorage();

  publishRuntimeEvent(
    {
      projectId,
      type: RUNTIME_EVENT_TYPES.WORKSPACE_LOADED,
      actor: `user:${userEmail}`,
      source: 'workspace',
      payload: {
        projectTitle: data.header.title,
        progressPercent: data.today.progressPercent,
        hasOrchestra: Boolean(data.orchestra),
        hasLifecycle: Boolean(data.lifecycle),
      },
    },
    storage,
  );

  const briefing = buildMorningBriefing(data, userName);

  publishRuntimeEvent(
    {
      projectId,
      type: RUNTIME_EVENT_TYPES.MORNING_BRIEFING_PREPARED,
      actor: `user:${userEmail}`,
      source: 'morning_briefing',
      payload: {
        actionCount: briefing.actions.length,
        primaryAction: briefing.actions[0]?.title ?? null,
        progressPercent: data.today.progressPercent,
      },
    },
    storage,
  );
}
