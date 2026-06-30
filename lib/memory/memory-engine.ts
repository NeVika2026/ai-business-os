import { randomUUID } from 'node:crypto';

import type {
  CreateMemoryInput,
  GatewayMemoryCaptureInput,
  MemoryEntry,
  UpdateMemoryInput,
} from '@/types/memory';

import { ensureProject, findProject, linkEntryToProject } from './memory-projects';
import { findMemory, getRecentMemory } from './memory-search';
import { buildMemorySummaryText, summarizeMemory } from './memory-summary';
import { resolveStore, type MemoryStoreState } from './memory-store';

export { createMemoryStore, getMemoryStore, resetMemoryStore } from './memory-store';
export { ensureProject, findProject, listProjects, linkEntryToProject } from './memory-projects';
export { findMemory, getRecentMemory } from './memory-search';
export { buildMemorySummaryText, summarizeMemory } from './memory-summary';

function nowIso(): string {
  return new Date().toISOString();
}

function assertNonEmpty(value: string, field: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${field} is required`);
  }

  return trimmed;
}

function resolveScope(input: CreateMemoryInput): CreateMemoryInput['scope'] {
  if (input.projectId || input.projectName) {
    return input.scope === 'session' || input.scope === 'daily' ? input.scope : 'project';
  }

  return input.scope;
}

export function createMemory(input: CreateMemoryInput, store?: MemoryStoreState): MemoryEntry {
  const state = resolveStore(store);
  const timestamp = nowIso();
  const occurredAt = input.occurredAt ?? timestamp;

  let projectId = input.projectId ?? null;

  if (input.projectName) {
    const project = ensureProject(
      {
        organizationId: input.organizationId,
        name: input.projectName,
        userId: input.userId,
      },
      state,
    );
    projectId = project.id;
  }

  const entry: MemoryEntry = {
    id: randomUUID(),
    scope: resolveScope(input),
    importance: input.importance ?? 'normal',
    category: input.category ?? 'gateway_outcome',
    task: assertNonEmpty(input.task, 'task'),
    result: assertNonEmpty(input.result, 'result'),
    intent: assertNonEmpty(input.intent, 'intent'),
    routingCategory: assertNonEmpty(input.routingCategory, 'routingCategory'),
    summary: input.summary?.trim() || buildMemorySummaryText(input.task, input.result),
    occurredAt,
    projectId,
    organizationId: assertNonEmpty(input.organizationId, 'organizationId'),
    userId: input.userId ?? null,
    sessionId: input.sessionId ?? null,
    runId: input.runId ?? null,
    correlationId: input.correlationId ?? null,
    archived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  state.entries.set(entry.id, entry);

  if (projectId) {
    linkEntryToProject(projectId, entry.id, state);
  }

  return entry;
}

/**
 * Capture operational memory after a successful Gateway response.
 * Does not call Gateway — runtime invokes this when execution succeeds.
 */
export function captureGatewayMemory(
  input: GatewayMemoryCaptureInput,
  store?: MemoryStoreState,
): MemoryEntry {
  const scope =
    input.scope ??
    (input.projectId || input.projectName ? 'project' : input.sessionId ? 'session' : 'business');

  return createMemory(
    {
      scope,
      importance: input.importance ?? 'normal',
      category: 'gateway_outcome',
      task: input.task,
      result: input.result,
      intent: input.intent,
      routingCategory: input.routingCategory,
      summary: input.summary,
      occurredAt: input.occurredAt,
      projectId: input.projectId,
      projectName: input.projectName,
      organizationId: input.organizationId,
      userId: input.userId,
      sessionId: input.sessionId,
      runId: input.runId,
      correlationId: input.correlationId,
    },
    store,
  );
}

export function updateMemory(
  id: string,
  patch: UpdateMemoryInput,
  store?: MemoryStoreState,
): MemoryEntry {
  const state = resolveStore(store);
  const existing = state.entries.get(id);

  if (!existing) {
    throw new Error(`memory entry not found: ${id}`);
  }

  if (existing.archived) {
    throw new Error(`cannot update archived memory entry: ${id}`);
  }

  const updated: MemoryEntry = {
    ...existing,
    scope: patch.scope ?? existing.scope,
    importance: patch.importance ?? existing.importance,
    category: patch.category ?? existing.category,
    task: patch.task !== undefined ? assertNonEmpty(patch.task, 'task') : existing.task,
    result: patch.result !== undefined ? assertNonEmpty(patch.result, 'result') : existing.result,
    intent: patch.intent !== undefined ? assertNonEmpty(patch.intent, 'intent') : existing.intent,
    routingCategory:
      patch.routingCategory !== undefined
        ? assertNonEmpty(patch.routingCategory, 'routingCategory')
        : existing.routingCategory,
    summary:
      patch.summary !== undefined
        ? assertNonEmpty(patch.summary, 'summary')
        : existing.summary,
    occurredAt: patch.occurredAt ?? existing.occurredAt,
    projectId: patch.projectId !== undefined ? patch.projectId : existing.projectId,
    updatedAt: nowIso(),
  };

  state.entries.set(id, updated);

  if (updated.projectId) {
    linkEntryToProject(updated.projectId, updated.id, state);
  }

  return updated;
}

export function archiveMemory(id: string, store?: MemoryStoreState): MemoryEntry {
  const state = resolveStore(store);
  const existing = state.entries.get(id);

  if (!existing) {
    throw new Error(`memory entry not found: ${id}`);
  }

  const archived: MemoryEntry = {
    ...existing,
    archived: true,
    updatedAt: nowIso(),
  };

  state.entries.set(id, archived);
  return archived;
}

export function deleteMemory(id: string, store?: MemoryStoreState): MemoryEntry {
  const state = resolveStore(store);
  const existing = state.entries.get(id);

  if (!existing) {
    throw new Error(`memory entry not found: ${id}`);
  }

  state.entries.delete(id);

  for (const project of state.projects.values()) {
    const nextEntryIds = project.entryIds.filter((entryId) => entryId !== id);

    if (nextEntryIds.length !== project.entryIds.length) {
      state.projects.set(project.id, {
        ...project,
        entryIds: nextEntryIds,
        updatedAt: nowIso(),
      });
    }
  }

  return existing;
}
