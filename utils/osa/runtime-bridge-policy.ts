import type { HomeGoalId } from '@/utils/home/home-types';

export const SPRINT_RUNTIME_GOAL: HomeGoalId = 'find_clients';

export function isRuntimeBridgeEnabled(): boolean {
  return process.env.RUNTIME_BRIDGE_ENABLED === 'true';
}

export function isRuntimeBridgeEnabledForGoal(goalId: string | null | undefined): boolean {
  if (goalId !== SPRINT_RUNTIME_GOAL) {
    return false;
  }

  return isRuntimeBridgeEnabled();
}

export function isSprintGoal(goalId: string | null | undefined): boolean {
  return goalId === SPRINT_RUNTIME_GOAL;
}
