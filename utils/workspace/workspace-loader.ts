import type { SupabaseClient } from '@supabase/supabase-js';

import { getLastExecutiveDecision } from '@/lib/executive/executive-engine';
import { goalLabel } from '@/lib/executive/executive-goals';
import { setActiveProject } from '@/lib/project-runtime/active-project';
import { findProjectRuntime } from '@/lib/project-runtime/project-runtime-engine';
import { syncProjectRuntimesFromSnapshot } from '@/lib/project-runtime/project-runtime-sync';
import { buildProjectTodayBriefing } from '@/lib/project-runtime/today-briefing';
import { loadCabinetRawSnapshot } from '@/utils/cabinet/load-dashboard';
import { loadHomeUserContext } from '@/utils/home/home-loader';
import { getNextBestStepContent } from '@/utils/navigator/default-next-steps';
import { loadProjectWorkspace } from '@/utils/projects/project-loader';
import { PROJECT_STATUS_LABELS } from '@/utils/projects/project-types';

import { buildWorkspaceTimeline } from './workspace-timeline';
import type { OsaWorkspacePageData } from './workspace-types';

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

  return {
    projectId,
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
    scope,
  };
}
