import { getLastExecutiveDecision } from '@/lib/executive/executive-engine';
import { goalLabel } from '@/lib/executive/executive-goals';
import { projectTypeLabel } from '@/lib/project-lifecycle/detect-project-type';
import type { ExecutiveGoal } from '@/types/executive';
import type { EventRuntimeSource, RuntimeEventRecord } from '@/types/event-runtime';
import { RUNTIME_EVENT_TYPES } from '@/types/event-runtime';
import { getOsaAgentById } from '@/utils/osa/agent-registry';
import type { OsaAgentId } from '@/utils/osa/agent-registry';
import type { ProjectType } from '@/utils/projects/project-types';

export type ProjectReplayScene = {
  id: string;
  timeLabel: string;
  description: string;
  source: EventRuntimeSource;
  sourceLabel: string;
  icon: string;
};

export type ProjectReplay = {
  projectTitle: string;
  scenes: ProjectReplayScene[];
  isEmpty: boolean;
};

const REPLAY_EXCLUDED_TYPES = new Set<string>([
  RUNTIME_EVENT_TYPES.WORKSPACE_LOADED,
  RUNTIME_EVENT_TYPES.MORNING_BRIEFING_PREPARED,
  RUNTIME_EVENT_TYPES.EXECUTIVE_POST_CAPTURE_RECORDED,
]);

const SOURCE_LABELS: Record<EventRuntimeSource, string> = {
  project_lifecycle: 'Project Lifecycle',
  executive_brain: 'Executive Brain',
  memory: 'Memory',
  navigator: 'Navigator',
  ai_orchestra: 'AI Orchestra',
  workspace: 'Workspace',
  morning_briefing: 'Morning Briefing',
};

const SOURCE_ICONS: Record<EventRuntimeSource, string> = {
  project_lifecycle: '◎',
  executive_brain: '◈',
  memory: '◌',
  navigator: '◦',
  ai_orchestra: '◉',
  workspace: '→',
  morning_briefing: '☀',
};

