import { findMemory, summarizeMemory } from '@/lib/memory/memory-engine';
import { ensureProject } from '@/lib/memory/memory-projects';
import type { MemoryEntry } from '@/types/memory';
import type { ProjectRuntime } from '@/types/project-runtime';

import { isDefaultWorkspaceId } from './constants';
import { updateProjectRuntime } from './project-runtime-engine';
import type { ProjectRuntimeStoreState } from './project-runtime-store';

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

function latestResult(entries: MemoryEntry[]): string | null {
  return entries[0]?.result.trim() || null;
}

export function syncProjectMemoryState(
  runtime: ProjectRuntime,
  store?: ProjectRuntimeStoreState,
): { entryCount: number; entries: MemoryEntry[] } {
  const memoryProjectId = resolveMemoryProjectId(runtime);

  const entries = findMemory(
    {
      organizationId: runtime.organizationId,
      userId: runtime.userId ?? undefined,
      projectId: memoryProjectId ?? undefined,
      limit: 8,
    },
    undefined,
  );

  const scopedEntries = memoryProjectId
    ? entries
    : entries.filter((entry) => !entry.projectId);

  const summary = summarizeMemory(
    {
      scope: memoryProjectId ? 'project' : 'business',
      organizationId: runtime.organizationId,
      projectId: memoryProjectId,
      limit: 8,
    },
    undefined,
  );

  const memorySummary =
    summary.highlights.join(' · ') ||
    scopedEntries[0]?.summary ||
    runtime.memorySummary ||
    'Память проекта пока пуста.';

  const nextStep =
    scopedEntries[0]?.task.trim() ||
    runtime.nextStep ||
    'Определить следующий шаг в проекте.';

  updateProjectRuntime(
    runtime.id,
    {
      memorySummary,
      summary: runtime.summary || memorySummary,
      nextStep,
      lastActivity: scopedEntries[0]?.occurredAt ?? runtime.lastActivity,
    },
    store,
  );

  return {
    entryCount: scopedEntries.length,
    entries: scopedEntries,
  };
}

export function recordProjectRuntimeFromGateway(input: {
  organizationId: string;
  userId?: string | null;
  projectRuntimeId: string;
  task: string;
  result: string;
}): void {
  const resultPreview = input.result.trim().slice(0, 180);
  const occurredAt = new Date().toISOString();

  updateProjectRuntime(input.projectRuntimeId, {
    lastActivity: occurredAt,
    nextStep: input.task.trim(),
    summary: `${input.task.trim()} → ${resultPreview}`,
    memorySummary: resultPreview,
  });
}

export function getRecentDecisions(runtime: ProjectRuntime, limit = 4): string[] {
  const memoryProjectId = resolveMemoryProjectId(runtime);

  const entries = findMemory(
    {
      organizationId: runtime.organizationId,
      userId: runtime.userId ?? undefined,
      projectId: memoryProjectId ?? undefined,
      limit,
    },
    undefined,
  );

  const scopedEntries = memoryProjectId
    ? entries
    : entries.filter((entry) => !entry.projectId);

  return scopedEntries.map((entry) => entry.summary.trim()).filter(Boolean);
}
