import { findMemory } from '@/lib/memory/memory-engine';
import { ensureProject } from '@/lib/memory/memory-projects';
import { isDefaultWorkspaceId } from '@/lib/project-runtime/constants';
import type { ProjectRuntime } from '@/types/project-runtime';

import type { WorkspaceTimelineEntry } from './workspace-types';

function resolveMemoryProjectId(runtime: ProjectRuntime): string | null {
  if (isDefaultWorkspaceId(runtime.id)) {
    return null;
  }

  return ensureProject({
    organizationId: runtime.organizationId,
    name: runtime.title,
    userId: runtime.userId,
  }).id;
}

export function buildWorkspaceTimeline(runtime: ProjectRuntime, limit = 20): WorkspaceTimelineEntry[] {
  const memoryProjectId = resolveMemoryProjectId(runtime);

  const entries = findMemory({
    organizationId: runtime.organizationId,
    userId: runtime.userId ?? undefined,
    projectId: memoryProjectId ?? undefined,
    limit,
  });

  const scopedEntries = memoryProjectId
    ? entries
    : entries.filter((entry) => !entry.projectId);

  return scopedEntries.map((entry) => ({
    id: entry.id,
    task: entry.task,
    result: entry.result,
    decision: entry.summary,
    occurredAt: entry.occurredAt,
  }));
}
