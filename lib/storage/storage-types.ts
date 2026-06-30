export const STORAGE_NAMESPACES = {
  MEMORY_ENTRIES: 'memory:entries',
  MEMORY_PROJECTS: 'memory:projects',
  PROJECT_RUNTIMES: 'project:runtimes',
  PROJECT_ACTIVE: 'project:active',
  EXECUTIVE_DECISIONS: 'executive:decisions',
  NAVIGATOR_STATE: 'navigator:state',
} as const;

export type StorageNamespace = (typeof STORAGE_NAMESPACES)[keyof typeof STORAGE_NAMESPACES];

export type StorageProviderKind = 'memory' | 'supabase' | 'local';

export type StorageRecord<T = unknown> = {
  id: string;
  data: T;
  updatedAt: string;
};

export type StorageFactoryOptions = {
  isolated?: boolean;
  persistent?: boolean;
  persistPath?: string;
};

export type StorageListPredicate<T> = (id: string, value: T) => boolean;
