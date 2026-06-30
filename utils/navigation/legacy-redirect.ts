/** Legacy URL helpers — preserve bookmarks while routing to the current experience. */

export function resolveLegacyProjectId(
  searchParams: Record<string, string | string[] | undefined>,
): string | null {
  const project = searchParams.project;

  if (typeof project === 'string' && project.trim()) {
    return project.trim();
  }

  if (Array.isArray(project) && typeof project[0] === 'string' && project[0].trim()) {
    return project[0].trim();
  }

  return null;
}

export function legacyProjectPath(
  searchParams: Record<string, string | string[] | undefined>,
): string | null {
  const projectId = resolveLegacyProjectId(searchParams);

  if (!projectId) {
    return null;
  }

  return `/workspace/${encodeURIComponent(projectId)}`;
}
