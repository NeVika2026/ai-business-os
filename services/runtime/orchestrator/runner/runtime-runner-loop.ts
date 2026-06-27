import type {
  CoordinatorDispatchResult,
  CoordinatorStatus,
  CoordinatorStatusView,
} from '@/services/runtime/orchestrator/coordinator/runtime-coordinator-types';
import type {
  RunnerRunResult,
  RunnerStopReason,
} from '@/services/runtime/orchestrator/runner/runtime-runner-types';

export function shouldStopRunnerLoop(status: CoordinatorStatusView): RunnerStopReason | null {
  if (status.paused || status.status === 'paused') {
    return 'paused';
  }

  if (status.cancelled || status.status === 'cancelled') {
    return 'cancelled';
  }

  if (status.status === 'completed') {
    return 'completed';
  }

  if (status.status === 'failed') {
    return 'failed';
  }

  return null;
}

export interface RunnerLoopContext {
  maxSteps: number;
  getStatus: () => CoordinatorStatusView;
  dispatch: () => CoordinatorDispatchResult;
  startedAtMs: number;
}

export function executeRunnerLoop(context: RunnerLoopContext): RunnerRunResult {
  const executedTasks: string[] = [];
  let steps = 0;
  let finished = false;
  let stopReason: RunnerStopReason = 'max_steps';
  let finalStatus: CoordinatorStatus = 'running';

  while (steps < context.maxSteps) {
    const status = context.getStatus();
    finalStatus = status.status;

    const terminalReason = shouldStopRunnerLoop(status);

    if (terminalReason) {
      finished = terminalReason === 'completed';
      stopReason = terminalReason;
      break;
    }

    try {
      const result = context.dispatch();
      steps += 1;
      finalStatus = result.status.status;

      if (result.task) {
        executedTasks.push(result.task.id);
      }

      if (result.finished) {
        finished = true;
        stopReason = 'completed';
        finalStatus = result.status.status;
        break;
      }

      const postDispatchReason = shouldStopRunnerLoop(result.status);

      if (postDispatchReason) {
        finished = postDispatchReason === 'completed';
        stopReason = postDispatchReason;
        break;
      }
    } catch {
      finished = false;
      stopReason = 'dispatch_error';
      break;
    }
  }

  if (steps >= context.maxSteps && !finished && stopReason === 'max_steps') {
    finished = false;
  }

  return {
    finished,
    executedTasks,
    duration: Date.now() - context.startedAtMs,
    finalStatus,
    steps,
    stopReason,
  };
}
