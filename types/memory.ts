export const MEMORY_SCOPES = ['session', 'daily', 'project', 'business', 'organization'] as const;

/** L0–L4 operational memory scope. See docs/architecture/OSA_MEMORY.md */
export type MemoryScope = (typeof MEMORY_SCOPES)[number];

export const MEMORY_IMPORTANCE_LEVELS = ['low', 'normal', 'high', 'critical'] as const;

export type MemoryImportance = (typeof MEMORY_IMPORTANCE_LEVELS)[number];

export const MEMORY_CATEGORIES = [
  'task',
  'result',
  'intent',
  'routing',
  'summary',
  'gateway_outcome',
] as const;

export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

export type MemoryEntry = {
  id: string;
  scope: MemoryScope;
  importance: MemoryImportance;
  category: MemoryCategory;
  task: string;
  result: string;
  intent: string;
  routingCategory: string;
  summary: string;
  occurredAt: string;
  projectId: string | null;
  organizationId: string;
  userId: string | null;
  sessionId: string | null;
  runId: string | null;
  correlationId: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MemoryProject = {
  id: string;
  name: string;
  organizationId: string;
  userId: string | null;
  entryIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type MemorySummary = {
  scope: MemoryScope | 'all';
  projectId: string | null;
  organizationId: string | null;
  entryCount: number;
  activeEntryCount: number;
  recentTasks: string[];
  highlights: string[];
  lastActivityAt: string | null;
};

export type CreateMemoryInput = {
  scope: MemoryScope;
  importance?: MemoryImportance;
  category?: MemoryCategory;
  task: string;
  result: string;
  intent: string;
  routingCategory: string;
  summary?: string;
  occurredAt?: string;
  projectId?: string | null;
  projectName?: string;
  organizationId: string;
  userId?: string | null;
  sessionId?: string | null;
  runId?: string | null;
  correlationId?: string | null;
};

export type UpdateMemoryInput = {
  scope?: MemoryScope;
  importance?: MemoryImportance;
  category?: MemoryCategory;
  task?: string;
  result?: string;
  intent?: string;
  routingCategory?: string;
  summary?: string;
  occurredAt?: string;
  projectId?: string | null;
};

export type FindMemoryQuery = {
  organizationId?: string;
  userId?: string;
  sessionId?: string;
  projectId?: string;
  scope?: MemoryScope;
  category?: MemoryCategory;
  text?: string;
  includeArchived?: boolean;
  limit?: number;
};

export type GatewayMemoryCaptureInput = {
  task: string;
  result: string;
  intent: string;
  routingCategory: string;
  organizationId: string;
  userId?: string | null;
  sessionId?: string | null;
  projectId?: string | null;
  projectName?: string;
  scope?: MemoryScope;
  importance?: MemoryImportance;
  summary?: string;
  occurredAt?: string;
  runId?: string | null;
  correlationId?: string | null;
};
