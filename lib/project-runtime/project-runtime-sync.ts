import type { CabinetProjectRow, CabinetRawSnapshot } from '@/utils/cabinet/dashboard-mappers';
import type { HomeUserContext } from '@/utils/home/home-types';
import type { ProjectRuntimeScope } from '@/types/project-runtime';

import { getActiveProject, setActiveProject } from './active-project';
import {
  ensureProjectRuntime,
  findProjectRuntime,
  mapSnapshotStatus,
  updateProjectRuntime,
} from './project-runtime-engine';
import { syncProjectMemoryState } from './project-runtime-memory';
import { resolveProjectRuntimeScope } from './scope';
import type { ProjectRuntimeStoreState } from './project-runtime-store';

export function syncProjectRuntimeFromSnapshotRow(
  row: CabinetProjectRow,
  scope: ProjectRuntimeScope,
  store?: ProjectRuntimeStoreState,
): void {
  ensureProjectRuntime(
    {
      id: row.id,
      sourceProjectId: row.id,
      title: row.name,
      description: `Рабочее пространство проекта ${row.name}.`,
      status: mapSnapshotStatus(row.status),
      organizationId: scope.organizationId,
      userId: scope.userId ?? null,
      mission: `Продвинуть проект «${row.name}».`,
      summary: `Проект ${row.name} в статусе ${row.status}.`,
    },
    store,
  );

  updateProjectRuntime(
    row.id,
    {
      lastActivity: row.updated_at,
    },
    store,
  );
}

export function syncProjectRuntimesFromSnapshot(
  snapshot: CabinetRawSnapshot,
  context: HomeUserContext,
  store?: ProjectRuntimeStoreState,
): void {
  const scope = resolveProjectRuntimeScope(snapshot, context);

  for (const project of snapshot.projects) {
    syncProjectRuntimeFromSnapshotRow(project, scope, store);
  }

  if (snapshot.projects.length > 0 && !getActiveProject(scope, store)) {
    const latest = [...snapshot.projects].sort((left, right) =>
      right.updated_at.localeCompare(left.updated_at),
    )[0]!;

    setActiveProject(scope, latest.id, store);
  }

  for (const project of snapshot.projects) {
    const runtime = findProjectRuntime(project.id, store);

    if (runtime) {
      syncProjectMemoryState(runtime, store);
    }
  }
}
