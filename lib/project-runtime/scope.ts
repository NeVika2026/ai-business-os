import type { CabinetRawSnapshot } from '@/utils/cabinet/dashboard-mappers';
import type { HomeUserContext } from '@/utils/home/home-types';
import type { ProjectRuntimeScope } from '@/types/project-runtime';

export function resolveProjectRuntimeScope(
  snapshot: CabinetRawSnapshot,
  context: HomeUserContext,
): ProjectRuntimeScope {
  return {
    organizationId: snapshot.organization?.id ?? 'org-default',
    userId: context.email,
  };
}
