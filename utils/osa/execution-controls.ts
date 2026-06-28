/**
 * Execution control layer for OSA Team Runtime.
 *
 * Manipulates ExecutionSession state only — does not call RuntimeBridge internals.
 * Pause/resume/cancel delegate to team-runtime; retry/restart reset graph task state in-session.
 */
import {
  applyGraphTasks,
  buildExecutionGraph,
  getDownstreamTaskIds,
  reconcileExecutionTaskStatuses,
  type ExecutionGraph,
  type ExecutionTask,
} from '@/utils/osa/team-execution';
import {
  cancelExecution as cancelTeamExecution,
  pauseExecution as pauseTeamExecution,
  resumeExecution as resumeTeamExecution,
  type ExecutionCoordinator,
  type ExecutionSession,
  type ExecutionState,
} from '@/utils/osa/team-runtime';

export type ExecutionControlState =
  | 'active'
  | 'paused'
  | 'retrying'
  | 'cancelled'
  | 'completed'
  | 'failed';

export type ExecutionControlAction =
  | 'pause'
  | 'resume'
  | 'cancel'
  | 'restart'
  | 'retry_task'
  | 'retry_stage';

export type ExecutionControlAvailability = {
  pause: boolean;
  resume: boolean;
  cancel: boolean;
  restart: boolean;
  retryTask: boolean;
  retryStage: boolean;
};

export type ExecutionControlContext = {
  userId: string;
  runOwnerId: string;
  runStatus: 'running' | 'completed' | 'failed' | 'cancelled';
};

export function mapSessionToControlState(state: ExecutionState): ExecutionControlState {
  switch (state) {
    case 'running':
    case 'idle':
      return 'active';
    case 'paused':
      return 'paused';
    case 'retrying':
      return 'retrying';
    case 'cancelled':
      return 'cancelled';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    default:
      return 'active';
  }
}

export function getExecutionControlState(coordinator: ExecutionCoordinator): ExecutionControlState {
  return mapSessionToControlState(coordinator.session.state);
}

function resetTask(task: ExecutionTask): ExecutionTask {
  return {
    ...task,
    status: 'pending',
    error: null,
    result: null,
    startedAt: null,
    finishedAt: null,
  };
}

