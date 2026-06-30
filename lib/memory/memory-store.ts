import type { MemoryEntry, MemoryProject } from '@/types/memory';

export type MemoryStoreState = {
  entries: Map<string, MemoryEntry>;
  projects: Map<string, MemoryProject>;
};

export function createMemoryStore(): MemoryStoreState {
  return {
    entries: new Map(),
    projects: new Map(),
  };
}

let defaultStore: MemoryStoreState | null = null;

export function getMemoryStore(): MemoryStoreState {
  if (!defaultStore) {
    defaultStore = createMemoryStore();
  }

  return defaultStore;
}

/** Test isolation — resets the process-wide in-memory store. */
export function resetMemoryStore(): void {
  defaultStore = createMemoryStore();
}

export function resolveStore(store?: MemoryStoreState): MemoryStoreState {
  return store ?? getMemoryStore();
}
