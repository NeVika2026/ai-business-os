import { getLastExecutiveDecision } from '@/lib/executive/executive-engine';
import { writeExecutiveDecision } from '@/lib/executive/executive-state';
import { captureGatewayMemory } from '@/lib/memory/memory-engine';
import { loadAiOrchestraState, saveAiOrchestraState } from '@/lib/storage/ai-orchestra-storage';
import { getRuntimeStorage } from '@/lib/storage/storage-factory';
import { publishRuntimeEvent } from '@/lib/events/event-runtime';
import { RUNTIME_EVENT_TYPES } from '@/types/event-runtime';
import type { AiOrchestraState, OrchestraAgent } from '@/types/ai-orchestra';
import type { ExecutiveGoal, ExecutiveScope } from '@/types/executive';
import { getOsaAgentById } from '@/utils/osa/agent-registry';

import { calculateOrchestraProgress, createInitialOrchestraQueue } from './build-ai-orchestra';
import type { ProjectLifecyclePlanStep } from './build-work-plan';
import type { ProjectLifecycleSpecialist } from './select-specialists';

export type InitializeAiOrchestraInput = {
  projectId: string;
  projectName: string;
  description: string;
  specialists: ProjectLifecycleSpecialist[];
  workPlan: ProjectLifecyclePlanStep[];
  organizationId: string;
  userId: string;
  goal: ExecutiveGoal;
};

function cloneQueue(queue: OrchestraAgent[]): OrchestraAgent[] {
  return queue.map((agent) => ({ ...agent }));
}

function workingActivity(agentId: string, taskTitle: string): string {
  const agent = getOsaAgentById(agentId as Parameters<typeof getOsaAgentById>[0]);

  return `${agent?.defaultStatus ?? 'В работе'}: ${taskTitle}`;
}

export function initializeAiOrchestra(input: InitializeAiOrchestraInput): AiOrchestraState {
  const { queue, executionMode, reviewRequired } = createInitialOrchestraQueue({
    specialists: input.specialists,
    workPlan: input.workPlan,
    projectName: input.projectName,
    description: input.description,
  });

  return {
    projectId: input.projectId,
    projectName: input.projectName,
    executionMode,
    queue,
    activeAgentId: queue.find((agent) => agent.status === 'working')?.id ?? null,
    reviewRequired,
    overallProgress: calculateOrchestraProgress(queue),
    updatedAt: new Date().toISOString(),
  };
}

export function recalculateOrchestraQueue(state: AiOrchestraState): AiOrchestraState {
  const queue = cloneQueue(state.queue);
  const hasWorking = queue.some((agent) => agent.status === 'working');

  if (!hasWorking) {
    const nextIndex = queue.findIndex((agent) => agent.status === 'waiting');

    if (nextIndex >= 0) {
      const next = queue[nextIndex]!;

      queue[nextIndex] = {
        ...next,
        status: 'working',
        progressPercent: Math.max(next.progressPercent, 8),
        currentActivity: workingActivity(next.agentId, next.taskTitle),
      };
    }
  }

  if (state.reviewRequired) {
    const completedCount = queue.filter((agent) => agent.status === 'completed').length;
    const reviewThreshold = Math.max(queue.length - 2, 1);

    if (completedCount >= reviewThreshold) {
      for (let index = 0; index < queue.length; index += 1) {
        const item = queue[index]!;

        if (item.status !== 'waiting') {
          continue;
        }

        if (item.taskTitle.toLowerCase().includes('review') || index >= queue.length - 2) {
          queue[index] = {
            ...item,
            status: 'blocked',
            blockedReason: 'Executive Brain ждёт вашего решения перед финальной проверкой.',
            currentActivity: 'Ожидает решения пользователя',
          };
        }
      }
    }
  }

  return {
    ...state,
    queue,
    activeAgentId: queue.find((agent) => agent.status === 'working')?.id ?? null,
    overallProgress: calculateOrchestraProgress(queue),
    updatedAt: new Date().toISOString(),
  };
}

