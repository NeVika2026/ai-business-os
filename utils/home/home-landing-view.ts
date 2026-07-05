import type { AgentRunStatus } from '@/types/ai';
import type { CabinetRawSnapshot } from '@/utils/cabinet/dashboard-mappers';
import { mapRunsToUsageStats } from '@/utils/cabinet/dashboard-mappers';
import type { ConciergeData } from '@/utils/home/concierge-mappers';
import type { HomeData } from '@/utils/home/home-types';

const ATTENTION_STATUSES = new Set<AgentRunStatus>(['pending', 'running']);

export type HomeLandingActivity = {
  id: string;
  label: string;
  detail: string;
  href: string | null;
};

export type HomeLandingView = {
  activeProjectCount: number;
  aiTaskCount: number;
  pendingDecisionCount: number;
  nextStepLabel: string;
  nextStepHref: string;
  continueHref: string | null;
  continueLabel: string;
  recentActivity: HomeLandingActivity[];
};

function pluralRu(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return few;
  }

  return many;
}

function resolveContinueHref(home: HomeData): string | null {
  const resumeHref = home.continueWorking.resumeHref;
  const lastProject = home.recentProjects[0];

  if (resumeHref && resumeHref !== '/home') {
    const projectMatch = resumeHref.match(/^\/projects\/([^/]+)$/);

    if (projectMatch?.[1]) {
      return `/workspace/${projectMatch[1]}`;
    }

    return resumeHref;
  }

  if (lastProject) {
    return `/workspace/${lastProject.id}`;
  }

  return null;
}

function mapRecentActivity(
  home: HomeData,
  concierge: Pick<
    ConciergeData,
    'continueJourney' | 'projectBriefing' | 'greeting' | 'dailyMission'
  >,
): HomeLandingActivity[] {
  const activity: HomeLandingActivity[] = [];
  const projectName =
    concierge.continueJourney.projectName ??
    concierge.projectBriefing.activeProjectTitle ??
    home.recentProjects[0]?.name ??
    null;

  if (projectName) {
    const projectId = home.recentProjects[0]?.id;
    activity.push({
      id: 'project',
      label: `Проект ${projectName}`,
      detail: concierge.projectBriefing.headline,
      href: projectId ? `/workspace/${projectId}` : concierge.dailyMission.href,
    });
  }

  if (concierge.continueJourney.runningExecutionLabel) {
    activity.push({
      id: 'orchestra',
      label: 'AI Orchestra',
      detail: 'работает',
      href: concierge.continueJourney.resumeHref,
    });
  } else if (home.continueWorking.runningExecution) {
    activity.push({
      id: 'orchestra',
      label: 'AI Orchestra',
      detail: home.continueWorking.runningExecution.label,
      href: home.continueWorking.runningExecution.href,
    });
  }

  if (concierge.projectBriefing.nextStep) {
    activity.push({
      id: 'executive-brain',
      label: 'Executive Brain',
      detail: concierge.projectBriefing.nextStep,
      href: concierge.dailyMission.href,
    });
  }

  if (concierge.projectBriefing.lastResult) {
    activity.push({
      id: 'memory',
      label: 'Executive Memory',
      detail: concierge.projectBriefing.lastResult,
      href: concierge.dailyMission.href,
    });
  }

  for (const execution of home.recentExecutions.slice(0, 2)) {
    if (activity.length >= 4) {
      break;
    }

    activity.push({
      id: `execution-${execution.id}`,
      label: execution.label,
      detail: execution.status,
      href: execution.href,
    });
  }

  if (activity.length === 0) {
    activity.push({
      id: 'empty',
      label: 'OSA',
      detail: 'Создайте проект — и активность появится здесь.',
      href: '/projects',
    });
  }

  return activity.slice(0, 4);
}

export function mapHomeLandingView(
  home: HomeData,
  snapshot: CabinetRawSnapshot,
  concierge: Pick<
    ConciergeData,
    'continueJourney' | 'projectBriefing' | 'greeting' | 'dailyMission'
  >,
): HomeLandingView {
  const activeProjectCount = snapshot.projects.filter((project) => project.status === 'active').length;
  const usage = mapRunsToUsageStats(snapshot.runs);
  const aiTaskCount = Math.max(snapshot.runs.length, usage.todayRuns);
  const pendingDecisionCount = snapshot.runs.filter((run) => ATTENTION_STATUSES.has(run.status)).length;
  const resolvedContinueHref = resolveContinueHref(home);
  const continueHref = resolvedContinueHref ?? '/projects';
  const continueLabel =
    resolvedContinueHref && home.continueWorking.resumeLabel !== 'Go to Today'
      ? home.continueWorking.resumeLabel
      : 'Продолжить работу';

  return {
    activeProjectCount,
    aiTaskCount,
    pendingDecisionCount,
    nextStepLabel: concierge.projectBriefing.nextStep || concierge.dailyMission.description,
    nextStepHref: concierge.dailyMission.href,
    continueHref,
    continueLabel,
    recentActivity: mapRecentActivity(home, concierge),
  };
}

export function formatLandingStatLines(view: HomeLandingView): {
  projects: string;
  tasks: string;
  decisions: string | null;
} {
  const projects = `${view.activeProjectCount} ${pluralRu(
    view.activeProjectCount,
    'активный проект',
    'активных проекта',
    'активных проектов',
  )}`;

  const tasks = `${view.aiTaskCount} ${pluralRu(view.aiTaskCount, 'AI-задача', 'AI-задачи', 'AI-задач')}`;

  const decisions =
    view.pendingDecisionCount > 0
      ? `${view.pendingDecisionCount} ${pluralRu(
          view.pendingDecisionCount,
          'решение ожидает',
          'решения ожидают',
          'решений ожидают',
        )}`
      : null;

  return { projects, tasks, decisions };
}
