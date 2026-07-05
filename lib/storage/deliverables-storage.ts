import type { ProjectDeliverablesPackage } from '@/types/deliverables';

import type { RuntimeStorage } from './runtime-storage';

const NAMESPACE = 'project:deliverables';

export function saveProjectDeliverables(
  storage: RuntimeStorage,
  pkg: ProjectDeliverablesPackage,
): void {
  storage.save(NAMESPACE, pkg.projectId, pkg);
}

export function loadProjectDeliverables(
  storage: RuntimeStorage,
  projectId: string,
): ProjectDeliverablesPackage | null {
  return storage.load<ProjectDeliverablesPackage>(NAMESPACE, projectId);
}

export function clearDeliverablesNamespace(storage: RuntimeStorage): void {
  storage.clear(NAMESPACE);
}
