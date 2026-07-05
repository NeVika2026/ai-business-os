import { classifyTaskCategory, estimateReasoningComplexity } from '@/lib/ai/routing-context';
import {
  ensureDefaultWorkspace,
  resolveGatewayProjectId,
  setActiveProject,
} from '@/lib/project-runtime/active-project';
import { isDefaultWorkspaceId } from '@/lib/project-runtime/constants';
import {
  createProjectRuntime,
  findProjectRuntime,
} from '@/lib/project-runtime/project-runtime-engine';
import type { ExecutiveBrainResult, ExecutiveDecision } from '@/types/executive';
import type { GatewayRequest } from '@/types/runtime/dto';

import { buildExecutiveContext, extractExecutiveUserTask } from './executive-context';
import { detectExecutiveGoal, goalLabel } from './executive-goals';
import {
  decideMemoryMode,
  decideNavigatorMode,
  decideProjectAction,
  decideWorkingMode,
} from './executive-next-action';
import { readExecutiveDecision, writeExecutiveDecision } from './executive-state';
import { saveNavigatorState } from '@/lib/storage/navigator-storage';
import { getRuntimeStorage } from '@/lib/storage/storage-factory';
import { publishRuntimeEvent } from '@/lib/events/event-runtime';
import { RUNTIME_EVENT_TYPES } from '@/types/event-runtime';

import { buildExecutiveSummary } from './executive-summary';

function deriveProjectTitle(goal: ExecutiveDecision['goal'], userTask: string | null): string {
  const trimmed = userTask?.trim();

  if (trimmed && trimmed.length <= 80) {
    return trimmed;
  }

  switch (goal) {
    case 'find_clients':
      return 'Поиск клиентов';
    case 'create_content':
      return 'Контент';
    case 'business_analysis':
      return 'Анализ бизнеса';
    case 'design':
      return 'Проектирование';
    default:
      return 'Новый проект';
  }
}

function applyProjectDecision(
  request: GatewayRequest,
  decision: ExecutiveDecision,
): GatewayRequest {
  const scope = {
    organizationId: request.scope.organizationId,
    userId: request.scope.userId ?? null,
  };

  if (decision.projectDecision === 'default_workspace') {
    const workspace = ensureDefaultWorkspace(scope);
    setActiveProject(scope, workspace.id);

    return {
      ...request,
      scope: {
        ...request.scope,
        projectId: null,
      },
    };
  }

  if (decision.projectDecision === 'create_new') {
    const userTask = extractExecutiveUserTask(request.messages);
    const runtime = createProjectRuntime({
      title: deriveProjectTitle(decision.goal, userTask),
      organizationId: scope.organizationId,
      userId: scope.userId,
      mission: `Цель: ${goalLabel(decision.goal)}.`,
      status: 'active',
    });

    setActiveProject(scope, runtime.id);

    return {
      ...request,
      scope: {
        ...request.scope,
        projectId: runtime.sourceProjectId ?? runtime.id,
      },
    };
  }

  if (decision.projectId) {
    const runtime = findProjectRuntime(decision.projectId);

    if (runtime) {
      setActiveProject(scope, runtime.id);
    }

    return {
      ...request,
      scope: {
        ...request.scope,
        projectId: resolveGatewayProjectId(scope) ?? decision.projectId,
      },
    };
  }

  return request;
}

function enrichRouting(request: GatewayRequest, decision: ExecutiveDecision): GatewayRequest {
  if (request.routing) {
    return request;
  }

  const usesAutoRouting =
    request.providerCode === 'auto' || request.modelCode === 'auto';

  if (!usesAutoRouting) {
    return request;
  }

  const userTask = extractExecutiveUserTask(request.messages) ?? '';
  const intent = decision.goal;
  const toolUsage = Boolean(request.tools && request.tools.length > 0);

  const routing = {
    intent,
    taskCategory: classifyTaskCategory(intent, userTask),
    estimatedContextLength: request.messages.reduce(
      (total, message) => total + message.content.length,
      0,
    ),
    reasoningComplexity: estimateReasoningComplexity(intent, userTask, toolUsage),
    latencyTarget: 'balanced' as const,
    costTarget: 'balanced' as const,
    toolUsage,
  };

  return {
    ...request,
    routing,
  };
}

export function evaluateExecutiveDecision(request: GatewayRequest): ExecutiveDecision {
  const context = buildExecutiveContext(request);
  const goal = detectExecutiveGoal(context.userTask, context.routingIntent);
  const workingMode = decideWorkingMode(context);
  const projectDecision = decideProjectAction(context, goal, workingMode);

  let projectId: string | null = null;

  if (projectDecision === 'continue_active') {
    projectId = isDefaultWorkspaceId(context.activeProject.id)
      ? context.requestedProjectId
      : context.activeProject.id;
  } else if (projectDecision === 'create_new') {
    projectId = null;
  }

  const memoryMode = decideMemoryMode(context, goal, workingMode, projectDecision);
  const navigatorMode = decideNavigatorMode(goal, projectDecision, workingMode);

  const reasoning = [
    `goal=${goal} from task="${context.userTask ?? ''}"`,
    `workingMode=${workingMode}`,
    `projectDecision=${projectDecision}`,
    `memoryMode=${memoryMode}`,
    `navigatorMode=${navigatorMode}`,
  ];

  const decision: ExecutiveDecision = {
    goal,
    workingMode,
    projectDecision,
    projectId,
    memoryMode,
    navigatorMode,
    summary: '',
    reasoning,
    confidence: context.userTask ? 0.82 : 0.55,
  };

  decision.summary = buildExecutiveSummary(decision);

  return decision;
}

export function applyExecutiveBrain(request: GatewayRequest): ExecutiveBrainResult {
  const decision = evaluateExecutiveDecision(request);
  let enriched = applyProjectDecision(request, decision);
  enriched = enrichRouting(enriched, decision);

  writeExecutiveDecision(
    {
      organizationId: request.scope.organizationId,
      userId: request.scope.userId ?? null,
    },
    decision,
  );

  return {
    request: enriched,
    decision,
  };
}

export function getLastExecutiveDecision(
  scope: { organizationId: string; userId?: string | null },
): ExecutiveDecision | null {
  return readExecutiveDecision(scope);
}

export function recordExecutivePostCapture(
  scope: { organizationId: string; userId?: string | null },
  navigatorMode?: ExecutiveDecision['navigatorMode'],
): void {
  const existing = readExecutiveDecision(scope);

  if (!existing || !navigatorMode) {
    return;
  }

  writeExecutiveDecision(scope, {
    ...existing,
    navigatorMode,
  });

  saveNavigatorState(getRuntimeStorage(), {
    organizationId: scope.organizationId,
    userId: scope.userId ?? null,
    navigatorMode,
    lastSuggestedStepId:
      navigatorMode === 'scale'
        ? 'scale'
        : navigatorMode === 'new_project'
          ? 'build_system'
          : navigatorMode === 'next_step'
            ? 'quick_result'
            : null,
  });

  publishRuntimeEvent({
    projectId: existing.projectId,
    type: RUNTIME_EVENT_TYPES.EXECUTIVE_POST_CAPTURE_RECORDED,
    actor: scope.userId ? `user:${scope.userId}` : 'system:executive-brain',
    source: 'executive_brain',
    payload: {
      navigatorMode,
      goal: existing.goal,
    },
  });
}
