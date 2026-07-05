import { goalLabel } from '@/lib/executive/executive-goals';
import { projectTypeLabel } from '@/lib/project-lifecycle/detect-project-type';
import type { ExecutiveGoal } from '@/types/executive';
import type { RuntimeEventRecord } from '@/types/event-runtime';
import { RUNTIME_EVENT_TYPES } from '@/types/event-runtime';
import { getOsaAgentById } from '@/utils/osa/agent-registry';
import type { OsaAgentId } from '@/utils/osa/agent-registry';
import type { ProjectType } from '@/utils/projects/project-types';

import type { OsaWorkspacePageData } from './workspace-types';

export type ExecutiveMemoryEntry = {
  id: string;
  dateLabel: string;
  title: string;
  reason: string;
  consequence: string;
  nextRecommendation: string;
};

export type ExecutiveMemory = {
  projectTitle: string;
  entries: ExecutiveMemoryEntry[];
  isEmpty: boolean;
};

export type BuildExecutiveMemoryContext = Pick<
  OsaWorkspacePageData,
  'header' | 'today' | 'lifecycle' | 'orchestra'
> & {
  executiveSummary: string | null;
};

const MEMORY_EXCLUDED_TYPES = new Set<string>([
  RUNTIME_EVENT_TYPES.WORKSPACE_LOADED,
  RUNTIME_EVENT_TYPES.MORNING_BRIEFING_PREPARED,
  RUNTIME_EVENT_TYPES.EXECUTIVE_POST_CAPTURE_RECORDED,
  RUNTIME_EVENT_TYPES.WORKSPACE_PROMPT_SUBMITTED,
  RUNTIME_EVENT_TYPES.WORKSPACE_PROMPT_FAILED,
  RUNTIME_EVENT_TYPES.MEMORY_ENTRY_UPDATED,
  RUNTIME_EVENT_TYPES.MEMORY_ENTRY_ARCHIVED,
  RUNTIME_EVENT_TYPES.MEMORY_ENTRY_DELETED,
  RUNTIME_EVENT_TYPES.NAVIGATOR_STATE_UPDATED,
]);

function stringPayload(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];

  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function numberPayload(payload: Record<string, unknown>, key: string): number | null {
  const value = payload[key];

  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatMemoryDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}

function resolveOrchestraAgentRole(activeAgentId: string | null): string | null {
  if (!activeAgentId) {
    return null;
  }

  const parts = activeAgentId.split(':');
  const agentId = (parts.length >= 2 ? parts[1] : parts[0]) as OsaAgentId;
  const agent = getOsaAgentById(agentId);

  return agent?.title ?? null;
}

function defaultNextRecommendation(context: BuildExecutiveMemoryContext): string {
  if (context.today.nextStep.trim()) {
    return context.today.nextStep.trim();
  }

  if (context.lifecycle?.workPlan[0]?.title) {
    return context.lifecycle.workPlan[0].title;
  }

  if (context.executiveSummary?.trim()) {
    return context.executiveSummary.trim();
  }

  return 'Продолжить работу над проектом.';
}

