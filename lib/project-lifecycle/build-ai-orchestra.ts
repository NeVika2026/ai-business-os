import type { OrchestraAgent, OrchestraAgentStatus } from '@/types/ai-orchestra';
import { getOsaAgentById, toOsaAgentDefinition } from '@/utils/osa/agent-registry';
import type { ExecutionPlan } from '@/utils/osa/execution-planner';
import { buildExecutionPlan } from '@/utils/osa/execution-planner';

import type { ProjectLifecyclePlanStep } from './build-work-plan';
import type { ProjectLifecycleSpecialist } from './select-specialists';

function workingActivity(status: string, taskTitle: string): string {
  return `${status}: ${taskTitle}`;
}

function waitingActivity(role: string): string {
  return `Ожидает очереди — ${role}`;
}

function buildQueueFromPlan(
  plan: ExecutionPlan,
  specialists: ProjectLifecycleSpecialist[],
  workPlan: ProjectLifecyclePlanStep[],
): OrchestraAgent[] {
  const team = specialists
    .map((member) => getOsaAgentById(member.id))
    .filter((agent): agent is NonNullable<typeof agent> => Boolean(agent))
    .map(toOsaAgentDefinition);

  const queue: OrchestraAgent[] = [];
  let workPlanIndex = 0;

  for (const stage of plan.stages) {
    const agents = stage.assignedAgents.length > 0 ? stage.assignedAgents : team.slice(0, 1);

    for (const agent of agents) {
      const workStep = workPlan[workPlanIndex];
      const taskTitle = workStep?.title ?? stage.title;
      const registryAgent = getOsaAgentById(agent.id);

      queue.push({
        id: `${stage.id}:${agent.id}:${queue.length}`,
        agentId: agent.id,
        name: registryAgent?.name ?? agent.name,
        role: registryAgent?.title ?? agent.name,
        taskTitle,
        currentActivity: waitingActivity(registryAgent?.title ?? agent.name),
        status: 'waiting',
        progressPercent: 0,
        blockedReason: null,
      });

      workPlanIndex += 1;
    }
  }

  if (queue.length === 0) {
    for (const [index, member] of specialists.entries()) {
      const agent = getOsaAgentById(member.id);
      const taskTitle = workPlan[index]?.title ?? `Шаг ${index + 1}`;

      queue.push({
        id: `${member.id}:${index}`,
        agentId: member.id,
        name: agent?.name ?? member.role,
        role: member.role,
        taskTitle,
        currentActivity: waitingActivity(member.role),
        status: 'waiting',
        progressPercent: 0,
        blockedReason: null,
      });
    }
  }

  return queue;
}

export function createInitialOrchestraQueue(input: {
  specialists: ProjectLifecycleSpecialist[];
  workPlan: ProjectLifecyclePlanStep[];
  projectName: string;
  description: string;
  reviewRequired?: boolean;
}): { queue: OrchestraAgent[]; executionMode: ExecutionPlan['executionMode']; reviewRequired: boolean } {
  const team = input.specialists
    .map((member) => getOsaAgentById(member.id))
    .filter((agent): agent is NonNullable<typeof agent> => Boolean(agent))
    .map(toOsaAgentDefinition);

  const plan = buildExecutionPlan({
    userInput: [input.projectName, input.description].filter(Boolean).join('\n'),
    team,
  });

  const queue = buildQueueFromPlan(plan, input.specialists, input.workPlan);

  if (queue[0]) {
    const firstAgent = getOsaAgentById(queue[0].agentId);

    queue[0] = {
      ...queue[0],
      status: 'working',
      progressPercent: 12,
      currentActivity: workingActivity(
        firstAgent?.defaultStatus ?? 'В работе',
        queue[0].taskTitle,
      ),
    };
  }

  if (plan.reviewRequired && queue.length > 1) {
    const reviewStartIndex = Math.max(queue.length - 2, 1);

    for (let index = reviewStartIndex; index < queue.length; index += 1) {
      const item = queue[index];

      if (!item || item.status === 'working') {
        continue;
      }

      queue[index] = {
        ...item,
        status: 'blocked',
        blockedReason: 'Executive Brain ждёт подтверждения перед финальной проверкой.',
        currentActivity: 'Ожидает решения пользователя',
      };
    }
  }

  return {
    queue,
    executionMode: plan.executionMode,
    reviewRequired: plan.reviewRequired,
  };
}

export function orchestraStatusLabel(status: OrchestraAgentStatus): string {
  switch (status) {
    case 'waiting':
      return 'Ожидает';
    case 'working':
      return 'В работе';
    case 'blocked':
      return 'Нужно решение';
    case 'completed':
      return 'Готово';
  }
}

export function calculateOrchestraProgress(queue: OrchestraAgent[]): number {
  if (queue.length === 0) {
    return 0;
  }

  const total = queue.reduce((sum, agent) => sum + agent.progressPercent, 0);

  return Math.min(100, Math.round(total / queue.length));
}
