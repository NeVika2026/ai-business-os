import { getRecentDecisions } from '@/lib/project-runtime/project-runtime-memory';
import { isDefaultWorkspaceId } from '@/lib/project-runtime/constants';
import type { MemoryEntry } from '@/types/memory';
import type { ExecutiveMemoryMode } from '@/types/executive';
import type { ProjectRuntime } from '@/types/project-runtime';

import { findProject } from './memory-projects';
import { getRecentMemory } from './memory-search';
import type { MemoryStoreState } from './memory-store';

export const GATEWAY_MEMORY_CONTEXT_MAX_CHARS = 1_400;

export const GATEWAY_MEMORY_RECENT_LIMIT = 6;

export type GatewayMemoryContextInput = {
  organizationId: string;
  userId?: string | null;
  projectId?: string | null;
  projectRuntime?: ProjectRuntime | null;
  limit?: number;
  memoryMode?: ExecutiveMemoryMode;
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
  input: Pick<GatewayMemoryContextInput, 'organizationId' | 'projectId' | 'projectRuntime'>,
  store?: MemoryStoreState,
): string | null {
  if (input.projectRuntime) {
    return `Current Project:\n${input.projectRuntime.title}`;
  }

  if (!input.projectId) {
    return null;
  }

  const project = findProject({ id: input.projectId, organizationId: input.organizationId }, store);

  if (!project) {
    return null;
  }

  return `Current Project:\n${project.name}`;
}

export function buildProjectRuntimeSections(runtime: ProjectRuntime): string[] {
  const sections: string[] = [];

  if (runtime.mission.trim()) {
    sections.push('', 'Mission:', runtime.mission.trim());
  }

  if (runtime.summary.trim()) {
    sections.push('', 'Summary:', runtime.summary.trim());
  }

  const decisions = getRecentDecisions(runtime);

  if (decisions.length > 0) {
    sections.push('', 'Recent Decisions:', ...decisions.map((line) => formatBulletLine(line)));
  }

  if (runtime.nextStep.trim()) {
    sections.push('', 'Next Step:', runtime.nextStep.trim());
  }

  return sections;
}

export function buildRecentContext(
  input: GatewayMemoryContextInput,
  store?: MemoryStoreState,
): { lines: string[]; entries: MemoryEntry[]; currentObjective: string | null } {
  const limit = input.limit ?? GATEWAY_MEMORY_RECENT_LIMIT;

  const query =
    input.memoryMode === 'organization'
      ? {
          organizationId: input.organizationId,
          scope: 'business' as const,
          limit,
        }
      : input.memoryMode === 'recent'
        ? {
            organizationId: input.organizationId,
            userId: input.userId ?? undefined,
            limit,
          }
        : {
            organizationId: input.organizationId,
            userId: input.userId ?? undefined,
            projectId: input.projectId ?? undefined,
            limit,
          };

  const entries = getRecentMemory(query, store);

  const lines = entries.map((entry) => formatBulletLine(entry.summary));
  const currentObjective = entries[0]?.task.trim() || input.projectRuntime?.nextStep.trim() || null;

  return { lines, entries, currentObjective };
}

function buildKnownGoals(entries: MemoryEntry[], runtime?: ProjectRuntime | null): string[] {
  const goals = new Set<string>();

  for (const entry of entries) {
    const task = entry.task.trim();

    if (task) {
      goals.add(task);
    }
  }

  if (runtime?.mission.trim()) {
    goals.add(runtime.mission.trim());
  }

  return [...goals].slice(0, 4);
}

export function buildGatewayMemoryContext(
  input: GatewayMemoryContextInput,
  store?: MemoryStoreState,
): GatewayMemoryContext {
  const runtime = input.projectRuntime ?? null;
  const { lines, entries, currentObjective } = buildRecentContext(input, store);
  const hasRuntimeContext =
    Boolean(runtime && !isDefaultWorkspaceId(runtime.id)) && input.memoryMode !== 'organization';
  const hasEntryContext = entries.length > 0;

  if (!hasRuntimeContext && !hasEntryContext) {
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

  if (runtime && !isDefaultWorkspaceId(runtime.id)) {
    sections.push(...buildProjectRuntimeSections(runtime));
  }

  if (lines.length > 0) {
    sections.push('', 'Recent Progress:', ...lines);
  }

  const knownGoals = buildKnownGoals(entries, runtime);

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
