import { captureGatewayMemory } from '@/lib/memory/memory-engine';
import { writeExecutiveDecision } from '@/lib/executive/executive-state';
import { goalLabel } from '@/lib/executive/executive-goals';
import { setActiveProject } from '@/lib/project-runtime/active-project';
import { ensureProjectRuntime, updateProjectRuntime } from '@/lib/project-runtime/project-runtime-engine';
import { saveProjectLifecycleSnapshot } from '@/lib/storage/project-lifecycle-storage';
import { saveAiOrchestraState } from '@/lib/storage/ai-orchestra-storage';
import { saveNavigatorState } from '@/lib/storage/navigator-storage';
import { getRuntimeStorage } from '@/lib/storage/storage-factory';
import { publishRuntimeEvent } from '@/lib/events/event-runtime';
import { RUNTIME_EVENT_TYPES } from '@/types/event-runtime';
import type { ExecutiveDecision, ExecutiveGoal } from '@/types/executive';
import type { ProjectLifecycleSnapshot } from '@/types/project-lifecycle';
import type { ProjectType } from '@/utils/projects/project-types';

import { buildExecutiveBriefText } from './build-executive-brief';
import { buildProjectWorkPlan } from './build-work-plan';
import { detectProjectType, projectTypeLabel } from './detect-project-type';
import { initializeAiOrchestra } from './ai-orchestra-engine';
import { selectProjectSpecialists } from './select-specialists';

export type RunProjectLifecycleInput = {
  projectId: string;
  name: string;
  description: string | null;
  declaredType: ProjectType;
  organizationId: string;
  userId: string;
};

export type RunProjectLifecycleResult = {
  snapshot: ProjectLifecycleSnapshot;
  workspacePath: string;
};

function goalForProjectType(type: ProjectType): ExecutiveGoal {
  switch (type) {
    case 'marketing':
      return 'create_content';
    case 'crm':
    case 'estate':
    case 'mlm':
      return 'find_clients';
    case 'finance':
      return 'business_analysis';
    case 'automation':
    case 'knowledge':
      return 'design';
    default:
      return 'business_analysis';
  }
}

function buildFirstStepPrompt(projectName: string, firstStep: string): string {
  const normalized = firstStep.endsWith('.') ? firstStep : `${firstStep}.`;

  return `Начни выполнение первого шага проекта «${projectName}»: ${normalized}`;
}

function buildExecutiveDecision(
  input: RunProjectLifecycleInput,
  goal: ExecutiveGoal,
  firstStep: string,
): ExecutiveDecision {
  const decision: ExecutiveDecision = {
    goal,
    workingMode: 'new_task',
    projectDecision: 'continue_active',
    projectId: input.projectId,
    memoryMode: 'project',
    navigatorMode: 'next_step',
    summary: '',
    reasoning: [`projectLifecycle=${input.projectId}`, `firstStep=${firstStep}`],
    confidence: 0.9,
  };

  decision.summary = `${goalLabel(goal)} · новая задача · активный проект · память проекта`;

  return decision;
}

