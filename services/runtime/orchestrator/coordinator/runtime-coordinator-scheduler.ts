import { CoordinatorInvalidStateError } from '@/services/runtime/orchestrator/coordinator/runtime-coordinator-errors';
import type { CoordinatorStatus } from '@/services/runtime/orchestrator/coordinator/runtime-coordinator-types';
import type { OrchestratorTask } from '@/services/runtime/orchestrator/engine/runtime-orchestrator-types';

export function buildFifoQueue(tasks: OrchestratorTask[]): OrchestratorTask[] {
  return [...tasks].sort((left, right) => {
    if (left.priority !== right.priority) {
      return right.priority - left.priority;
    }

    return left.id.localeCompare(right.id);
  });
}

export function resolveCurrentTask(
  currentTaskId: string | null,
  catalog: OrchestratorTask[],
): OrchestratorTask | null {
  if (!currentTaskId) {
    return null;
  }

  return catalog.find((task) => task.id === currentTaskId) ?? null;
}

export function assertCanDispatch(status: CoordinatorStatus, paused: boolean): void {
  if (paused || status === 'paused') {
    throw new CoordinatorInvalidStateError('cannot dispatch while coordinator is paused');
  }

  if (status === 'cancelled') {
    throw new CoordinatorInvalidStateError('coordinator is cancelled');
  }

  if (status === 'completed') {
    throw new CoordinatorInvalidStateError('coordinator is already completed');
  }

  if (status === 'failed') {
    throw new CoordinatorInvalidStateError('coordinator has failed');
  }

  if (status === 'idle') {
    throw new CoordinatorInvalidStateError('coordinator is not started');
  }
}

export function hasActiveTask(currentTaskId: string | null): boolean {
  return currentTaskId !== null;
}

export function shouldEnterWaitingState(pendingTaskCount: number): boolean {
  return pendingTaskCount > 0;
}
