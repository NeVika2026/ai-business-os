import type { OrchestratorRun } from '@/types/orchestrator';
import type { CabinetRawSnapshot } from '@/utils/cabinet/dashboard-mappers';
import { getHomeGoalDefinition } from '@/utils/home/goal-handoff';
import { resolveHomeUserName } from '@/utils/home/home-mappers';
import type { HomeGoalId, HomeUserContext } from '@/utils/home/home-types';
import { resolveHistoryResultLabel } from '@/utils/results/result-mappers';

export const WOW_METRIC_EVENTS = {
  smartGreetingShown: 'wow_smart_greeting_shown',
  wowMomentShown: 'wow_moment_shown',
  wowMomentContinued: 'wow_moment_continued',
  resultCelebrationShown: 'wow_result_celebration_shown',
  whatsNextShown: 'wow_whats_next_shown',
} as const;

export type WorkTiming = 'today' | 'yesterday' | 'recent';

export type SmartGreetingData = {
  salutation: string;
  userName: string;
  headline: string;
};

export type PersonalWelcomeData = {
  show: boolean;
  previousWorkLabel: string | null;
  previousWorkLeadIn: string | null;
  recommendationLabel: string | null;
};

export type WowMomentData = {
  headline: string;
  subline: string;
  highlight: string;
  goalTitle: string;
};

export type MeaningfulLoadingStep = {
  id: string;
  label: string;
};

export type MeaningfulLoadingData = {
  steps: MeaningfulLoadingStep[];
  finale: string;
};

export type ResultCelebrationData = {
  show: boolean;
  headline: string;
  message: string;
};

export type WhatsNextRecommendation = {
  title: string;
  label: string;
  description: string;
  href: string;
};

export type WowHandoffContext = {
  userName: string;
  projectCount: number;
  lastCompletedResultLabel: string | null;
  lastCompletedTiming: WorkTiming | null;
  recommendedContinuationLabel: string | null;
};

const CONTINUATION_BY_LAST_GOAL: Partial<Record<HomeGoalId, HomeGoalId>> = {
  create_content: 'find_clients',
  find_clients: 'increase_revenue',
  increase_revenue: 'find_clients',
  launch_project: 'create_content',
  automate_routine: 'organize_business',
  organize_business: 'automate_routine',
  understand_ai: 'launch_project',
  dont_know: 'find_clients',
};

const CONTINUATION_LABELS: Partial<Record<HomeGoalId, string>> = {
  find_clients: 'Client Acquisition',
  increase_revenue: 'Growing Revenue',
  create_content: 'Content Creation',
  launch_project: 'Launch Business',
  automate_routine: 'Automate Work',
  organize_business: 'Organize Business',
};

function sameCalendarDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function resolveSalutation(now: Date = new Date()): string {
  const hour = now.getHours();

  if (hour < 12) {
    return 'Good morning';
  }

  if (hour < 17) {
    return 'Good afternoon';
  }

  return 'Good evening';
}

