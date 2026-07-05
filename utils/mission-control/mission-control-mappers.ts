import { getLastExecutiveDecision } from '@/lib/executive/executive-engine';
import { buildExecutiveAttentionItems } from '@/lib/executive/executive-watcher';
import { resolveProjectRuntimeScope } from '@/lib/project-runtime/scope';
import { isDefaultWorkspaceId } from '@/lib/project-runtime/constants';
import { orchestraStatusLabel } from '@/lib/project-lifecycle/build-ai-orchestra';
import { deliverablePhaseLabel } from '@/lib/deliverables/deliverable-catalog';
import type { ProjectRuntime } from '@/types/project-runtime';
import type { CabinetRawSnapshot } from '@/utils/cabinet/dashboard-mappers';
import type { ConciergeData } from '@/utils/home/concierge-mappers';
import type { HomeUserContext } from '@/utils/home/home-types';
import { buildExecutiveWorkspaceView } from '@/utils/workspace/executive-workspace-view';
import type { OsaWorkspacePageData } from '@/utils/workspace/workspace-types';

import type {
  MissionControlData,
  MissionControlDeliverable,
  MissionControlOrchestraAgent,
  MissionControlProject,
} from './mission-control-types';
import type { ExecutiveAttentionItem } from '@/types/executive-attention';

type BuildMissionControlInput = {
  concierge: ConciergeData;
  snapshot: CabinetRawSnapshot;
  workspace: OsaWorkspacePageData | null;
  context: HomeUserContext;
};

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();

    if (!trimmed || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}

export function resolveMissionControlProjectId(
  runtime: ProjectRuntime,
  snapshot: CabinetRawSnapshot,
): string | null {
  if (runtime.sourceProjectId) {
    return runtime.sourceProjectId;
  }

  if (!isDefaultWorkspaceId(runtime.id)) {
    return runtime.id;
  }

  return snapshot.projects.find((project) => project.status === 'active')?.id ?? snapshot.projects[0]?.id ?? null;
}

function mapActiveProjects(snapshot: CabinetRawSnapshot): MissionControlProject[] {
  const active = snapshot.projects.filter((project) => project.status === 'active');

  return (active.length > 0 ? active : snapshot.projects).slice(0, 5).map((project) => ({
    id: project.id,
    name: project.name,
    href: `/workspace/${project.id}`,
    status: project.status,
  }));
}

function mapOrchestraAgents(workspace: OsaWorkspacePageData): MissionControlOrchestraAgent[] {
  if (!workspace.orchestra) {
    return [];
  }

  return workspace.orchestra.queue.slice(0, 6).map((agent) => ({
    name: agent.name,
    role: agent.role,
    status: orchestraStatusLabel(agent.status),
    progressPercent: agent.progressPercent,
    activity: agent.currentActivity,
  }));
}

function mapDeliverableItems(workspace: OsaWorkspacePageData): MissionControlDeliverable[] {
  if (!workspace.deliverables) {
    return [];
  }

  return workspace.deliverables.deliverables.slice(0, 6).map((item) => ({
    title: item.title,
    phaseLabel: deliverablePhaseLabel(item.phase),
  }));
}

function mapRecommendations(
  concierge: ConciergeData,
  workspace: OsaWorkspacePageData | null,
): string[] {
  const recommendations: string[] = [];

  if (concierge.projectBriefing.nextStep) {
    recommendations.push(concierge.projectBriefing.nextStep);
  }

  if (workspace) {
    const executive = getLastExecutiveDecision(workspace.scope);

    if (executive?.summary) {
      recommendations.push(executive.summary);
    }

    const view = buildExecutiveWorkspaceView(workspace);

    if (view.focus.reason) {
      recommendations.push(view.focus.reason);
    }

    for (const item of workspace.deliverables?.deliverables ?? []) {
      for (const entry of item.review?.recommendations ?? []) {
        recommendations.push(entry);
      }

      if (item.review?.nextAction) {
        recommendations.push(item.review.nextAction);
      }
    }
  }

  for (const insight of concierge.insights) {
    if (insight.tone === 'positive') {
      recommendations.push(insight.message);
    }
  }

  return uniqueStrings(recommendations).slice(0, 5);
}

