import { recordExecutivePostCapture } from '@/lib/executive/executive-engine';
import { captureGatewayMemory } from '@/lib/memory/memory-engine';
import { ensureProject, findProject } from '@/lib/memory/memory-projects';
import type { ExecutiveDecision } from '@/types/executive';
import {
  isDefaultWorkspace,
  resolveGatewayActiveProject,
  resolveGatewayProjectId,
} from '@/lib/project-runtime/active-project';
import {
  recordProjectRuntimeFromGateway,
  syncProjectMemoryState,
} from '@/lib/project-runtime/project-runtime-memory';
import type { GatewayRequest, GatewayResponse, PromptMessage } from '@/types/runtime/dto';
import type { MemoryEntry } from '@/types/memory';

import { buildGatewayMemoryContext } from './context-builder';

const MEMORY_CONTEXT_MARKER = 'Continue from previous work.';

function isMemoryContextMessage(message: PromptMessage): boolean {
  return message.role === 'system' && message.content.includes(MEMORY_CONTEXT_MARKER);
}

function extractUserTask(messages: PromptMessage[]): string | null {
  const userMessages = messages.filter((message) => message.role === 'user');

  if (userMessages.length === 0) {
    return null;
  }

  const content = userMessages[userMessages.length - 1]?.content.trim();
  return content || null;
}

export function applyGatewayMemoryInjection(
  request: GatewayRequest,
  decision?: ExecutiveDecision | null,
): GatewayRequest {
  if (decision?.memoryMode === 'none') {
    return request;
  }

  if (request.messages.some(isMemoryContextMessage)) {
    return request;
  }

  const scope = {
    organizationId: request.scope.organizationId,
    userId: request.scope.userId ?? null,
  };

  const requestedProjectId = request.scope.projectId ?? null;
  const activeProject = resolveGatewayActiveProject(scope, requestedProjectId);
  syncProjectMemoryState(activeProject);

  const memoryProjectId =
    (requestedProjectId && findProject({ id: requestedProjectId })?.id) ||
    (!isDefaultWorkspace(activeProject) && activeProject.title.trim()
      ? ensureProject({
          organizationId: scope.organizationId,
          name: activeProject.title,
          userId: scope.userId,
        }).id
      : null);

  const resolvedProjectId = resolveGatewayProjectId(scope) ?? requestedProjectId ?? null;

  const context = buildGatewayMemoryContext({
    organizationId: scope.organizationId,
    userId: scope.userId,
    projectId: memoryProjectId ?? resolvedProjectId,
    projectRuntime: activeProject,
    memoryMode: decision?.memoryMode,
  });

  if (!context.hasMemory) {
    return request;
  }

  return {
    ...request,
    scope: {
      ...request.scope,
      projectId: resolvedProjectId ?? request.scope.projectId,
    },
    messages: [{ role: 'system', content: context.content }, ...request.messages],
  };
}

export function captureGatewayMemoryFromResponse(
  request: GatewayRequest,
  response: GatewayResponse,
  decision?: ExecutiveDecision | null,
): MemoryEntry | null {
  const result = response.content?.trim();

  if (!result) {
    return null;
  }

  const task = extractUserTask(request.messages);

  if (!task) {
    return null;
  }

  const scope = {
    organizationId: request.scope.organizationId,
    userId: request.scope.userId ?? null,
  };

  const activeProject = resolveGatewayActiveProject(scope, request.scope.projectId ?? null);
  const memoryProject =
    !isDefaultWorkspace(activeProject) && activeProject.title.trim()
      ? ensureProject({
          organizationId: scope.organizationId,
          name: activeProject.title,
          userId: scope.userId,
        })
      : null;
  const projectId = memoryProject?.id ?? request.scope.projectId ?? null;

  const entry = captureGatewayMemory({
    task,
    result,
    intent: request.routing?.intent ?? 'gateway_run',
    routingCategory: request.routing?.taskCategory ?? 'unknown',
    organizationId: scope.organizationId,
    userId: scope.userId,
    sessionId: null,
    projectId,
    runId: request.trace.runId,
    correlationId: request.trace.correlationId,
    occurredAt: new Date().toISOString(),
  });

  recordProjectRuntimeFromGateway({
    organizationId: scope.organizationId,
    userId: scope.userId,
    projectRuntimeId: activeProject.id,
    task,
    result,
  });

  syncProjectMemoryState(activeProject);

  recordExecutivePostCapture(scope, decision?.navigatorMode);

  if (!isDefaultWorkspace(activeProject) && projectId) {
    return entry;
  }

  return entry;
}
