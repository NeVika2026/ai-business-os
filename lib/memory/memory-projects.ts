import { createHash } from 'node:crypto';

import type { MemoryProject } from '@/types/memory';

import {
  listMemoryProjects,
  loadMemoryProject,
  saveMemoryProject,
} from '@/lib/storage/memory-storage';
import { resolveStore, type MemoryStoreState } from './memory-store';

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function createProjectId(organizationId: string, name: string): string {
  return createHash('sha256')
    .update(`project:${organizationId}:${normalizeName(name)}`)
    .digest('hex')
    .slice(0, 32);
}

export function ensureProject(
  input: {
    organizationId: string;
    name: string;
    userId?: string | null;
  },
  store?: MemoryStoreState,
): MemoryProject {
  const state = resolveStore(store);
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new Error('project name is required');
  }

  const id = createProjectId(input.organizationId, trimmedName);
  const existing = loadMemoryProject(state, id);

  if (existing) {
    return existing;
  }

  const timestamp = nowIso();
  const project: MemoryProject = {
    id,
    name: trimmedName,
    organizationId: input.organizationId,
    userId: input.userId ?? null,
    entryIds: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  saveMemoryProject(state, project);
  return project;
}

export function linkEntryToProject(
  projectId: string,
  entryId: string,
  store?: MemoryStoreState,
): MemoryProject {
  const state = resolveStore(store);
  const project = loadMemoryProject(state, projectId);

  if (!project) {
    throw new Error(`project not found: ${projectId}`);
  }

  if (!project.entryIds.includes(entryId)) {
    project.entryIds.push(entryId);
    project.updatedAt = nowIso();
    saveMemoryProject(state, project);
  }

  return project;
}

export function findProject(
  query: { id?: string; name?: string; organizationId?: string },
  store?: MemoryStoreState,
): MemoryProject | null {
  const state = resolveStore(store);

  if (query.id) {
    return loadMemoryProject(state, query.id);
  }

  if (query.name && query.organizationId) {
    const id = createProjectId(query.organizationId, query.name);
    return loadMemoryProject(state, id);
  }

  return null;
}

export function listProjects(
  query: { organizationId?: string; userId?: string } = {},
  store?: MemoryStoreState,
): MemoryProject[] {
  const state = resolveStore(store);

  return listMemoryProjects(state)
    .filter((project) => {
      if (query.organizationId && project.organizationId !== query.organizationId) {
        return false;
      }

      if (query.userId && project.userId !== query.userId) {
        return false;
      }

      return true;
    })
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}
