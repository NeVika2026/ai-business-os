import type { RuntimeEventRecord } from '@/types/event-runtime';

import type { RuntimeStorage } from './runtime-storage';
import { STORAGE_NAMESPACES } from './storage-types';

const { EVENTS_RUNTIME } = STORAGE_NAMESPACES;

export function saveRuntimeEvent(storage: RuntimeStorage, event: RuntimeEventRecord): void {
  storage.save(EVENTS_RUNTIME, event.id, event);
}

export function loadRuntimeEvent(storage: RuntimeStorage, id: string): RuntimeEventRecord | null {
  return storage.load<RuntimeEventRecord>(EVENTS_RUNTIME, id);
}

export function listRuntimeEvents(
  storage: RuntimeStorage,
  predicate?: (event: RuntimeEventRecord) => boolean,
): RuntimeEventRecord[] {
  return storage
    .list<RuntimeEventRecord>(EVENTS_RUNTIME, predicate ? (_, event) => predicate(event) : undefined)
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp));
}

export function listProjectRuntimeEvents(
  storage: RuntimeStorage,
  projectId: string,
): RuntimeEventRecord[] {
  return listRuntimeEvents(storage, (event) => event.projectId === projectId);
}

export function clearRuntimeEventNamespace(storage: RuntimeStorage): void {
  storage.clear(EVENTS_RUNTIME);
}
