import type { ProjectRuntimeScope } from '@/types/project-runtime';

import type { RuntimeStorage } from '@/lib/storage/runtime-storage';
import {
  clearProjectNamespaces,
  readActiveProjectId as readActiveProjectIdFromStorage,
  writeActiveProjectId as writeActiveProjectIdToStorage,
} from '@/lib/storage/project-storage';
import {
  createRuntimeStorage,
  getRuntimeStorage,
  resetRuntimeStorage,
} from '@/lib/storage/storage-factory';

export type ProjectRuntimeStoreState = RuntimeStorage;

export function createProjectRuntimeStore(): ProjectRuntimeStoreState {
  return createRuntimeStorage({ isolated: true, persistent: false });
}

export function getProjectRuntimeStore(): ProjectRuntimeStoreState {
  return getRuntimeStorage();
}

export function resetProjectRuntimeStore(): void {
  clearProjectNamespaces(getRuntimeStorage());
  resetRuntimeStorage();
}

export function resolveProjectRuntimeStore(store?: ProjectRuntimeStoreState): ProjectRuntimeStoreState {
  return store ?? getProjectRuntimeStore();
}

export function readActiveProjectId(
  organizationId: string,
  userId: string | null | undefined,
  store?: ProjectRuntimeStoreState,
): string | null {
  return readActiveProjectIdFromStorage(resolveProjectRuntimeStore(store), organizationId, userId);
}

export function writeActiveProjectId(
  organizationId: string,
  userId: string | null | undefined,
  projectRuntimeId: string,
  store?: ProjectRuntimeStoreState,
): void {
  writeActiveProjectIdToStorage(
    resolveProjectRuntimeStore(store),
    organizationId,
    userId,
    projectRuntimeId,
  );
}
