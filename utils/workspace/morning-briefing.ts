import { getLastExecutiveDecision } from '@/lib/executive/executive-engine';
import type { ExecutiveGoal } from '@/types/executive';
import type { NavigatorStepId } from '@/types/navigator';

import type { OsaWorkspacePageData } from './workspace-types';

export type MorningBriefingPriority = 'high' | 'medium' | 'low';

export type MorningBriefingAction = {
  title: string;
  estimate: string;
  priority: MorningBriefingPriority;
  priorityLabel: string;
  prompt: string;
};

export type MorningBriefing = {
  greeting: string;
  intro: string;
  actions: MorningBriefingAction[];
  progressLine: string;
  ctaLabel: string;
  primaryPrompt: string;
};

const PRIORITY_LABEL: Record<MorningBriefingPriority, string> = {
  high: 'Высокий приоритет',
  medium: 'Средний приоритет',
  low: 'Низкий приоритет',
};

const PRIORITY_ORDER: MorningBriefingPriority[] = ['high', 'medium', 'low'];

function greetingName(userName: string | null): string {
  const first = userName?.trim().split(/\s+/)[0];

  if (!first) {
    return 'Доброе утро.';
  }

  return `Доброе утро, ${first}.`;
}

function estimateForSignal(stepId?: NavigatorStepId, goal?: ExecutiveGoal | null): string {
  if (stepId === 'build_system' || goal === 'design') {
    return '≈ 2 часа';
  }

  if (stepId === 'quick_result') {
    return '≈ 30 минут';
  }

  if (stepId === 'scale' || goal === 'create_content') {
    return '≈ 45 минут';
  }

  if (goal === 'business_analysis') {
    return '≈ 1 час';
  }

  return '≈ 1 час';
}

function buildPrompt(projectTitle: string, title: string): string {
  const normalized = title.endsWith('.') ? title : `${title}.`;

  return `Продолжи работу над проектом «${projectTitle}»: ${normalized}`;
}

function normalizeTitle(title: string): string {
  const trimmed = title.trim();

  if (!trimmed) {
    return 'Продолжить работу над проектом';
  }

  if (trimmed.length <= 72) {
    return trimmed;
  }

  return `${trimmed.slice(0, 69)}…`;
}

function dedupeTitles(titles: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const title of titles) {
    const key = title.trim().toLowerCase();

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(normalizeTitle(title));
  }

  return result;
}

function collectActionTitles(data: OsaWorkspacePageData): string[] {
  const executive = getLastExecutiveDecision(data.scope);
  const titles: string[] = [];

  if (data.today.nextStep.trim()) {
    titles.push(data.today.nextStep.trim());
  }

  for (const entry of data.timeline) {
    if (entry.task.trim()) {
      titles.push(entry.task.trim());
    }
  }

  if (data.today.mission.trim() && data.today.mission.trim() !== data.today.nextStep.trim()) {
    titles.push(data.today.mission.trim());
  }

  for (const step of data.navigator.steps) {
    titles.push(step.title);
  }

  for (const entry of data.timeline) {
    if (entry.decision.trim() && entry.decision !== entry.task) {
      titles.push(entry.decision.trim());
    }
  }

  if (executive?.summary.trim()) {
    titles.push(executive.summary.trim());
  }

  return dedupeTitles(titles).slice(0, 3);
}

function resolveStepIdForTitle(data: OsaWorkspacePageData, title: string): NavigatorStepId | undefined {
  return data.navigator.steps.find((step) => step.title === title)?.id;
}

export function buildMorningBriefing(
  data: OsaWorkspacePageData,
  userName: string | null,
): MorningBriefing {
  const executive = getLastExecutiveDecision(data.scope);
  const goal = executive?.goal ?? null;
  const titles = collectActionTitles(data);
  const projectTitle = data.header.title;

  while (titles.length < 3) {
    const fallback = data.navigator.steps[titles.length]?.title;

    if (!fallback || titles.includes(fallback)) {
      break;
    }

    titles.push(fallback);
  }

  const actions: MorningBriefingAction[] = titles.slice(0, 3).map((title, index) => {
    const priority = PRIORITY_ORDER[index] ?? 'low';
    const stepId = resolveStepIdForTitle(data, title);

    return {
      title,
      estimate: estimateForSignal(stepId, index === 0 ? goal : null),
      priority,
      priorityLabel: PRIORITY_LABEL[priority],
      prompt: buildPrompt(projectTitle, title),
    };
  });

  const actionCount = actions.length;
  const intro =
    actionCount === 1
      ? 'Сегодня есть одно действие, которое сильнее всего повлияет на результат.'
      : actionCount === 2
        ? 'Сегодня есть два действия, которые сильнее всего повлияют на результат.'
        : 'Сегодня есть три действия, которые сильнее всего повлияют на результат.';

  const primaryPrompt = actions[0]?.prompt ?? buildPrompt(projectTitle, data.today.nextStep);

  return {
    greeting: greetingName(userName),
    intro,
    actions,
    progressLine: `Сегодня можно закрыть ${projectTitle} на ${data.today.progressPercent}%.`,
    ctaLabel: 'Начать работу',
    primaryPrompt,
  };
}

export function morningBriefingStorageKey(projectId: string, date = new Date()): string {
  const day = date.toISOString().slice(0, 10);

  return `osa_morning_briefing_${projectId}_${day}`;
}

export function hasDismissedMorningBriefing(projectId: string, date = new Date()): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(morningBriefingStorageKey(projectId, date)) === '1';
  } catch {
    return false;
  }
}

export function dismissMorningBriefing(projectId: string, date = new Date()): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(morningBriefingStorageKey(projectId, date), '1');
  } catch {
    // Storage may be unavailable.
  }
}
