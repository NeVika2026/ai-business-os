import type { ProjectLifecycleSnapshot } from '@/types/project-lifecycle';

import type { RuntimeStorage } from './runtime-storage';

const NAMESPACE = 'project:lifecycle';

export function saveProjectLifecycleSnapshot(
  storage: RuntimeStorage,
  snapshot: ProjectLifecycleSnapshot,
): void {
  storage.save(NAMESPACE, snapshot.projectId, snapshot);
}

export function loadProjectLifecycleSnapshot(
  storage: RuntimeStorage,
  projectId: string,
): ProjectLifecycleSnapshot | null {
  return storage.load<ProjectLifecycleSnapshot>(NAMESPACE, projectId);
}

export function clearProjectLifecycleNamespace(storage: RuntimeStorage): void {
  storage.clear(NAMESPACE);
}
