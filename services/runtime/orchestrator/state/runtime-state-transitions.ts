import { InvalidRuntimeTransitionError } from '@/services/runtime/orchestrator/state/runtime-state-errors';
import type { RuntimeState } from '@/services/runtime/orchestrator/state/runtime-state-types';

const ALLOWED_TRANSITIONS: Record<RuntimeState, RuntimeState[]> = {
  created: ['initializing', 'cancelled'],
  initializing: ['planning', 'cancelled'],
  planning: ['executing', 'failed', 'cancelled'],
  executing: ['waiting', 'completed', 'failed', 'cancelled'],
  waiting: ['executing', 'failed', 'cancelled'],
  completed: [],
  failed: [],
  cancelled: [],
};

export function getAllowedTransitions(from: RuntimeState): RuntimeState[] {
  return [...ALLOWED_TRANSITIONS[from]];
}

export function canTransition(from: RuntimeState, to: RuntimeState): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertValidTransition(from: RuntimeState, to: RuntimeState): void {
  if (!canTransition(from, to)) {
    throw new InvalidRuntimeTransitionError(from, to);
  }
}

export function isTerminalState(state: RuntimeState): boolean {
  return state === 'completed' || state === 'failed' || state === 'cancelled';
}
