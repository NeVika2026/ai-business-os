import type { ExecutiveDecision, ExecutiveScope } from '@/types/executive';

import {
  clearExecutiveNamespace,
  loadExecutiveDecision,
  saveExecutiveDecision,
} from '@/lib/storage/executive-storage';
import type { RuntimeStorage } from '@/lib/storage/runtime-storage';
import { getRuntimeStorage, resetRuntimeStorage } from '@/lib/storage/storage-factory';

export type ExecutiveStoreState = RuntimeStorage;

export function resolveExecutiveStore(store?: ExecutiveStoreState): ExecutiveStoreState {
  return store ?? getRuntimeStorage();
}

export function writeExecutiveDecision(
  scope: ExecutiveScope,
  decision: ExecutiveDecision,
  store?: ExecutiveStoreState,
): void {
  saveExecutiveDecision(resolveExecutiveStore(store), scope, decision);
}

export function readExecutiveDecision(
  scope: ExecutiveScope,
  store?: ExecutiveStoreState,
): ExecutiveDecision | null {
  return loadExecutiveDecision(resolveExecutiveStore(store), scope);
}

export function resetExecutiveState(store?: ExecutiveStoreState): void {
  if (store) {
    clearExecutiveNamespace(store);
    return;
  }

  clearExecutiveNamespace(getRuntimeStorage());
  resetRuntimeStorage();
}
