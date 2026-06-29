import type { AgentRunStatus } from '@/types/ai';
import type { OrchestratorRun } from '@/types/orchestrator';
import {
  mapRunsToHistory,
  mapRunsToOverviewMetrics,
  mapRunsToUsageStats,
  mapSnapshotToProfile,
  mapSnapshotToWorkspace,
  type ActivityItem,
  type CabinetRawSnapshot,
  type ExecutionHistoryItem,
} from '@/utils/cabinet/dashboard-mappers';
import { formatAverageRuntime, formatExecutionTimeMs } from '@/utils/cabinet/dashboard-mappers';
import { HOME_GOAL_DEFINITIONS, resolveContinueWorkingMode } from '@/utils/home/goal-handoff';
import {
  type ContinueWorkingData,
  type DailySummaryData,
  type HomeData,
  type HomeExecutionItem,
  type HomeGoal,
  type HomeGoalId,
  type HomeProjectItem,
  type HomeUserContext,
  type HomeWelcome,
  type PinnedAction,
  type SmartSuggestion,
} from '@/utils/home/home-types';

const RUNNING_STATUSES = new Set<AgentRunStatus>(['pending', 'running']);

export const HOME_GOALS: HomeGoal[] = HOME_GOAL_DEFINITIONS.map((goal) => ({
  id: goal.id,
  label: goal.title,
  description: goal.description,
  icon: goal.icon,
}));

export const ASK_OSA_PLACEHOLDERS = [
  'I need more clients',
  'Build a marketing plan',
  'Help me launch a business',
  "I don't know what to do next",
];

export function isHomeGoalId(value: string): value is HomeGoalId {
  return HOME_GOAL_DEFINITIONS.some((goal) => goal.id === value);
}

export function getHomeGoalById(goalId: HomeGoalId): HomeGoal | undefined {
  return HOME_GOALS.find((goal) => goal.id === goalId);
}

export function resolveHomeUserName(context: HomeUserContext): string {
  if (context.userName?.trim()) {
    return context.userName.trim();
  }

  const emailPrefix = context.email.split('@')[0]?.trim();

  if (emailPrefix) {
    return emailPrefix;
  }

  return 'there';
}

export function mapWelcome(context: HomeUserContext, snapshot: CabinetRawSnapshot): HomeWelcome {
  const workspace = mapSnapshotToWorkspace(snapshot);

  return {
    userName: resolveHomeUserName(context),
    organization: context.organizationName,
    workspace: workspace.name,
  };
}

export function mapRecentProjects(snapshot: CabinetRawSnapshot, limit = 5): HomeProjectItem[] {
  return snapshot.projects.slice(0, limit).map((project) => ({
    id: project.id,
    name: project.name,
    href: `/projects/${project.id}`,
    updatedAt: project.updated_at,
    type: project.project_type,
  }));
}

function mapExecutionItem(item: ExecutionHistoryItem): HomeExecutionItem {
  return {
    id: item.id,
    label: item.label,
    status: item.status,
    duration: item.duration,
    timestamp: item.timestamp,
    href: item.href,
  };
}

export function mapRecentExecutions(snapshot: CabinetRawSnapshot, limit = 5): HomeExecutionItem[] {
  return mapRunsToHistory(snapshot.runs).slice(0, limit).map(mapExecutionItem);
}

export function mapContinueWorking(snapshot: CabinetRawSnapshot): ContinueWorkingData {
  const runningRun = snapshot.runs.find((run) => RUNNING_STATUSES.has(run.status));
  const lastProject = mapRecentProjects(snapshot, 1)[0] ?? null;
  const runningExecution = runningRun ? mapExecutionItem(mapRunsToHistory([runningRun])[0]!) : null;
  const resume = resolveContinueWorkingMode({
    projectCount: snapshot.projectCount,
    activeProjectId: lastProject?.id ?? null,
    activeProjectName: lastProject?.name ?? null,
    resumeExecutionId: runningExecution?.id ?? null,
    resumeExecutionHref: runningExecution?.href ?? null,
    resumeExecutionLabel: runningExecution?.label ?? null,
  });

  return {
    runningExecution,
    lastProject,
    resumeHref: resume.resumeHref,
    resumeLabel: resume.resumeLabel,
  };
}

function suggestionFromActivity(item: ActivityItem): SmartSuggestion {
  return {
    id: `activity-${item.id}`,
    title: item.title,
    description: item.subtitle,
    href: item.href ?? '/cabinet',
    reason: `Recent ${item.category} activity`,
  };
}

function suggestionFromRun(run: OrchestratorRun, reason: string): SmartSuggestion {
  const label =
    typeof run.input.user_prompt === 'string' && run.input.user_prompt.trim().length > 0
      ? run.input.user_prompt.trim()
      : 'Review execution';

  return {
    id: `run-${run.id}`,
    title: label,
    description: `Status: ${run.status}`,
    href: `/orchestrator/runs/${run.id}`,
    reason,
  };
}

