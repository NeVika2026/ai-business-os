export const DEFAULT_WORKSPACE_TITLE = 'Default Workspace';

export const DEFAULT_WORKSPACE_MISSION =
  'Определить приоритет и начать первую осмысленную задачу.';

export const DEFAULT_WORKSPACE_NEXT_STEP =
  'Выберите направление на Today или откройте проект.';

export function buildDefaultWorkspaceId(organizationId: string, userId: string | null): string {
  return `default-workspace:${organizationId}:${userId ?? 'anonymous'}`;
}

export function isDefaultWorkspaceId(projectId: string): boolean {
  return projectId.startsWith('default-workspace:');
}