function mapRisksFromAttention(attentionItems: ExecutiveAttentionItem[]): string[] {
  return uniqueStrings(
    attentionItems
      .filter((item) => item.priority === 'high' || item.priority === 'medium')
      .map((item) => item.consequence),
  ).slice(0, 5);
}

function mapLegacyRisks(
  concierge: ConciergeData,
  snapshot: CabinetRawSnapshot,
  workspace: OsaWorkspacePageData | null,
): string[] {
  const risks: string[] = [];

  for (const insight of concierge.insights) {
    if (insight.tone === 'warning') {
      risks.push(insight.message);
    }
  }

  const failedRuns = snapshot.runs.filter((run) => run.status === 'failed').length;

  if (failedRuns > 0) {
    risks.push(`${failedRuns} AI run${failedRuns === 1 ? '' : 's'} failed recently.`);
  }

  for (const [key, status] of Object.entries(snapshot.health)) {
    if (status === 'warning' || status === 'offline') {
      risks.push(`${key} subsystem is ${status}.`);
    }
  }

  if (workspace) {
    const view = buildExecutiveWorkspaceView(workspace);

    for (const item of view.brief) {
      if (item.tone === 'risk') {
        risks.push(item.text);
      }
    }

    for (const agent of workspace.orchestra?.queue ?? []) {
      if (agent.status === 'blocked' && agent.blockedReason) {
        risks.push(agent.blockedReason);
      }
    }
  }

  return uniqueStrings(risks).slice(0, 5);
}

function mapRisks(
  concierge: ConciergeData,
  snapshot: CabinetRawSnapshot,
  workspace: OsaWorkspacePageData | null,
  attentionItems: ExecutiveAttentionItem[],
): string[] {
  const derived = mapRisksFromAttention(attentionItems);

  if (derived.length > 0) {
    return derived;
  }

  return mapLegacyRisks(concierge, snapshot, workspace);
}

export function buildMissionControlData(input: BuildMissionControlInput): MissionControlData {
  const { concierge, snapshot, workspace, context } = input;
  const scope = resolveProjectRuntimeScope(snapshot, context);
  const attentionRequired = buildExecutiveAttentionItems({
    scope,
    snapshot,
    concierge,
    workspace,
  });
  const projectId = workspace?.projectId ?? null;
  const projectHref = projectId ? `/workspace/${projectId}` : concierge.landing.continueHref ?? '/projects';
  const projectName = workspace?.header.title ?? concierge.projectBriefing.activeProjectTitle ?? 'Проект';

  return {
    organizationName: context.organizationName,
    userName: context.userName ?? context.email,
    todayFocus: {
      headline: concierge.projectBriefing.headline || concierge.greeting.currentFocus,
      context: concierge.greeting.currentFocus,
    },
    nextBestAction: {
      label: concierge.landing.nextStepLabel,
      href: concierge.landing.nextStepHref,
      description: concierge.dailyMission.description,
    },
    activeProjects: mapActiveProjects(snapshot),
    orchestra: workspace?.orchestra
      ? {
          projectName,
          projectHref,
          overallProgress: workspace.orchestra.overallProgress,
          activeActivity:
            workspace.orchestra.queue.find((agent) => agent.id === workspace.orchestra?.activeAgentId)
              ?.currentActivity ?? null,
          agents: mapOrchestraAgents(workspace),
        }
      : concierge.continueJourney.runningExecutionLabel
        ? {
            projectName: concierge.continueJourney.projectName ?? projectName,
            projectHref: concierge.continueJourney.resumeHref,
            overallProgress: concierge.projectBriefing.progressPercent,
            activeActivity: concierge.continueJourney.runningExecutionLabel,
            agents: [],
          }
        : null,
    deliverables: workspace?.deliverables
      ? {
          projectName,
          projectHref,
          readyCount: workspace.deliverables.deliverables.filter((item) => item.phase === 'ready').length,
          executiveSummary: workspace.deliverables.executiveSummary,
          items: mapDeliverableItems(workspace),
        }
      : null,
    recommendations: mapRecommendations(concierge, workspace),
    risks: mapRisks(concierge, snapshot, workspace, attentionRequired),
    attentionRequired,
    continueHref: concierge.landing.continueHref ?? '/projects',
    continueLabel: concierge.landing.continueLabel,
  };
}
