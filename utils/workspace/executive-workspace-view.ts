import { getLastExecutiveDecision } from '@/lib/executive/executive-engine';
import { goalLabel } from '@/lib/executive/executive-goals';
import type { ExecutiveGoal } from '@/types/executive';
import { getOsaAgentById } from '@/utils/osa/agent-registry';

import type { OsaWorkspacePageData } from './workspace-types';

export type ExecutiveBriefTone = 'done' | 'waiting' | 'risk';

export type ExecutiveBriefItem = {
  tone: ExecutiveBriefTone;
  text: string;
};

export type ExecutiveTeamMember = {
  role: string;
  status: string;
  state: 'active' | 'waiting' | 'idle';
};

export type ExecutiveWorkspaceFocus = {
  label: string;
  title: string;
  reason: string;
  ctaLabel: string;
  prompt: string;
};

export type ExecutiveWorkspaceView = {
  projectTitle: string;
  todayHeadline: string;
  contextLine: string;
  lastActivityLabel: string;
  focus: ExecutiveWorkspaceFocus;
  brief: ExecutiveBriefItem[];
  team: ExecutiveTeamMember[];
  memoryLine: string | null;
  recentResult: string | null;
};

function formatActivity(value: string | null): string {
  if (!value) {
    return 'активность пока не зафиксирована';
  }

  return new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildReason(data: OsaWorkspacePageData, goal: ExecutiveGoal | null): string {
  if (data.today.mission.trim()) {
    return data.today.mission;
  }

  if (goal) {
    return `Сейчас фокус проекта — ${goalLabel(goal)}. Это определяет следующий шаг.`;
  }

  const preferredStep = data.navigator.steps[0];

  if (preferredStep?.description) {
    return preferredStep.description;
  }

  return 'Это двигает проект вперёд без лишних отвлечений.';
}

function buildBrief(data: OsaWorkspacePageData, goal: ExecutiveGoal | null): ExecutiveBriefItem[] {
  const items: ExecutiveBriefItem[] = [];

  if (data.timeline.length > 0) {
    items.push({
      tone: 'done',
      text: 'Memory обновлена',
    });
  }

  const latest = data.timeline[0];

  if (latest?.result) {
    items.push({
      tone: 'done',
      text: latest.result.length > 56 ? `${latest.result.slice(0, 53)}…` : latest.result,
    });
  }

  if (goal === 'design') {
    items.push({
      tone: 'waiting',
      text: 'Разработка ожидает решение',
    });
  } else if (data.today.progressPercent < 35) {
    items.push({
      tone: 'waiting',
      text: 'Команда ждёт вашего подтверждения',
    });
  }

  if (data.navigator.steps.length > 1) {
    items.push({
      tone: 'risk',
      text: 'Navigator ещё не утверждён',
    });
  }

  return items.slice(0, 4);
}

function teamStatusForGoal(
  role: 'manager' | 'designer' | 'developer',
  goal: ExecutiveGoal | null,
  progress: number,
): { status: string; state: ExecutiveTeamMember['state'] } {
  switch (role) {
    case 'manager':
      if (goal === 'business_analysis') {
        return { status: 'Анализирует стратегию…', state: 'active' };
      }

      return progress > 20
        ? { status: 'Держит фокус проекта', state: 'idle' }
        : { status: 'Собирает контекст…', state: 'active' };

    case 'designer':
      if (goal === 'design' || goal === 'create_content') {
        return { status: 'Создаёт Workspace…', state: 'active' };
      }

      return { status: 'Готов к следующей задаче', state: 'idle' };

    case 'developer':
      if (goal === 'design') {
        return { status: 'Ожидает подтверждения…', state: 'waiting' };
      }

      if (progress > 50) {
        return { status: 'Готовит реализацию…', state: 'active' };
      }

      return { status: 'На связи', state: 'idle' };
  }
}

function buildTeam(data: OsaWorkspacePageData, goal: ExecutiveGoal | null): ExecutiveTeamMember[] {
  const manager = getOsaAgentById('business-manager');
  const designer = getOsaAgentById('content');
  const developer = getOsaAgentById('project-manager');

  const roles: Array<{ role: string; key: 'manager' | 'designer' | 'developer' }> = [
    { role: manager?.title ?? 'Business Manager', key: 'manager' },
    { role: 'Designer', key: 'designer' },
    { role: 'Developer', key: 'developer' },
  ];

  return roles.map(({ role, key }) => {
    const { status, state } = teamStatusForGoal(key, goal, data.today.progressPercent);

    return { role, status, state };
  });
}

export function buildExecutiveWorkspaceView(data: OsaWorkspacePageData): ExecutiveWorkspaceView {
  const executive = getLastExecutiveDecision(data.scope);
  const goal = executive?.goal ?? null;
  const focusTitle = data.today.nextStep.trim() || data.navigator.steps[0]?.title || 'Продолжить проект';
  const focusPrompt = focusTitle.endsWith('.') ? focusTitle : `${focusTitle}.`;

  return {
    projectTitle: data.header.title,
    todayHeadline: data.today.headline,
    contextLine: data.header.description.trim() || data.today.priority,
    lastActivityLabel: formatActivity(data.header.lastActivity),
    focus: {
      label: 'Следующий лучший шаг',
      title: focusTitle,
      reason: buildReason(data, goal),
      ctaLabel: 'Продолжить →',
      prompt: `Продолжи работу над проектом «${data.header.title}»: ${focusPrompt}`,
    },
    brief: buildBrief(data, goal),
    team: buildTeam(data, goal),
    memoryLine:
      data.timeline.length > 0
        ? `${data.timeline.length} ${data.timeline.length === 1 ? 'запись' : 'записи'} в памяти проекта`
        : null,
    recentResult: data.today.lastResult,
  };
}
