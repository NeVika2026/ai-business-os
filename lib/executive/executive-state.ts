import type { ExecutiveDecision, ExecutiveScope } from '@/types/executive';

import {
  clearExecutiveNamespace,
  loadExecutiveDecision,
  saveExecutiveDecision,
} from '@/lib/storage/executive-storage';
import type { RuntimeStorage } from '@/lib/storage/runtime-storage';
import { getRuntimeStorage, resetRuntimeStorage } from '@/lib/storage/storage-factory';
import { publishRuntimeEvent } from '@/lib/events/event-runtime';
import { RUNTIME_EVENT_TYPES } from '@/types/event-runtime';

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

  publishRuntimeEvent(
    {
      projectId: decision.projectId,
      type: RUNTIME_EVENT_TYPES.EXECUTIVE_DECISION_RECORDED,
      actor: scope.userId ? `user:${scope.userId}` : 'system:executive-brain',
      source: 'executive_brain',
      payload: {
        goal: decision.goal,
        workingMode: decision.workingMode,
        projectDecision: decision.projectDecision,
        navigatorMode: decision.navigatorMode,
        memoryMode: decision.memoryMode,
        summary: decision.summary,
      },
    },
    resolveExecutiveStore(store),
  );
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