function syncRetrySession(
  coordinator: ExecutionCoordinator,
  graph: ExecutionGraph,
  results: ExecutionSession['results'],
): ExecutionCoordinator {
  return {
    session: {
      ...coordinator.session,
      graph,
      results,
      state: 'retrying',
      completedTasks: graph.tasks
        .filter((task) => task.status === 'completed')
        .map((task) => task.id),
      runningTasks: graph.tasks.filter((task) => task.status === 'running').map((task) => task.id),
      failedTasks: graph.tasks.filter((task) => task.status === 'failed').map((task) => task.id),
      blockedTasks: graph.tasks.filter((task) => task.status === 'blocked').map((task) => task.id),
      progress: graph.progress,
      eta: graph.eta,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function canPauseExecution(coordinator: ExecutionCoordinator): boolean {
  return coordinator.session.state === 'running' || coordinator.session.state === 'retrying';
}

export function canResumeExecution(coordinator: ExecutionCoordinator): boolean {
  return coordinator.session.state === 'paused';
}

export function canCancelExecution(coordinator: ExecutionCoordinator): boolean {
  return ['running', 'paused', 'retrying', 'idle'].includes(coordinator.session.state);
}

export function canRestartExecution(coordinator: ExecutionCoordinator): boolean {
  return ['failed', 'cancelled', 'completed', 'paused'].includes(coordinator.session.state);
}

export function canRetryTask(coordinator: ExecutionCoordinator, taskId?: string): boolean {
  const targetId = taskId ?? coordinator.session.failedTasks[0];

  if (!targetId) {
    return false;
  }

  const task = coordinator.session.graph.tasks.find((entry) => entry.id === targetId);

  return task?.status === 'failed' || task?.status === 'blocked';
}

function resolveRetryStageId(coordinator: ExecutionCoordinator, stageId?: string): string | null {
  if (stageId) {
    return stageId;
  }

  const failedTaskId = coordinator.session.failedTasks[0];

  if (failedTaskId) {
    const failedTask = coordinator.session.graph.tasks.find((task) => task.id === failedTaskId);

    if (failedTask) {
      return failedTask.stageId;
    }
  }

  return coordinator.session.currentStage;
}

export function canRetryStage(coordinator: ExecutionCoordinator, stageId?: string): boolean {
  const targetStageId = resolveRetryStageId(coordinator, stageId);

  if (!targetStageId) {
    return false;
  }

  return coordinator.session.graph.tasks.some(
    (task) =>
      task.stageId === targetStageId && (task.status === 'failed' || task.status === 'blocked'),
  );
}

export function getExecutionControlAvailability(
  coordinator: ExecutionCoordinator,
): ExecutionControlAvailability {
  return {
    pause: canPauseExecution(coordinator),
    resume: canResumeExecution(coordinator),
    cancel: canCancelExecution(coordinator),
    restart: canRestartExecution(coordinator),
    retryTask: canRetryTask(coordinator),
    retryStage: canRetryStage(coordinator),
  };
}

export function isValidControlTransition(
  coordinator: ExecutionCoordinator,
  action: ExecutionControlAction,
): boolean {
  switch (action) {
    case 'pause':
      return canPauseExecution(coordinator);
    case 'resume':
      return canResumeExecution(coordinator);
    case 'cancel':
      return canCancelExecution(coordinator);
    case 'restart':
      return canRestartExecution(coordinator);
    case 'retry_task':
      return canRetryTask(coordinator);
    case 'retry_stage':
      return canRetryStage(coordinator);
    default:
      return false;
  }
}

export function canControlExecution(
  context: ExecutionControlContext,
  coordinator: ExecutionCoordinator,
  action: ExecutionControlAction,
): boolean {
  if (context.userId !== context.runOwnerId) {
    return false;
  }

  if (context.runStatus !== 'running') {
    return action === 'restart' && canRestartExecution(coordinator);
  }

  return isValidControlTransition(coordinator, action);
}

export function pauseExecution(coordinator: ExecutionCoordinator): ExecutionCoordinator {
  if (!canPauseExecution(coordinator)) {
    return coordinator;
  }

  return pauseTeamExecution(coordinator);
}

export function resumeExecution(coordinator: ExecutionCoordinator): ExecutionCoordinator {
  if (!canResumeExecution(coordinator)) {
    return coordinator;
  }

  return resumeTeamExecution(coordinator);
}

export function cancelExecution(coordinator: ExecutionCoordinator): ExecutionCoordinator {
  if (!canCancelExecution(coordinator)) {
    return coordinator;
  }

  return cancelTeamExecution(coordinator);
}

export function restartExecution(
  coordinator: ExecutionCoordinator,
  initialGraph?: ExecutionGraph,
): ExecutionCoordinator {
  if (!canRestartExecution(coordinator)) {
    return coordinator;
  }

  const graph =
    initialGraph ??
    buildExecutionGraph({
      plan: coordinator.session.executionPlan,
      graphId: coordinator.session.graph.id,
    });

  const session: ExecutionSession = {
    ...coordinator.session,
    graph,
    results: {},
    snapshots: [],
    steps: [],
    completedTasks: [],
    runningTasks: [],
    failedTasks: [],
    blockedTasks: [],
    progress: graph.progress,
    eta: graph.eta,
    state: 'running',
    updatedAt: new Date().toISOString(),
  };

  return { session };
}

export function retryTask(
  coordinator: ExecutionCoordinator,
  taskId?: string,
): ExecutionCoordinator {
  const targetId = taskId ?? coordinator.session.failedTasks[0];

  if (!targetId || !canRetryTask(coordinator, targetId)) {
    return coordinator;
  }

  const resetIds = new Set<string>([
    targetId,
    ...getDownstreamTaskIds(targetId, coordinator.session.graph.tasks),
  ]);

  const tasks = coordinator.session.graph.tasks.map((task) =>
    resetIds.has(task.id) && task.status !== 'completed' ? resetTask(task) : task,
  );

  const refreshed = reconcileExecutionTaskStatuses(tasks);
  const nextResults = { ...coordinator.session.results };

  for (const id of resetIds) {
    delete nextResults[id];
  }

  const graph = applyGraphTasks(coordinator.session.graph, refreshed);

  return syncRetrySession(coordinator, graph, nextResults);
}

export function retryStage(
  coordinator: ExecutionCoordinator,
  stageId?: string,
): ExecutionCoordinator {
  const targetStageId = resolveRetryStageId(coordinator, stageId);

  if (!targetStageId || !canRetryStage(coordinator, targetStageId)) {
    return coordinator;
  }

  const stageTaskIds = coordinator.session.graph.tasks
    .filter((task) => task.stageId === targetStageId)
    .map((task) => task.id);

  const resetIds = new Set<string>();

  for (const taskId of stageTaskIds) {
    resetIds.add(taskId);
    for (const downstreamId of getDownstreamTaskIds(taskId, coordinator.session.graph.tasks)) {
      resetIds.add(downstreamId);
    }
  }

  const tasks = coordinator.session.graph.tasks.map((task) =>
    resetIds.has(task.id) && task.status !== 'completed' ? resetTask(task) : task,
  );

  const refreshed = reconcileExecutionTaskStatuses(tasks);
  const nextResults = { ...coordinator.session.results };

  for (const id of resetIds) {
    delete nextResults[id];
  }

  const graph = applyGraphTasks(coordinator.session.graph, refreshed);

  return syncRetrySession(coordinator, graph, nextResults);
}

export function applyExecutionControl(
  coordinator: ExecutionCoordinator,
  action: ExecutionControlAction,
  options?: { taskId?: string; stageId?: string; initialGraph?: ExecutionGraph },
): ExecutionCoordinator {
  switch (action) {
    case 'pause':
      return pauseExecution(coordinator);
    case 'resume':
      return resumeExecution(coordinator);
    case 'cancel':
      return cancelExecution(coordinator);
    case 'restart':
      return restartExecution(coordinator, options?.initialGraph);
    case 'retry_task':
      return retryTask(coordinator, options?.taskId);
    case 'retry_stage':
      return retryStage(coordinator, options?.stageId);
    default:
      return coordinator;
  }
}

export const EXECUTION_CONTROL_STATE_LABELS: Record<ExecutionControlState, string> = {
  active: 'Active',
  paused: 'Paused',
  retrying: 'Retrying',
  cancelled: 'Cancelled',
  completed: 'Completed',
  failed: 'Failed',
};
