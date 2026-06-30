import type { MemoryEntry, MemoryProject } from '@/types/memory';

import type { RuntimeStorage } from './runtime-storage';
import { STORAGE_NAMESPACES } from './storage-types';

const { MEMORY_ENTRIES, MEMORY_PROJECTS } = STORAGE_NAMESPACES;

export function saveMemoryEntry(storage: RuntimeStorage, entry: MemoryEntry): void {
  storage.save(MEMORY_ENTRIES, entry.id, entry);
}

export function loadMemoryEntry(storage: RuntimeStorage, id: string): MemoryEntry | null {
  return storage.load<MemoryEntry>(MEMORY_ENTRIES, id);
}

export function listMemoryEntries(storage: RuntimeStorage): MemoryEntry[] {
  return storage.list<MemoryEntry>(MEMORY_ENTRIES);
}

export function deleteMemoryEntry(storage: RuntimeStorage, id: string): boolean {
  return storage.delete(MEMORY_ENTRIES, id);
}

export function memoryEntryExists(storage: RuntimeStorage, id: string): boolean {
  return storage.exists(MEMORY_ENTRIES, id);
}

export function saveMemoryProject(storage: RuntimeStorage, project: MemoryProject): void {
  storage.save(MEMORY_PROJECTS, project.id, project);
}

export function loadMemoryProject(storage: RuntimeStorage, id: string): MemoryProject | null {
  return storage.load<MemoryProject>(MEMORY_PROJECTS, id);
}

export function listMemoryProjects(storage: RuntimeStorage): MemoryProject[] {
  return storage.list<MemoryProject>(MEMORY_PROJECTS);
}

export function clearMemoryNamespaces(storage: RuntimeStorage): void {
  storage.clear(MEMORY_ENTRIES);
  storage.clear(MEMORY_PROJECTS);
}