export function advanceOrchestraAgent(
  state: AiOrchestraState,
  options?: { unblock?: boolean },
): AiOrchestraState {
  const queue = cloneQueue(state.queue);
  const workingIndex = queue.findIndex((agent) => agent.status === 'working');

  if (workingIndex >= 0) {
    const working = queue[workingIndex]!;

    queue[workingIndex] = {
      ...working,
      status: 'completed',
      progressPercent: 100,
      currentActivity: `Завершил: ${working.taskTitle}`,
    };
  }

  if (options?.unblock) {
    for (let index = 0; index < queue.length; index += 1) {
      const item = queue[index]!;

      if (item.status !== 'blocked') {
        continue;
      }

      queue[index] = {
        ...item,
        status: 'waiting',
        blockedReason: null,
        currentActivity: `Готов к запуску — ${item.role}`,
      };
    }
  }

  const nextIndex = queue.findIndex((agent) => agent.status === 'waiting');

  if (nextIndex >= 0) {
    const next = queue[nextIndex]!;

    queue[nextIndex] = {
      ...next,
      status: 'working',
      progressPercent: Math.max(next.progressPercent, 12),
      currentActivity: workingActivity(next.agentId, next.taskTitle),
    };
  }

  return recalculateOrchestraQueue({
    ...state,
    queue,
    activeAgentId: queue.find((agent) => agent.status === 'working')?.id ?? null,
  });
}

function syncExecutiveWithOrchestra(
  scope: ExecutiveScope,
  state: AiOrchestraState,
  storage: ReturnType<typeof getRuntimeStorage>,
): void {
  const executive = getLastExecutiveDecision(scope);

  if (!executive) {
    return;
  }

  const activeAgent = state.queue.find((agent) => agent.id === state.activeAgentId);
  const summaryBase = executive.summary.split(' · ')[0] ?? executive.summary;

  writeExecutiveDecision(
    scope,
    {
      ...executive,
      navigatorMode: activeAgent ? 'next_step' : executive.navigatorMode,
      summary: activeAgent ? `${summaryBase} · ${activeAgent.role} в работе` : executive.summary,
      reasoning: [
        ...executive.reasoning.filter((entry) => !entry.startsWith('orchestra=') && !entry.startsWith('activeAgent=')),
        `orchestra=${state.overallProgress}%`,
        activeAgent ? `activeAgent=${activeAgent.role}` : 'orchestra=idle',
      ],
    },
    storage,
  );
}

export function advanceAiOrchestraForProject(
  projectId: string,
  scope: ExecutiveScope,
  options?: {
    unblock?: boolean;
    organizationId?: string;
    userId?: string;
    projectName?: string;
    goal?: ExecutiveGoal;
  },
): AiOrchestraState | null {
  const storage = getRuntimeStorage();
  const state = loadAiOrchestraState(storage, projectId);

  if (!state) {
    return null;
  }

  const next = advanceOrchestraAgent(state, options);
  saveAiOrchestraState(storage, next);
  syncExecutiveWithOrchestra(scope, next, storage);

  const completedAgent = state.queue.find((agent) => agent.id === state.activeAgentId);

  publishRuntimeEvent(
    {
      projectId,
      type: options?.unblock
        ? RUNTIME_EVENT_TYPES.ORCHESTRA_BLOCKED_RESOLVED
        : RUNTIME_EVENT_TYPES.ORCHESTRA_AGENT_ADVANCED,
      actor: options?.userId ? `user:${options.userId}` : 'system:ai-orchestra',
      source: 'ai_orchestra',
      payload: {
        completedAgentId: completedAgent?.id ?? null,
        completedAgentRole: completedAgent?.role ?? null,
        activeAgentId: next.activeAgentId,
        overallProgress: next.overallProgress,
        completedCount: next.queue.filter((agent) => agent.status === 'completed').length,
      },
    },
    storage,
  );

  if (options?.organizationId && options.userId) {
    captureGatewayMemory({
      task: completedAgent
        ? `${completedAgent.role} завершил этап`
        : 'AI Orchestra обновила очередь',
      result:
        next.queue
          .filter((agent) => agent.status === 'completed')
          .map((agent) => agent.taskTitle)
          .join(' · ') || 'Прогресс обновлён',
      intent: options.goal ?? 'business_analysis',
      routingCategory: 'planning',
      organizationId: options.organizationId,
      userId: options.userId,
      projectName: options.projectName ?? state.projectName,
      scope: 'project',
    });
  }

  return next;
}

export function resolveOrchestraBlocked(
  projectId: string,
  scope: ExecutiveScope,
  context: { organizationId: string; userId: string; goal?: ExecutiveGoal },
): AiOrchestraState | null {
  return advanceAiOrchestraForProject(projectId, scope, {
    unblock: true,
    organizationId: context.organizationId,
    userId: context.userId,
    goal: context.goal,
  });
}

export function loadProjectOrchestra(projectId: string): AiOrchestraState | null {
  return loadAiOrchestraState(getRuntimeStorage(), projectId);
}
