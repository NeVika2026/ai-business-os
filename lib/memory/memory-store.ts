import type { RuntimeStorage } from '@/lib/storage/runtime-storage';
import { clearMemoryNamespaces } from '@/lib/storage/memory-storage';
import {
  createRuntimeStorage,
  getRuntimeStorage,
  resetRuntimeStorage,
} from '@/lib/storage/storage-factory';

export type MemoryStoreState = RuntimeStorage;

export function createMemoryStore(): MemoryStoreState {
  return createRuntimeStorage({ isolated: true, persistent: false });
}

export function getMemoryStore(): MemoryStoreState {
  return getRuntimeStorage();
}

/** Test isolation — resets the process-wide runtime storage for memory namespaces. */
export function resetMemoryStore(): void {
  clearMemoryNamespaces(getRuntimeStorage());
  resetRuntimeStorage();
}

export function resolveStore(store?: MemoryStoreState): MemoryStoreState {
  return store ?? getMemoryStore();
}
