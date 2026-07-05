import type { ExecutiveNavigatorMode } from '@/types/executive';
import type { NavigatorStepId } from '@/types/navigator';

import type { RuntimeStorage } from './runtime-storage';
import { STORAGE_NAMESPACES } from './storage-types';
import { publishRuntimeEvent } from '@/lib/events/event-runtime';
import { RUNTIME_EVENT_TYPES } from '@/types/event-runtime';

const { NAVIGATOR_STATE } = STORAGE_NAMESPACES;

export type NavigatorPersistedState = {
  scopeKey: string;
  organizationId: string;
  userId: string | null;
  selectedStepId: NavigatorStepId | null;
  lastSuggestedStepId: NavigatorStepId | null;
  navigatorMode: ExecutiveNavigatorMode | null;
  updatedAt: string;
};

function buildScopeKey(organizationId: string, userId: string | null | undefined): string {
  return `${organizationId}:${userId ?? 'anonymous'}`;
}

export function saveNavigatorState(
  storage: RuntimeStorage,
  input: {
    organizationId: string;
    userId?: string | null;
    selectedStepId?: NavigatorStepId | null;
    lastSuggestedStepId?: NavigatorStepId | null;
    navigatorMode?: ExecutiveNavigatorMode | null;
  },
): NavigatorPersistedState {
  const scopeKey = buildScopeKey(input.organizationId, input.userId);
  const existing = loadNavigatorState(storage, input.organizationId, input.userId);
  const timestamp = new Date().toISOString();

  const next: NavigatorPersistedState = {
    scopeKey,
    organizationId: input.organizationId,
    userId: input.userId ?? null,
    selectedStepId: input.selectedStepId ?? existing?.selectedStepId ?? null,
    lastSuggestedStepId: input.lastSuggestedStepId ?? existing?.lastSuggestedStepId ?? null,
    navigatorMode: input.navigatorMode ?? existing?.navigatorMode ?? null,
    updatedAt: timestamp,
  };

  storage.save(NAVIGATOR_STATE, scopeKey, next);

  publishRuntimeEvent(
    {
      projectId: null,
      type: RUNTIME_EVENT_TYPES.NAVIGATOR_STATE_UPDATED,
      actor: input.userId ? `user:${input.userId}` : 'system:navigator',
      source: 'navigator',
      payload: {
        organizationId: input.organizationId,
        selectedStepId: next.selectedStepId,
        lastSuggestedStepId: next.lastSuggestedStepId,
        navigatorMode: next.navigatorMode,
      },
    },
    storage,
  );

  return next;
}

export function loadNavigatorState(
  storage: RuntimeStorage,
  organizationId: string,
  userId?: string | null,
): NavigatorPersistedState | null {
  return storage.load<NavigatorPersistedState>(
    NAVIGATOR_STATE,
    buildScopeKey(organizationId, userId),
  );
}

export function clearNavigatorNamespace(storage: RuntimeStorage): void {
  storage.clear(NAVIGATOR_STATE);
}
