import { findMemory } from '@/lib/memory/memory-engine';
import { getActiveProject, resolveGatewayActiveProject } from '@/lib/project-runtime/active-project';
import { isDefaultWorkspaceId } from '@/lib/project-runtime/constants';
import type { ProjectRuntime } from '@/types/project-runtime';
import type { GatewayRequest, PromptMessage } from '@/types/runtime/dto';
import type { ExecutiveScope } from '@/types/executive';

export type ExecutiveContext = {
  scope: ExecutiveScope;
  userTask: string | null;
  routingIntent: string | null;
  requestedProjectId: string | null;
  activeProject: ProjectRuntime;
  hasProjectMemory: boolean;
  hasRecentMemory: boolean;
  hasOrganizationMemory: boolean;
  isContinuationCue: boolean;
  isNewProjectCue: boolean;
};

const CONTINUATION_PATTERNS = [
  'продолж',
  'дальше',
  'следующ',
  'next step',
  'continue',
  'resume',
  'доработ',
];

const NEW_PROJECT_PATTERNS = [
  'новый проект',
  'создать проект',
  'новая задача',
  'start new project',
  'new project',
];

export function extractExecutiveUserTask(messages: PromptMessage[]): string | null {
  const userMessages = messages.filter((message) => message.role === 'user');

  if (userMessages.length === 0) {
    return null;
  }

  const content = userMessages[userMessages.length - 1]?.content.trim();
  return content || null;
}

function matchesCue(haystack: string, patterns: string[]): boolean {
  return patterns.some((pattern) => haystack.includes(pattern));
}

export function buildExecutiveContext(request: GatewayRequest): ExecutiveContext {
  const scope: ExecutiveScope = {
    organizationId: request.scope.organizationId,
    userId: request.scope.userId ?? null,
  };

  const userTask = extractExecutiveUserTask(request.messages);
  const normalizedTask = userTask?.toLowerCase() ?? '';
  const requestedProjectId = request.scope.projectId ?? null;
  const activeProject = resolveGatewayActiveProject(scope, requestedProjectId);

  const projectMemoryEntries = findMemory({
    organizationId: scope.organizationId,
    userId: scope.userId ?? undefined,
    limit: 1,
    projectId: requestedProjectId ?? undefined,
  });

  const recentMemoryEntries = findMemory({
    organizationId: scope.organizationId,
    userId: scope.userId ?? undefined,
    limit: 1,
  });

  const organizationMemoryEntries = findMemory({
    organizationId: scope.organizationId,
    limit: 1,
    scope: 'business',
  });

  const explicitActive = getActiveProject(scope);
  const hasActiveNonDefault =
    Boolean(explicitActive) && !isDefaultWorkspaceId(explicitActive!.id);

  return {
    scope,
    userTask,
    routingIntent: request.routing?.intent ?? null,
    requestedProjectId,
    activeProject,
    hasProjectMemory: projectMemoryEntries.length > 0,
    hasRecentMemory: recentMemoryEntries.length > 0,
    hasOrganizationMemory: organizationMemoryEntries.length > 0,
    isContinuationCue:
      matchesCue(normalizedTask, CONTINUATION_PATTERNS) ||
      (hasActiveNonDefault && Boolean(activeProject.lastActivity)),
    isNewProjectCue: matchesCue(normalizedTask, NEW_PROJECT_PATTERNS),
  };
}
