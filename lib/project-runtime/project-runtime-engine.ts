import { randomUUID } from 'node:crypto';

import type {
  CreateProjectRuntimeInput,
  ProjectNavigatorState,
  ProjectRuntime,
  ProjectRuntimeScope,
  ProjectRuntimeStatus,
  UpdateProjectRuntimeInput,
} from '@/types/project-runtime';

import { isDefaultWorkspaceId } from './constants';
import {
  resolveProjectRuntimeStore,
  type ProjectRuntimeStoreState,
} from './project-runtime-store';

function nowIso(): string {
  return new Date().toISOString();
}

function emptyNavigatorState(): ProjectNavigatorState {
  const timestamp = nowIso();

  return {
    selectedStepId: null,
    lastSuggestedStepId: null,
    updatedAt: timestamp,
  };
}

function assertNonEmpty(value: string, field: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${field} is required`);
  }

  return trimmed;
}

export function createProjectRuntime(
  input: CreateProjectRuntimeInput,
  store?: ProjectRuntimeStoreState,
): ProjectRuntime {
  const state = resolveProjectRuntimeStore(store);
  const timestamp = nowIso();
  const id = input.id ?? randomUUID();

  if (state.runtimes.has(id)) {
    throw new Error(`project runtime already exists: ${id}`);
  }

  const runtime: ProjectRuntime = {
    id,
    title: assertNonEmpty(input.title, 'title'),
    description: input.description?.trim() ?? '',
    status: input.status ?? 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
    active: false,
    summary: input.summary?.trim() ?? '',
    mission: input.mission?.trim() ?? `Продвинуть проект «${input.title.trim()}».`,
    lastActivity: null,
    nextStep: input.nextStep?.trim() ?? 'Определить следующий шаг в проекте.',
    memorySummary: '',
    navigatorState: emptyNavigatorState(),
    organizationId: assertNonEmpty(input.organizationId, 'organizationId'),
    userId: input.userId ?? null,
    sourceProjectId: input.sourceProjectId ?? null,
  };

  state.runtimes.set(id, runtime);
  return runtime;
}

export function ensureProjectRuntime(
  input: CreateProjectRuntimeInput,
  store?: ProjectRuntimeStoreState,
): ProjectRuntime {
  const state = resolveProjectRuntimeStore(store);

  if (input.id && state.runtimes.has(input.id)) {
    return updateProjectRuntime(
      input.id,
      {
        title: input.title,
        description: input.description,
        status: input.status,
        summary: input.summary,
        mission: input.mission,
        nextStep: input.nextStep,
      },
      store,
    );
  }

  if (input.sourceProjectId) {
    const existing = [...state.runtimes.values()].find(
      (runtime) => runtime.sourceProjectId === input.sourceProjectId,
    );

    if (existing) {
      return updateProjectRuntime(
        existing.id,
        {
          title: input.title,
          description: input.description,
          status: input.status,
        },
        store,
      );
    }
  }

  return createProjectRuntime(input, store);
}

export function findProjectRuntime(
  id: string,
  store?: ProjectRuntimeStoreState,
): ProjectRuntime | null {
  const state = resolveProjectRuntimeStore(store);
  return state.runtimes.get(id) ?? null;
}

export function listProjectRuntimes(
  scope: ProjectRuntimeScope,
  store?: ProjectRuntimeStoreState,
): ProjectRuntime[] {
  const state = resolveProjectRuntimeStore(store);

  return [...state.runtimes.values()]
    .filter((runtime) => {
      if (scope.organizationId && runtime.organizationId !== scope.organizationId) {
        return false;
      }

      if (scope.userId && runtime.userId !== scope.userId) {
        return false;
      }

      return true;
    })
    .sort((left, right) => {
      const leftTime = left.lastActivity ?? left.updatedAt;
      const rightTime = right.lastActivity ?? right.updatedAt;
      return rightTime.localeCompare(leftTime);
    });
}

export function updateProjectRuntime(
  id: string,
  patch: UpdateProjectRuntimeInput,
  store?: ProjectRuntimeStoreState,
): ProjectRuntime {
  const state = resolveProjectRuntimeStore(store);
  const existing = state.runtimes.get(id);

  if (!existing) {
    throw new Error(`project runtime not found: ${id}`);
  }

  const updated: ProjectRuntime = {
    ...existing,
    title: patch.title !== undefined ? assertNonEmpty(patch.title, 'title') : existing.title,
    description: patch.description !== undefined ? patch.description.trim() : existing.description,
    status: patch.status ?? existing.status,
    summary: patch.summary !== undefined ? patch.summary.trim() : existing.summary,
    mission: patch.mission !== undefined ? patch.mission.trim() : existing.mission,
    lastActivity: patch.lastActivity !== undefined ? patch.lastActivity : existing.lastActivity,
    nextStep: patch.nextStep !== undefined ? patch.nextStep.trim() : existing.nextStep,
    memorySummary:
      patch.memorySummary !== undefined ? patch.memorySummary.trim() : existing.memorySummary,
    navigatorState: patch.navigatorState
      ? {
          ...existing.navigatorState,
          ...patch.navigatorState,
          updatedAt: nowIso(),
        }
      : existing.navigatorState,
    updatedAt: nowIso(),
  };

  state.runtimes.set(id, updated);
  return updated;
}

export function computeProjectProgress(
  runtime: ProjectRuntime,
  memoryEntryCount: number,
): number {
  if (runtime.status === 'completed') {
    return 100;
  }

  if (runtime.status === 'planning') {
    return Math.min(18 + memoryEntryCount * 8, 40);
  }

  if (runtime.status === 'paused') {
    return Math.min(30 + memoryEntryCount * 6, 55);
  }

  return Math.min(35 + memoryEntryCount * 12, 92);
}

export function mapSnapshotStatus(status: string): ProjectRuntimeStatus {
  if (status === 'completed' || status === 'archived') {
    return 'completed';
  }

  if (status === 'paused') {
    return 'paused';
  }

  if (status === 'planning') {
    return 'planning';
  }

  return 'active';
}

export function isOperationalProject(runtime: ProjectRuntime): boolean {
  return !isDefaultWorkspaceId(runtime.id);
}