export function mapSmartSuggestions(snapshot: CabinetRawSnapshot, limit = 4): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];
  const profile = mapSnapshotToProfile(snapshot);
  const recentProjects = mapRecentProjects(snapshot, 3);
  const failedRun = snapshot.runs.find((run) => run.status === 'failed');

  if (failedRun) {
    suggestions.push(suggestionFromRun(failedRun, 'Failed execution needs attention'));
  }

  if (profile.projectCount === 0) {
    suggestions.push({
      id: 'create-first-project',
      title: 'Create your first project',
      description: 'Projects connect OSA, documents, CRM, and knowledge.',
      href: '/projects',
      reason: 'No projects yet',
    });
  } else if (recentProjects[0]) {
    suggestions.push({
      id: `project-${recentProjects[0].id}`,
      title: `Continue ${recentProjects[0].name}`,
      description: 'Pick up where you left off in your latest project.',
      href: recentProjects[0].href,
      reason: 'Latest project activity',
    });
  }

  for (const item of snapshot.events.slice(0, 6)) {
    if (suggestions.length >= limit) {
      break;
    }

    if (item.type === 'osa_progress_updated') {
      continue;
    }

    const activityItem: ActivityItem = {
      id: item.id,
      category: 'other',
      title: item.type.replace(/_/g, ' '),
      subtitle: item.source,
      timestamp: item.created_at,
      href: null,
    };

    suggestions.push(suggestionFromActivity(activityItem));
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: 'start-osa',
      title: 'Ask OSA what to do next',
      description: 'Describe your goal and OSA will prepare the workspace.',
      href: '/osa',
      reason: 'Getting started',
    });
  }

  return suggestions.slice(0, limit);
}

export function mapPinnedActions(snapshot: CabinetRawSnapshot): PinnedAction[] {
  const lastProject = mapRecentProjects(snapshot, 1)[0];

  return [
    { id: 'run_osa', label: 'Run OSA', href: '/osa', icon: '✨' },
    {
      id: 'open_last_project',
      label: 'Open last project',
      href: lastProject?.href ?? '/projects',
      icon: '📁',
    },
    { id: 'upload_document', label: 'Upload document', href: '/knowledge', icon: '📄' },
    { id: 'create_project', label: 'Create project', href: '/projects', icon: '➕' },
  ];
}

export function mapDailySummary(snapshot: CabinetRawSnapshot): DailySummaryData {
  const overview = mapRunsToOverviewMetrics(snapshot.runs);
  const usage = mapRunsToUsageStats(snapshot.runs);
  const tokens = snapshot.runs.reduce(
    (total, run) => total + (run.tokens_input ?? 0) + (run.tokens_output ?? 0),
    0,
  );

  return {
    todayExecutions: usage.todayRuns,
    completed: overview.completedExecutions,
    failed: overview.failedExecutions,
    runtimeLabel: formatExecutionTimeMs(overview.executionTimeTodayMs),
    aiUsageLabel: tokens > 0 ? `${tokens.toLocaleString()} tokens` : 'No usage yet',
  };
}

export function buildHomeFromSnapshot(
  snapshot: CabinetRawSnapshot,
  context: HomeUserContext,
): HomeData {
  return {
    welcome: mapWelcome(context, snapshot),
    goals: HOME_GOALS,
    continueWorking: mapContinueWorking(snapshot),
    suggestions: mapSmartSuggestions(snapshot),
    pinnedActions: mapPinnedActions(snapshot),
    dailySummary: mapDailySummary(snapshot),
    recentProjects: mapRecentProjects(snapshot),
    recentExecutions: mapRecentExecutions(snapshot),
    askOsaPlaceholders: ASK_OSA_PLACEHOLDERS,
  };
}

export function createEmptyHome(context: HomeUserContext): HomeData {
  const emptySnapshot: CabinetRawSnapshot = {
    runs: [],
    events: [],
    organization: null,
    projects: [],
    projectCount: 0,
    workspaceCount: 0,
    agentCount: 0,
    documentCount: 0,
    knowledgeSourceCount: 0,
    crmLeadCount: 0,
    memoryCount: 0,
    health: {
      database: 'unknown',
      gateway: 'unknown',
      runtime: 'unknown',
      memory: 'unknown',
      knowledge: 'unknown',
      automation: 'unknown',
    },
    userEmail: context.email,
  };

  return buildHomeFromSnapshot(emptySnapshot, context);
}

export function formatHomeRuntimeLabel(averageRuntimeMs: number | null): string {
  return formatAverageRuntime(averageRuntimeMs);
}