function mapEventToMemoryEntry(
  event: RuntimeEventRecord,
  context: BuildExecutiveMemoryContext,
): ExecutiveMemoryEntry | ExecutiveMemoryEntry[] | null {
  const dateLabel = formatMemoryDate(event.timestamp);

  switch (event.type) {
    case RUNTIME_EVENT_TYPES.PROJECT_LIFECYCLE_STARTED: {
      const name = stringPayload(event.payload, 'projectName') ?? context.header.title;

      return {
        id: event.id,
        dateLabel,
        title: `Создан проект «${name}»`,
        reason: 'Пользователь инициировал новый фокус работы в OSA.',
        consequence: 'Executive Brain, Memory и Workspace получили контекст проекта.',
        nextRecommendation: context.lifecycle?.workPlan[0]?.title ?? 'Организовать команду и первый шаг.',
      };
    }

    case RUNTIME_EVENT_TYPES.PROJECT_LIFECYCLE_COMPLETED: {
      const detectedType = stringPayload(event.payload, 'detectedType') as ProjectType | null;
      const typeLabel = detectedType ? projectTypeLabel(detectedType) : null;
      const specialistCount = numberPayload(event.payload, 'specialistCount');

      return {
        id: event.id,
        dateLabel,
        title: typeLabel
          ? `Executive Brain определил тип проекта: ${typeLabel}`
          : 'Executive Brain организовал проект',
        reason: 'Система должна собрать тип, команду и план без лишних вопросов.',
        consequence:
          specialistCount && specialistCount > 0
            ? `Подобрана команда из ${specialistCount} специалистов и рабочий план.`
            : 'Сформирован рабочий план и Executive Brief.',
        nextRecommendation:
          context.lifecycle?.firstStepPrompt ??
          context.lifecycle?.workPlan[0]?.title ??
          'Запустить AI Orchestra.',
      };
    }

    case RUNTIME_EVENT_TYPES.EXECUTIVE_DECISION_RECORDED: {
      const goal = stringPayload(event.payload, 'goal') as ExecutiveGoal | null;
      const summary = stringPayload(event.payload, 'summary');

      return {
        id: event.id,
        dateLabel,
        title: goal
          ? `Executive Brain выбрал цель: ${goalLabel(goal)}`
          : 'Executive Brain зафиксировал решение',
        reason: summary ?? 'Решение основано на текущем контексте задачи и активного проекта.',
        consequence: 'Navigator и Memory переключились на согласованный режим работы.',
        nextRecommendation: 'Продолжить по выбранной цели.',
      };
    }

    case RUNTIME_EVENT_TYPES.ORCHESTRA_INITIALIZED: {
      const agentCount = numberPayload(event.payload, 'agentCount');
      const activeRole = resolveOrchestraAgentRole(stringPayload(event.payload, 'activeAgentId'));

      return {
        id: event.id,
        dateLabel,
        title: 'Запущена AI Orchestra',
        reason: 'Проект требует последовательной работы специалистов без ручной координации.',
        consequence:
          agentCount && agentCount > 0
            ? `${agentCount} специалистов получили очередь задач.`
            : 'Команда получила очередь задач.',
        nextRecommendation: activeRole
          ? `Проследить первый этап — ${activeRole}.`
          : 'Проследить первый этап команды.',
      };
    }

    case RUNTIME_EVENT_TYPES.ORCHESTRA_AGENT_ADVANCED: {
      const completedRole = stringPayload(event.payload, 'completedAgentRole');
      const nextRole = resolveOrchestraAgentRole(stringPayload(event.payload, 'activeAgentId'));
      const progress = numberPayload(event.payload, 'overallProgress');

      if (!completedRole) {
        return null;
      }

      return {
        id: event.id,
        dateLabel,
        title: `${completedRole} завершил этап`,
        reason: 'Executive Brain пересчитал очередь после завершения задачи специалиста.',
        consequence:
          progress !== null
            ? `Общий прогресс команды — ${progress}%.`
            : 'Очередь Orchestra обновлена.',
        nextRecommendation: nextRole
          ? `Следующий этап — ${nextRole}.`
          : 'Дождаться следующего шага команды.',
      };
    }

    case RUNTIME_EVENT_TYPES.ORCHESTRA_BLOCKED_RESOLVED:
    case RUNTIME_EVENT_TYPES.WORKSPACE_ORCHESTRA_RESOLVED: {
      const activeRole = resolveOrchestraAgentRole(
        context.orchestra?.activeAgentId ?? stringPayload(event.payload, 'activeAgentId'),
      );

      return {
        id: event.id,
        dateLabel,
        title: 'Подтверждено решение пользователя',
        reason: 'Orchestra ждала решения CEO перед продолжением финальных этапов.',
        consequence: 'Команда продолжила работу без паузы.',
        nextRecommendation: activeRole
          ? `Продолжить с ${activeRole}.`
          : 'Продолжить текущий этап Orchestra.',
      };
    }

    case RUNTIME_EVENT_TYPES.WORKSPACE_PROMPT_COMPLETED:
      return {
        id: event.id,
        dateLabel,
        title: 'Выполнена задача в Workspace',
        reason: 'Пользователь отправил запрос через Executive Workspace.',
        consequence: 'Memory и Runtime обновлены результатом выполнения.',
        nextRecommendation: 'Выбрать следующий лучший шаг.',
      };

    case RUNTIME_EVENT_TYPES.DELIVERABLE_REVIEW_COMPLETED: {
      const title = stringPayload(event.payload, 'deliverableTitle') ?? 'Deliverable';
      const score = numberPayload(event.payload, 'score');

      return {
        id: event.id,
        dateLabel,
        title: `Executive Review: ${title}`,
        reason: 'Executive Brain провёл экспертную проверку deliverable.',
        consequence:
          score !== null ? `Executive Score — ${score}/100.` : 'Сформирован review с рекомендациями.',
        nextRecommendation:
          stringPayload(event.payload, 'nextAction') ?? 'Улучшить результат или продолжить проект.',
      };
    }

    case RUNTIME_EVENT_TYPES.DELIVERABLE_IMPROVED: {
      const title = stringPayload(event.payload, 'deliverableTitle') ?? 'Deliverable';
      const version = numberPayload(event.payload, 'version');
      const changeNotes = event.payload.changeNotes;

      return {
        id: event.id,
        dateLabel,
        title: `Executive Brain улучшил ${title}`,
        reason: 'Improve создал новую версию существующего deliverable.',
        consequence:
          Array.isArray(changeNotes) && changeNotes.length > 0
            ? changeNotes.filter((note) => typeof note === 'string').join(' ')
            : version
              ? `Создана версия v${version}.`
              : 'Deliverable обновлён.',
        nextRecommendation: 'Проверить улучшенную версию в Results.',
      };
    }

    case RUNTIME_EVENT_TYPES.MEMORY_ENTRY_CREATED: {
      const importance = stringPayload(event.payload, 'importance');
      const task = stringPayload(event.payload, 'task');
      const intent = stringPayload(event.payload, 'intent') as ExecutiveGoal | null;

      if (importance !== 'high' || !task) {
        return null;
      }

      const title = task.length > 64 ? `${task.slice(0, 61)}…` : task;

      return {
        id: event.id,
        dateLabel,
        title,
        reason: 'Gateway зафиксировал значимый результат в Memory проекта.',
        consequence: intent
          ? `Memory связала результат с целью «${goalLabel(intent)}».`
          : 'Контекст проекта обогащён новым решением.',
        nextRecommendation: 'Использовать результат в следующем шаге.',
      };
    }

    default:
      return null;
  }
}

