import type { ExecutiveDecision, ExecutiveScope } from '@/types/executive';

export type ExecutiveStoreState = {
  decisions: Map<string, ExecutiveDecision>;
};

const globalState: ExecutiveStoreState = {
  decisions: new Map(),
};

function buildScopeKey(scope: ExecutiveScope): string {
  return `${scope.organizationId}:${scope.userId ?? 'anonymous'}`;
}

export function resolveExecutiveStore(store?: ExecutiveStoreState): ExecutiveStoreState {
  return store ?? globalState;
}

export function writeExecutiveDecision(
  scope: ExecutiveScope,
  decision: ExecutiveDecision,
  store?: ExecutiveStoreState,
): void {
  const state = resolveExecutiveStore(store);
  state.decisions.set(buildScopeKey(scope), decision);
}

export function readExecutiveDecision(
  scope: ExecutiveScope,
  store?: ExecutiveStoreState,
): ExecutiveDecision | null {
  const state = resolveExecutiveStore(store);
  return state.decisions.get(buildScopeKey(scope)) ?? null;
}

export function resetExecutiveState(store?: ExecutiveStoreState): void {
  const state = resolveExecutiveStore(store);

  if (store) {
    state.decisions.clear();
    return;
  }

  globalState.decisions.clear();
}
