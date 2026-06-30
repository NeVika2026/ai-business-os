import type { ProjectRuntime } from '@/types/project-runtime';

import type { RuntimeStorage } from './runtime-storage';
import { STORAGE_NAMESPACES } from './storage-types';

const { PROJECT_RUNTIMES, PROJECT_ACTIVE } = STORAGE_NAMESPACES;

function scopeKey(organizationId: string, userId: string | null | undefined): string {
  return `${organizationId}:${userId ?? 'anonymous'}`;
}

export function saveProjectRuntime(storage: RuntimeStorage, runtime: ProjectRuntime): void {
  storage.save(PROJECT_RUNTIMES, runtime.id, runtime);
}

export function loadProjectRuntime(storage: RuntimeStorage, id: string): ProjectRuntime | null {
  return storage.load<ProjectRuntime>(PROJECT_RUNTIMES, id);
}

export function listProjectRuntimesFromStorage(storage: RuntimeStorage): ProjectRuntime[] {
  return storage.list<ProjectRuntime>(PROJECT_RUNTIMES);
}

export function projectRuntimeExists(storage: RuntimeStorage, id: string): boolean {
  return storage.exists(PROJECT_RUNTIMES, id);
}

export function readActiveProjectId(
  storage: RuntimeStorage,
  organizationId: string,
  userId: string | null | undefined,
): string | null {
  return storage.load<string>(PROJECT_ACTIVE, scopeKey(organizationId, userId));
}

export function writeActiveProjectId(
  storage: RuntimeStorage,
  organizationId: string,
  userId: string | null | undefined,
  projectRuntimeId: string,
): void {
  storage.save(PROJECT_ACTIVE, scopeKey(organizationId, userId), projectRuntimeId);
}

export function clearProjectNamespaces(storage: RuntimeStorage): void {
  storage.clear(PROJECT_RUNTIMES);
  storage.clear(PROJECT_ACTIVE);
}
