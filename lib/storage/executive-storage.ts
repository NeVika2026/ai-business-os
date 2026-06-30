import type { ExecutiveDecision, ExecutiveScope } from '@/types/executive';

import type { RuntimeStorage } from './runtime-storage';
import { STORAGE_NAMESPACES } from './storage-types';

const { EXECUTIVE_DECISIONS } = STORAGE_NAMESPACES;

function buildScopeKey(scope: ExecutiveScope): string {
  return `${scope.organizationId}:${scope.userId ?? 'anonymous'}`;
}

export function saveExecutiveDecision(
  storage: RuntimeStorage,
  scope: ExecutiveScope,
  decision: ExecutiveDecision,
): void {
  storage.save(EXECUTIVE_DECISIONS, buildScopeKey(scope), decision);
}

export function loadExecutiveDecision(
  storage: RuntimeStorage,
  scope: ExecutiveScope,
): ExecutiveDecision | null {
  return storage.load<ExecutiveDecision>(EXECUTIVE_DECISIONS, buildScopeKey(scope));
}

export function clearExecutiveNamespace(storage: RuntimeStorage): void {
  storage.clear(EXECUTIVE_DECISIONS);
}