export function runProjectLifecycle(input: RunProjectLifecycleInput): RunProjectLifecycleResult {
  const storage = getRuntimeStorage();
  const scope = {
    organizationId: input.organizationId,
    userId: input.userId,
  };

  publishRuntimeEvent(
    {
      projectId: input.projectId,
      type: RUNTIME_EVENT_TYPES.PROJECT_LIFECYCLE_STARTED,
      actor: `user:${input.userId}`,
      source: 'project_lifecycle',
      status: 'pending',
      payload: {
        projectName: input.name,
        declaredType: input.declaredType,
      },
    },
    storage,
  );

  const detectedType = detectProjectType({
    declaredType: input.declaredType,
    name: input.name,
    description: input.description,
  });

  const specialists = selectProjectSpecialists(detectedType);
  const workPlan = buildProjectWorkPlan(detectedType, input.name);
  const firstStep = workPlan[0]?.title ?? `Продолжить проект «${input.name}»`;
  const executiveBrief = buildExecutiveBriefText({
    projectName: input.name,
    projectType: detectedType,
    specialists,
    workPlan,
  });

  const goal = goalForProjectType(detectedType);
  const firstStepPrompt = buildFirstStepPrompt(input.name, firstStep);

  ensureProjectRuntime({
    id: input.projectId,
    sourceProjectId: input.projectId,
    title: input.name,
    description: input.description ?? '',
    status: 'planning',
    organizationId: input.organizationId,
    userId: input.userId,
    mission: workPlan[0]?.title ?? `Продвинуть проект «${input.name}».`,
    summary: executiveBrief,
    nextStep: firstStep,
  });

  updateProjectRuntime(input.projectId, {
    status: 'active',
    navigatorState: {
      lastSuggestedStepId: 'quick_result',
      selectedStepId: 'quick_result',
    },
  });

  setActiveProject(scope, input.projectId);

  writeExecutiveDecision(scope, buildExecutiveDecision(input, goal, firstStep), storage);

  saveNavigatorState(storage, {
    organizationId: input.organizationId,
    userId: input.userId,
    navigatorMode: 'next_step',
    lastSuggestedStepId: 'quick_result',
    selectedStepId: 'quick_result',
  });

  captureGatewayMemory({
    task: `OSA организовала проект «${input.name}»`,
    result: executiveBrief,
    intent: goal,
    routingCategory: 'planning',
    organizationId: input.organizationId,
    userId: input.userId,
    projectName: input.name,
    scope: 'project',
    importance: 'high',
  });

  captureGatewayMemory({
    task: 'Рабочий план проекта',
    result: workPlan.map((step, index) => `${index + 1}. ${step.title}`).join(' · '),
    intent: goal,
    routingCategory: 'planning',
    organizationId: input.organizationId,
    userId: input.userId,
    projectName: input.name,
    scope: 'project',
  });

  const snapshot: ProjectLifecycleSnapshot = {
    projectId: input.projectId,
    projectName: input.name,
    detectedType,
    detectedTypeLabel: projectTypeLabel(detectedType),
    specialists: specialists.map((member) => ({
      role: member.role,
      status: member.status,
    })),
    workPlan: workPlan.map((step) => ({
      title: step.title,
      estimate: step.estimate,
      priorityLabel: step.priorityLabel,
    })),
    executiveBrief,
    firstStepPrompt,
    organizedAt: new Date().toISOString(),
  };

  saveProjectLifecycleSnapshot(storage, snapshot);

  const orchestra = initializeAiOrchestra({
    projectId: input.projectId,
    projectName: input.name,
    description: input.description ?? '',
    specialists,
    workPlan,
    organizationId: input.organizationId,
    userId: input.userId,
    goal,
  });

  saveAiOrchestraState(storage, orchestra);

  publishRuntimeEvent(
    {
      projectId: input.projectId,
      type: RUNTIME_EVENT_TYPES.ORCHESTRA_INITIALIZED,
      actor: 'system:ai-orchestra',
      source: 'ai_orchestra',
      payload: {
        projectName: input.name,
        agentCount: orchestra.queue.length,
        executionMode: orchestra.executionMode,
        activeAgentId: orchestra.activeAgentId,
      },
    },
    storage,
  );

  captureGatewayMemory({
    task: 'AI Orchestra запущена',
    result: orchestra.queue
      .map((agent) => `${agent.role}: ${agent.taskTitle}`)
      .join(' · '),
    intent: goal,
    routingCategory: 'planning',
    organizationId: input.organizationId,
    userId: input.userId,
    projectName: input.name,
    scope: 'project',
    importance: 'high',
  });

  publishRuntimeEvent(
    {
      projectId: input.projectId,
      type: RUNTIME_EVENT_TYPES.PROJECT_LIFECYCLE_COMPLETED,
      actor: 'system:project-lifecycle',
      source: 'project_lifecycle',
      payload: {
        projectName: input.name,
        detectedType,
        specialistCount: specialists.length,
        workPlanSteps: workPlan.length,
        orchestraProgress: orchestra.overallProgress,
      },
    },
    storage,
  );

  return {
    snapshot,
    workspacePath: `/workspace/${input.projectId}?lifecycle=1`,
  };
}
