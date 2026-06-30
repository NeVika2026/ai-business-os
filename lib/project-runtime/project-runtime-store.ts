import type { ProjectRuntime } from '@/types/project-runtime';

export type ProjectRuntimeStoreState = {
  runtimes: Map<string, ProjectRuntime>;
  activeByScope: Map<string, string>;
};

function scopeKey(organizationId: string, userId: string | null | undefined): string {
  return `${organizationId}:${userId ?? 'anonymous'}`;
}

export function createProjectRuntimeStore(): ProjectRuntimeStoreState {
  return {
    runtimes: new Map(),
    activeByScope: new Map(),
  };
}

let defaultStore: ProjectRuntimeStoreState | null = null;

export function getProjectRuntimeStore(): ProjectRuntimeStoreState {
  if (!defaultStore) {
    defaultStore = createProjectRuntimeStore();
  }

  return defaultStore;
}

export function resetProjectRuntimeStore(): void {
  defaultStore = createProjectRuntimeStore();
}

export function resolveProjectRuntimeStore(store?: ProjectRuntimeStoreState): ProjectRuntimeStoreState {
  return store ?? getProjectRuntimeStore();
}

export function readActiveProjectId(
  organizationId: string,
  userId: string | null | undefined,
  store?: ProjectRuntimeStoreState,
): string | null {
  const state = resolveProjectRuntimeStore(store);
  return state.activeByScope.get(scopeKey(organizationId, userId)) ?? null;
}

export function writeActiveProjectId(
  organizationId: string,
  userId: string | null | undefined,
  projectRuntimeId: string,
  store?: ProjectRuntimeStoreState,
): void {
  const state = resolveProjectRuntimeStore(store);
  state.activeByScope.set(scopeKey(organizationId, userId), projectRuntimeId);
}
