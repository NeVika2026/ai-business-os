import type { MemoryEntry } from '@/types/memory';

import { findProject } from './memory-projects';
import { getRecentMemory } from './memory-search';
import type { MemoryStoreState } from './memory-store';

export const GATEWAY_MEMORY_CONTEXT_MAX_CHARS = 1_400;

export const GATEWAY_MEMORY_RECENT_LIMIT = 6;

export type GatewayMemoryContextInput = {
  organizationId: string;
  userId?: string | null;
  projectId?: string | null;
  limit?: number;
};

export type GatewayMemoryContext = {
  content: string;
  entryCount: number;
  hasMemory: boolean;
};

function truncateContext(value: string, maxChars: number): string {
  const trimmed = value.trim();

  if (trimmed.length <= maxChars) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxChars - 1).trimEnd()}…`;
}

function formatBulletLine(summary: string): string {
  const line = summary.trim().replace(/\s+/g, ' ');
  return `• ${line}`;
}

export function buildProjectContext(
  input: Pick<GatewayMemoryContextInput, 'organizationId' | 'projectId'>,
  store?: MemoryStoreState,
): string | null {
  if (!input.projectId) {
    return null;
  }

  const project = findProject({ id: input.projectId, organizationId: input.organizationId }, store);

  if (!project) {
    return null;
  }

  return `Current Project:\n${project.name}`;
}

export function buildRecentContext(
  input: GatewayMemoryContextInput,
  store?: MemoryStoreState,
): { lines: string[]; entries: MemoryEntry[]; currentObjective: string | null } {
  const limit = input.limit ?? GATEWAY_MEMORY_RECENT_LIMIT;

  const entries = getRecentMemory(
    {
      organizationId: input.organizationId,
      userId: input.userId ?? undefined,
      projectId: input.projectId ?? undefined,
      limit,
    },
    store,
  );

  const lines = entries.map((entry) => formatBulletLine(entry.summary));
  const currentObjective = entries[0]?.task.trim() || null;

  return { lines, entries, currentObjective };
}

function buildKnownGoals(entries: MemoryEntry[]): string[] {
  const goals = new Set<string>();

  for (const entry of entries) {
    const task = entry.task.trim();

    if (task) {
      goals.add(task);
    }
  }

  return [...goals].slice(0, 4);
}

export function buildGatewayMemoryContext(
  input: GatewayMemoryContextInput,
  store?: MemoryStoreState,
): GatewayMemoryContext {
  const { lines, entries, currentObjective } = buildRecentContext(input, store);

  if (entries.length === 0) {
    return {
      content: '',
      entryCount: 0,
      hasMemory: false,
    };
  }

  const sections: string[] = ['Context'];

  const projectSection = buildProjectContext(input, store);

  if (projectSection) {
    sections.push('', projectSection);
  }

  sections.push('', 'Recent Progress:', ...lines);

  const knownGoals = buildKnownGoals(entries);

  if (knownGoals.length > 0) {
    sections.push('', 'Known Goals:', ...knownGoals.map((goal) => `• ${goal}`));
  }

  if (currentObjective) {
    sections.push('', 'Current objective', '', currentObjective);
  }

  sections.push('', 'Continue from previous work.');

  const content = truncateContext(sections.join('\n'), GATEWAY_MEMORY_CONTEXT_MAX_CHARS);

  return {
    content,
    entryCount: entries.length,
    hasMemory: true,
  };
}