export function formatDisplayName(name: string): string {
  return name
    .split(/[\s._-]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function resolveWorkTiming(timestamp: string, now: Date = new Date()): WorkTiming {
  const date = new Date(timestamp);

  if (sameCalendarDay(date, now)) {
    return 'today';
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (sameCalendarDay(date, yesterday)) {
    return 'yesterday';
  }

  return 'recent';
}

function formatWorkLeadIn(timing: WorkTiming): string {
  switch (timing) {
    case 'today':
      return 'Earlier today we finished';
    case 'yesterday':
      return 'Yesterday we finished';
    default:
      return 'Recently we finished';
  }
}

function inferGoalIdFromRun(run: OrchestratorRun): HomeGoalId | null {
  const goalId = run.input.goal_id ?? run.input.goalId;

  if (typeof goalId === 'string') {
    return goalId as HomeGoalId;
  }

  const prompt = `${run.input.user_prompt ?? ''} ${run.input.action ?? ''}`.toLowerCase();

  if (/client|lead|customer|acqui/i.test(prompt)) {
    return 'find_clients';
  }

  if (/revenue|sales|income/i.test(prompt)) {
    return 'increase_revenue';
  }

  if (/content|marketing|campaign/i.test(prompt)) {
    return 'create_content';
  }

  if (/launch|start|initiative/i.test(prompt)) {
    return 'launch_project';
  }

  if (/automat|routine|workflow/i.test(prompt)) {
    return 'automate_routine';
  }

  return null;
}

export function findLastCompletedWork(
  runs: OrchestratorRun[],
  now: Date = new Date(),
): { label: string; timing: WorkTiming; inferredGoalId: HomeGoalId | null } | null {
  const completed = runs.filter((run) => run.status === 'completed');

  if (completed.length === 0) {
    return null;
  }

  const latest = completed[0]!;

  return {
    label: resolveHistoryResultLabel(latest),
    timing: resolveWorkTiming(latest.completed_at ?? latest.created_at, now),
    inferredGoalId: inferGoalIdFromRun(latest),
  };
}

export function resolveRecommendedContinuation(
  lastWork: { inferredGoalId: HomeGoalId | null } | null,
): string | null {
  if (!lastWork?.inferredGoalId) {
    return null;
  }

  const nextGoalId = CONTINUATION_BY_LAST_GOAL[lastWork.inferredGoalId];

  if (!nextGoalId) {
    return null;
  }

  return CONTINUATION_LABELS[nextGoalId] ?? getHomeGoalDefinition(nextGoalId).title;
}

export function buildWowHandoffContext(
  snapshot: CabinetRawSnapshot,
  context: HomeUserContext,
  now: Date = new Date(),
): WowHandoffContext {
  const lastWork = findLastCompletedWork(snapshot.runs, now);

  return {
    userName: formatDisplayName(resolveHomeUserName(context)),
    projectCount: snapshot.projectCount,
    lastCompletedResultLabel: lastWork?.label ?? null,
    lastCompletedTiming: lastWork?.timing ?? null,
    recommendedContinuationLabel: resolveRecommendedContinuation(lastWork),
  };
}

export function buildSmartGreeting(
  userName: string,
  now: Date = new Date(),
): SmartGreetingData {
  return {
    salutation: resolveSalutation(now),
    userName: formatDisplayName(userName),
    headline: "Let's make today productive.",
  };
}

export function buildPersonalWelcome(input: {
  lastCompletedResultLabel: string | null;
  lastCompletedTiming: WorkTiming | null;
  recommendedContinuationLabel: string | null;
}): PersonalWelcomeData {
  const show =
    input.lastCompletedResultLabel !== null || input.recommendedContinuationLabel !== null;

  return {
    show,
    previousWorkLabel: input.lastCompletedResultLabel,
    previousWorkLeadIn: input.lastCompletedTiming
      ? formatWorkLeadIn(input.lastCompletedTiming)
      : null,
    recommendationLabel: input.recommendedContinuationLabel,
  };
}

export function buildMeaningfulLoading(input: {
  projectCount: number;
  hasPreviousWork: boolean;
  goalTitle: string;
}): MeaningfulLoadingData {
  const steps: MeaningfulLoadingStep[] = [];

  if (input.projectCount > 0) {
    steps.push({ id: 'projects', label: 'I remembered your projects' });
  }

  if (input.hasPreviousWork) {
    steps.push({ id: 'history', label: 'I found previous work' });
  }

  steps.push({ id: 'goal', label: `I connected today's goal` });

  return {
    steps,
    finale: 'Now preparing recommendations...',
  };
}

export function buildWowMoment(input: {
  userName: string;
  goalTitle: string;
  projectCount: number;
  activeProjectName: string | null;
}): WowMomentData {
  const firstName = formatDisplayName(input.userName).split(' ')[0] ?? input.userName;

  if (input.projectCount > 0 && input.activeProjectName) {
    return {
      headline: `Nice choice, ${firstName}.`,
      subline: `I'll build on ${input.activeProjectName} for ${input.goalTitle.toLowerCase()}.`,
      highlight: 'This is tailored to your business — not a generic template.',
      goalTitle: input.goalTitle,
    };
  }

  return {
    headline: `Nice choice, ${firstName}.`,
    subline: `I'll prepare something practical for ${input.goalTitle.toLowerCase()}.`,
    highlight: 'This is tailored to your business — not a generic template.',
    goalTitle: input.goalTitle,
  };
}

export function buildResultPresentationHeadline(status: string): string {
  if (status === 'Needs attention' || status === 'failed') {
    return "Here's what happened";
  }

  if (status === 'In progress' || status === 'Preparing') {
    return "Here's what I'm preparing for you";
  }

  return "Here's what I prepared for you.";
}

export function buildResultCelebration(
  completedResultsCount: number,
  status: string,
): ResultCelebrationData {
  const isFirst = completedResultsCount <= 1;

  if (!isFirst || status !== 'Completed') {
    return {
      show: false,
      headline: '',
      message: '',
    };
  }

  return {
    show: true,
    headline: 'Great start.',
    message: 'Your first business result is ready.',
  };
}

export function buildWhatsNextRecommendation(input: {
  goalTitle: string;
  projectHref: string | null;
  status: string;
}): WhatsNextRecommendation {
  if (input.status === 'Needs attention') {
    return {
      title: "What's next?",
      label: 'Try again from Today',
      description: 'Pick your goal and we will take another focused pass.',
      href: '/home',
    };
  }

  if (input.projectHref) {
    return {
      title: "What's next?",
      label: 'Save this to your project',
      description: `Keep ${input.goalTitle.toLowerCase()} moving inside your project workspace.`,
      href: input.projectHref,
    };
  }

  return {
    title: "What's next?",
    label: 'Continue with another goal',
    description: 'Build momentum while today’s result is fresh.',
    href: '/home',
  };
}

export function countCompletedResults(runs: OrchestratorRun[]): number {
  return runs.filter((run) => run.status === 'completed').length;
}

export function buildHomeWowContextFromSnapshot(
  snapshot: CabinetRawSnapshot,
  context: HomeUserContext,
  now: Date = new Date(),
) {
  const handoff = buildWowHandoffContext(snapshot, context, now);

  return {
    smartGreeting: buildSmartGreeting(handoff.userName, now),
    personalWelcome: buildPersonalWelcome(handoff),
    handoff,
  };
}

export function buildWowContextFromHistory(completedCount: number, lastCompletedLabel: string | null) {
  return {
    hasPreviousWork: completedCount > 0,
    lastCompletedLabel,
  };
}