function stringPayload(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];

  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function numberPayload(payload: Record<string, unknown>, key: string): number | null {
  const value = payload[key];

  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatReplayTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
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

function sceneBase(event: RuntimeEventRecord, index: number): Omit<ProjectReplayScene, 'description' | 'icon'> {
  return {
    id: `${event.id}:${index}`,
    timeLabel: formatReplayTime(event.timestamp),
    source: event.source,
    sourceLabel: SOURCE_LABELS[event.source],
  };
}

function expandEventToScenes(event: RuntimeEventRecord, projectTitle: string): ProjectReplayScene[] {
  const base = sceneBase(event, 0);
  const icon = SOURCE_ICONS[event.source];

  switch (event.type) {
    case RUNTIME_EVENT_TYPES.PROJECT_LIFECYCLE_STARTED: {
      const name = stringPayload(event.payload, 'projectName') ?? projectTitle;

      return [
        {
          ...base,
          icon,
          description: `Создан проект «${name}».`,
        },
      ];
    }

    case RUNTIME_EVENT_TYPES.PROJECT_LIFECYCLE_COMPLETED: {
      const detectedType = stringPayload(event.payload, 'detectedType') as ProjectType | null;
      const typeLabel = detectedType ? projectTypeLabel(detectedType) : null;

      return [
        {
          ...base,
          icon,
          description: typeLabel
            ? `Executive Brain определил тип проекта: ${typeLabel}.`
            : 'Executive Brain организовал проект.',
        },
      ];
    }

    case RUNTIME_EVENT_TYPES.EXECUTIVE_DECISION_RECORDED: {
      const goal = stringPayload(event.payload, 'goal') as ExecutiveGoal | null;

      return [
        {
          ...base,
          icon,
          description: goal
            ? `Executive Brain выбрал цель: ${goalLabel(goal)}.`
            : 'Executive Brain зафиксировал решение.',
        },
      ];
    }

    case RUNTIME_EVENT_TYPES.ORCHESTRA_INITIALIZED: {
      const agentCount = numberPayload(event.payload, 'agentCount');
      const activeRole = resolveOrchestraAgentRole(stringPayload(event.payload, 'activeAgentId'));
      const scenes: ProjectReplayScene[] = [
        {
          ...base,
          icon,
          description: agentCount
            ? `Подобрана AI-команда из ${agentCount} специалистов.`
            : 'Подобрана AI-команда.',
        },
      ];

      if (activeRole) {
        scenes.push({
          ...sceneBase(event, 1),
          icon,
          description: `${activeRole} начал работу.`,
          source: event.source,
          sourceLabel: SOURCE_LABELS[event.source],
        });
      }

      return scenes;
    }

    case RUNTIME_EVENT_TYPES.ORCHESTRA_AGENT_ADVANCED: {
      const completedRole = stringPayload(event.payload, 'completedAgentRole');
      const nextRole = resolveOrchestraAgentRole(stringPayload(event.payload, 'activeAgentId'));
      const scenes: ProjectReplayScene[] = [];

      if (completedRole) {
        scenes.push({
          ...base,
          icon,
          description: `${completedRole} завершил этап.`,
        });
      }

      if (nextRole && nextRole !== completedRole) {
        scenes.push({
          ...sceneBase(event, scenes.length),
          icon,
          description: `${nextRole} начал работу.`,
          source: event.source,
          sourceLabel: SOURCE_LABELS[event.source],
        });
      }

      return scenes;
    }

    case RUNTIME_EVENT_TYPES.ORCHESTRA_BLOCKED_RESOLVED:
    case RUNTIME_EVENT_TYPES.WORKSPACE_ORCHESTRA_RESOLVED:
      return [
        {
          ...base,
          icon,
          description: 'Решение подтверждено.',
        },
      ];

    case RUNTIME_EVENT_TYPES.NAVIGATOR_STATE_UPDATED:
      return [
        {
          ...base,
          icon,
          description: 'Navigator обновил маршрут проекта.',
        },
      ];

    case RUNTIME_EVENT_TYPES.MEMORY_ENTRY_CREATED: {
      const importance = stringPayload(event.payload, 'importance');
      const task = stringPayload(event.payload, 'task');

      if (importance !== 'high' || !task) {
        return [];
      }

      return [
        {
          ...base,
          icon,
          description: task.length > 72 ? `${task.slice(0, 69)}…` : task,
        },
      ];
    }

    case RUNTIME_EVENT_TYPES.WORKSPACE_PROMPT_SUBMITTED:
      return [
        {
          ...base,
          icon,
          description: 'Задача отправлена в работу.',
        },
      ];

    case RUNTIME_EVENT_TYPES.WORKSPACE_PROMPT_COMPLETED:
      return [
        {
          ...base,
          icon,
          description: 'OSA завершила ответ.',
        },
      ];

    case RUNTIME_EVENT_TYPES.DELIVERABLE_REVIEW_COMPLETED: {
      const title = stringPayload(event.payload, 'deliverableTitle') ?? 'Deliverable';
      const score = numberPayload(event.payload, 'score');

      return [
        {
          ...base,
          icon: '◈',
          description:
            score !== null
              ? `Executive Review: ${title} — ${score}/100`
              : `Executive Review: ${title}`,
        },
      ];
    }

    case RUNTIME_EVENT_TYPES.DELIVERABLE_IMPROVED: {
      const title = stringPayload(event.payload, 'deliverableTitle') ?? 'Deliverable';
      const version = numberPayload(event.payload, 'version');

      return [
        {
          ...base,
          icon: '◈',
          description:
            version !== null
              ? `${title} улучшен — v${version}`
              : `${title} улучшен Executive Brain`,
        },
      ];
    }

    case RUNTIME_EVENT_TYPES.WORKSPACE_PROMPT_FAILED:
      return [
        {
          ...base,
          icon,
          description: 'Задача не выполнена.',
        },
      ];

    default:
      return [];
  }
}

function shouldIncludeExecutiveDecision(events: RuntimeEventRecord[]): boolean {
  return !events.some((event) => event.type === RUNTIME_EVENT_TYPES.PROJECT_LIFECYCLE_COMPLETED);
}

function dedupeScenes(scenes: ProjectReplayScene[]): ProjectReplayScene[] {
  const seen = new Set<string>();
  const result: ProjectReplayScene[] = [];

  for (const scene of scenes) {
    const key = `${scene.timeLabel}:${scene.description}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(scene);
  }

  return result;
}

export function buildProjectReplay(
  events: RuntimeEventRecord[],
  projectTitle: string,
): ProjectReplay {
  const chronological = [...events].sort((left, right) =>
    left.timestamp.localeCompare(right.timestamp),
  );

  const includeExecutiveDecision = shouldIncludeExecutiveDecision(chronological);
  const scenes: ProjectReplayScene[] = [];

  for (const event of chronological) {
    if (REPLAY_EXCLUDED_TYPES.has(event.type)) {
      continue;
    }

    if (
      event.type === RUNTIME_EVENT_TYPES.EXECUTIVE_DECISION_RECORDED &&
      !includeExecutiveDecision
    ) {
      continue;
    }

    scenes.push(...expandEventToScenes(event, projectTitle));
  }

  const normalized = dedupeScenes(scenes);

  return {
    projectTitle,
    scenes: normalized,
    isEmpty: normalized.length === 0,
  };
}

export function replaySourceLabel(source: EventRuntimeSource): string {
  return SOURCE_LABELS[source];
}
