import type { ProjectRuntime, ProjectRuntimeScope } from '@/types/project-runtime';

import { findProject } from '@/lib/memory/memory-projects';

import {
  buildDefaultWorkspaceId,
  DEFAULT_WORKSPACE_MISSION,
  DEFAULT_WORKSPACE_NEXT_STEP,
  DEFAULT_WORKSPACE_TITLE,
  isDefaultWorkspaceId,
} from './constants';
import {
  ensureProjectRuntime,
  findProjectRuntime,
  listProjectRuntimes,
} from './project-runtime-engine';
import {
  readActiveProjectId,
  resolveProjectRuntimeStore,
  writeActiveProjectId,
  type ProjectRuntimeStoreState,
} from './project-runtime-store';

export { isDefaultWorkspaceId };

export function isDefaultWorkspace(runtime: ProjectRuntime): boolean {
  return isDefaultWorkspaceId(runtime.id);
}

export function ensureDefaultWorkspace(
  scope: ProjectRuntimeScope,
  store?: ProjectRuntimeStoreState,
): ProjectRuntime {
  const id = buildDefaultWorkspaceId(scope.organizationId, scope.userId ?? null);

  return ensureProjectRuntime(
    {
      id,
      title: DEFAULT_WORKSPACE_TITLE,
      description: 'Общее рабочее пространство до выбора проекта.',
      mission: DEFAULT_WORKSPACE_MISSION,
      summary: 'Рабочая среда по умолчанию.',
      nextStep: DEFAULT_WORKSPACE_NEXT_STEP,
      organizationId: scope.organizationId,
      userId: scope.userId ?? null,
      sourceProjectId: null,
      status: 'active',
    },
    store,
  );
}

export function setActiveProject(
  scope: ProjectRuntimeScope,
  projectRuntimeId: string,
  store?: ProjectRuntimeStoreState,
): ProjectRuntime {
  const state = resolveProjectRuntimeStore(store);
  const runtime = state.runtimes.get(projectRuntimeId);

  if (!runtime) {
    throw new Error(`project runtime not found: ${projectRuntimeId}`);
  }

  if (runtime.organizationId !== scope.organizationId) {
    throw new Error('project runtime organization mismatch');
  }

  for (const candidate of state.runtimes.values()) {
    if (
      candidate.organizationId === scope.organizationId &&
      candidate.userId === (scope.userId ?? null)
    ) {
      candidate.active = false;
      state.runtimes.set(candidate.id, candidate);
    }
  }

  runtime.active = true;
  state.runtimes.set(runtime.id, runtime);
  writeActiveProjectId(scope.organizationId, scope.userId, runtime.id, state);

  return runtime;
}

export function getActiveProject(
  scope: ProjectRuntimeScope,
  store?: ProjectRuntimeStoreState,
): ProjectRuntime | null {
  const state = resolveProjectRuntimeStore(store);
  const activeId = readActiveProjectId(scope.organizationId, scope.userId, state);

  if (!activeId) {
    return null;
  }

  return state.runtimes.get(activeId) ?? null;
}

export function resolveActiveProject(
  scope: ProjectRuntimeScope,
  store?: ProjectRuntimeStoreState,
): ProjectRuntime {
  const active = getActiveProject(scope, store);

  if (active) {
    return active;
  }

  const runtimes = listProjectRuntimes(scope, store).filter(
    (runtime) => !isDefaultWorkspaceId(runtime.id),
  );

  if (runtimes.length > 0) {
    const latest = runtimes[0]!;
    return setActiveProject(scope, latest.id, store);
  }

  const defaultWorkspace = ensureDefaultWorkspace(scope, store);
  return setActiveProject(scope, defaultWorkspace.id, store);
}

export function getActiveProjectOrDefault(
  scope: ProjectRuntimeScope,
  store?: ProjectRuntimeStoreState,
): ProjectRuntime {
  return getActiveProject(scope, store) ?? ensureDefaultWorkspace(scope, store);
}

export function resolveGatewayActiveProject(
  scope: ProjectRuntimeScope,
  requestedProjectId?: string | null,
  store?: ProjectRuntimeStoreState,
): ProjectRuntime {
  const explicit = getActiveProject(scope, store);

  if (explicit && !isDefaultWorkspaceId(explicit.id)) {
    return explicit;
  }

  if (requestedProjectId) {
    const byRuntime =
      findProjectRuntime(requestedProjectId, store) ??
      listProjectRuntimes(scope, store).find(
        (runtime) => runtime.sourceProjectId === requestedProjectId,
      );

    if (byRuntime) {
      return byRuntime;
    }

    const memoryProject = findProject({ id: requestedProjectId });

    if (memoryProject) {
      const byTitle = listProjectRuntimes(scope, store).find(
        (runtime) => runtime.title === memoryProject.name,
      );

      if (byTitle) {
        return byTitle;
      }

      return ensureProjectRuntime(
        {
          id: `memory:${requestedProjectId}`,
          title: memoryProject.name,
          organizationId: scope.organizationId,
          userId: scope.userId ?? null,
          sourceProjectId: requestedProjectId,
        },
        store,
      );
    }
  }

  return resolveActiveProject(scope, store);
}

export function resolveGatewayProjectId(
  scope: ProjectRuntimeScope,
  store?: ProjectRuntimeStoreState,
): string | null {
  const runtime = resolveActiveProject(scope, store);

  if (isDefaultWorkspace(runtime)) {
    return null;
  }

  return runtime.sourceProjectId ?? runtime.id;
}