function shouldIncludeExecutiveDecision(events: RuntimeEventRecord[]): boolean {
  return !events.some((event) => event.type === RUNTIME_EVENT_TYPES.PROJECT_LIFECYCLE_COMPLETED);
}

function dedupeEntries(entries: ExecutiveMemoryEntry[]): ExecutiveMemoryEntry[] {
  const seen = new Set<string>();
  const result: ExecutiveMemoryEntry[] = [];

  for (const entry of entries) {
    const key = `${entry.dateLabel}:${entry.title}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(entry);
  }

  return result;
}

export function buildExecutiveMemory(
  events: RuntimeEventRecord[],
  context: BuildExecutiveMemoryContext,
): ExecutiveMemory {
  const chronological = [...events].sort((left, right) =>
    left.timestamp.localeCompare(right.timestamp),
  );
  const includeExecutiveDecision = shouldIncludeExecutiveDecision(chronological);
  const entries: ExecutiveMemoryEntry[] = [];

  for (const event of chronological) {
    if (MEMORY_EXCLUDED_TYPES.has(event.type)) {
      continue;
    }

    if (
      event.type === RUNTIME_EVENT_TYPES.EXECUTIVE_DECISION_RECORDED &&
      !includeExecutiveDecision
    ) {
      continue;
    }

    if (
      event.type === RUNTIME_EVENT_TYPES.WORKSPACE_ORCHESTRA_RESOLVED &&
      chronological.some(
        (candidate) =>
          candidate.type === RUNTIME_EVENT_TYPES.ORCHESTRA_BLOCKED_RESOLVED &&
          candidate.timestamp === event.timestamp,
      )
    ) {
      continue;
    }

    const mapped = mapEventToMemoryEntry(event, context);

    if (!mapped) {
      continue;
    }

    if (Array.isArray(mapped)) {
      entries.push(...mapped);
    } else {
      entries.push(mapped);
    }
  }

  const normalized = dedupeEntries(entries);

  if (normalized.length > 0) {
    const lastIndex = normalized.length - 1;
    const last = normalized[lastIndex]!;

    normalized[lastIndex] = {
      ...last,
      nextRecommendation: defaultNextRecommendation(context),
    };
  }

  return {
    projectTitle: context.header.title,
    entries: normalized,
    isEmpty: normalized.length === 0,
  };
}
