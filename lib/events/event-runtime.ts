import { randomUUID } from 'node:crypto';

import {
  clearRuntimeEventNamespace,
  listProjectRuntimeEvents,
  listRuntimeEvents,
  saveRuntimeEvent,
} from '@/lib/storage/event-runtime-storage';
import { getRuntimeStorage } from '@/lib/storage/storage-factory';
import type { PublishRuntimeEventInput, RuntimeEventRecord } from '@/types/event-runtime';

import type { RuntimeStorage } from '@/lib/storage/runtime-storage';

export function resolveEventRuntimeStore(store?: RuntimeStorage): RuntimeStorage {
  return store ?? getRuntimeStorage();
}

export function publishRuntimeEvent(
  input: PublishRuntimeEventInput,
  store?: RuntimeStorage,
): RuntimeEventRecord {
  const storage = resolveEventRuntimeStore(store);

  const event: RuntimeEventRecord = {
    id: input.id ?? randomUUID(),
    timestamp: input.timestamp ?? new Date().toISOString(),
    projectId: input.projectId ?? null,
    type: input.type,
    actor: input.actor,
    payload: input.payload ?? {},
    source: input.source,
    status: input.status ?? 'completed',
  };

  saveRuntimeEvent(storage, event);

  return event;
}

export function findRuntimeEvents(
  store?: RuntimeStorage,
  predicate?: (event: RuntimeEventRecord) => boolean,
): RuntimeEventRecord[] {
  return listRuntimeEvents(resolveEventRuntimeStore(store), predicate);
}

export function findProjectRuntimeEvents(
  projectId: string,
  store?: RuntimeStorage,
): RuntimeEventRecord[] {
  return listProjectRuntimeEvents(resolveEventRuntimeStore(store), projectId);
}

export function resetRuntimeEventStore(store?: RuntimeStorage): void {
  clearRuntimeEventNamespace(resolveEventRuntimeStore(store));
}
