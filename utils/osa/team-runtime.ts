import { serializeExecutionPlan, type ExecutionPlan } from '@/utils/osa/execution-planner';
import type { OsaTaskAgentRef } from '@/utils/osa/osa-task';
import {
  applyGraphTasks,
  completeTask,
  estimateProgress,
  failTask,
  getReadyTasks,
  parseExecutionGraph,
  serializeExecutionGraph,
  type ExecutionGraph,
  type ExecutionGraphStage,
  type ExecutionResult,
  type ExecutionTask,
} from '@/utils/osa/team-execution';

export type ExecutionState = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export type ExecutionSnapshot = {
  id: string;
  stageId: string;
  taskIds: string[];
  parentSnapshotId: string | null;
  createdAt: string;
  results: Record<string, ExecutionResult>;
};

export type ExecutionStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export type ExecutionStep = {
  id: string;
  stageId: string;
  taskIds: string[];
  snapshotId: string;
  status: ExecutionStepStatus;
  startedAt: string | null;
  finishedAt: string | null;
};

export type ExecutionSession = {
  id: string;
  state: ExecutionState;
  currentStage: string | null;
  graph: ExecutionGraph;
  executionPlan: ExecutionPlan;
  businessContext: string;
  userGoal: string;
  selectedAgents: OsaTaskAgentRef[];
  completedTasks: string[];
  runningTasks: string[];
  failedTasks: string[];
  blockedTasks: string[];
  results: Record<string, ExecutionResult>;
  snapshots: ExecutionSnapshot[];
  steps: ExecutionStep[];
  progress: number;
  eta: number;
  createdAt: string;
  updatedAt: string;
};

export type ExecutionCoordinator = {
  session: ExecutionSession;
};

export type CreateExecutionSessionInput = {
  sessionId: string;
  executionPlan: ExecutionPlan;
  executionGraph: ExecutionGraph;
  businessContext: string;
  userGoal: string;
  selectedAgents: OsaTaskAgentRef[];
};

export type PrepareRuntimeCallOptions = {
  sessionId: string;
  runId: string;
  source?: string;
  snapshotId?: string;
};

export type PreparedRuntimeCall = {
  taskId: string;
  stageId: string;
  snapshotId: string;
  payload: Record<string, unknown>;
};

function nowIso(): string {
  return new Date().toISOString();
}

function getStageById(
  stages: ExecutionGraphStage[],
  stageId: string,
): ExecutionGraphStage | undefined {
  return stages.find((stage) => stage.id === stageId);
}

function getTaskAgent(session: ExecutionSession, task: ExecutionTask): OsaTaskAgentRef {
  const selected = session.selectedAgents.find((agent) => agent.id === task.agentId);

  return (
    selected ?? {
      id: task.agentId,
      name: task.title.split(' — ').pop() ?? task.agentId,
    }
  );
}

function collectPreviousResults(
  task: ExecutionTask,
  results: Record<string, ExecutionResult>,
): Record<string, ExecutionResult> {
  return task.dependsOn.reduce<Record<string, ExecutionResult>>((previous, dependencyId) => {
    const result = results[dependencyId];

    if (result) {
      previous[dependencyId] = result;
    }

    return previous;
  }, {});
}

function resolveCurrentStage(graph: ExecutionGraph): string | null {
  for (const stage of graph.stages) {
    const stageTasks = graph.tasks.filter((task) => task.stageId === stage.id);

    if (stageTasks.length === 0) {
      continue;
    }

    if (stageTasks.some((task) => ['ready', 'running', 'pending'].includes(task.status))) {
      return stage.id;
    }
  }

  return graph.stages.at(-1)?.id ?? null;
}

function resolveSessionState(graph: ExecutionGraph, currentState: ExecutionState): ExecutionState {
  if (currentState === 'paused' || currentState === 'cancelled') {
    return currentState;
  }

  if (graph.failedTasks > 0) {
    return 'failed';
  }

  if (graph.completedTasks === graph.totalTasks && graph.totalTasks > 0) {
    return 'completed';
  }

  if (currentState === 'running') {
    return 'running';
  }

  return currentState;
}

function syncSession(session: ExecutionSession, graph: ExecutionGraph): ExecutionSession {
  const metrics = estimateProgress(graph.tasks);

  return {
    ...session,
    graph: {
      ...graph,
      ...metrics,
    },
    currentStage: resolveCurrentStage(graph),
    completedTasks: graph.tasks
      .filter((task) => task.status === 'completed')
      .map((task) => task.id),
    runningTasks: graph.tasks.filter((task) => task.status === 'running').map((task) => task.id),
    failedTasks: graph.tasks.filter((task) => task.status === 'failed').map((task) => task.id),
    blockedTasks: graph.tasks.filter((task) => task.status === 'blocked').map((task) => task.id),
    progress: metrics.progress,
    eta: metrics.eta,
    state: resolveSessionState(graph, session.state),
    updatedAt: nowIso(),
  };
}

function withCoordinator(session: ExecutionSession): ExecutionCoordinator {
  return { session };
}

function markTaskRunning(graph: ExecutionGraph, taskId: string): ExecutionGraph {
  return applyGraphTasks(
    graph,
    graph.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status: 'running',
            startedAt: task.startedAt ?? nowIso(),
          }
        : task,
    ),
  );
}

function createSnapshotForTasks(
  session: ExecutionSession,
  taskIds: string[],
  stageId: string,
): ExecutionSnapshot {
  const parentSnapshot = session.snapshots.at(-1) ?? null;

  return {
    id: `snapshot-${session.snapshots.length + 1}-${stageId}`,
    stageId,
    taskIds: [...taskIds],
    parentSnapshotId: parentSnapshot?.id ?? null,
    createdAt: nowIso(),
    results: { ...session.results },
  };
}

export function createExecutionSession(input: CreateExecutionSessionInput): ExecutionCoordinator {
  const timestamp = nowIso();

  const session: ExecutionSession = {
    id: input.sessionId,
    state: 'idle',
    currentStage: resolveCurrentStage(input.executionGraph),
    graph: input.executionGraph,
    executionPlan: input.executionPlan,
    businessContext: input.businessContext.trim(),
    userGoal: input.userGoal.trim(),
    selectedAgents: input.selectedAgents,
    completedTasks: [],
    runningTasks: [],
    failedTasks: [],
    blockedTasks: [],
    results: {},
    snapshots: [],
    steps: [],
    progress: input.executionGraph.progress,
    eta: input.executionGraph.eta,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return withCoordinator(syncSession(session, session.graph));
}

export function startExecution(coordinator: ExecutionCoordinator): ExecutionCoordinator {
  const session = syncSession(
    {
      ...coordinator.session,
      state: 'running',
    },
    coordinator.session.graph,
  );

  return withCoordinator(session);
}

export function getNextReadyTasks(coordinator: ExecutionCoordinator): ExecutionTask[] {
  if (coordinator.session.state !== 'running') {
    return [];
  }

  const readyTasks = getReadyTasks(coordinator.session.graph);

  if (readyTasks.length === 0) {
    return [];
  }

  const currentStageId = coordinator.session.currentStage ?? readyTasks[0]?.stageId;

  if (!currentStageId) {
    return readyTasks;
  }

  return readyTasks.filter((task) => task.stageId === currentStageId);
}

export function prepareRuntimeCall(
  coordinator: ExecutionCoordinator,
  taskId: string,
  options: PrepareRuntimeCallOptions,
): PreparedRuntimeCall {
  const task = coordinator.session.graph.tasks.find((entry) => entry.id === taskId);

  if (!task) {
    throw new Error(`Task ${taskId} not found`);
  }

  const stage = getStageById(coordinator.session.graph.stages, task.stageId);

  if (!stage) {
    throw new Error(`Stage ${task.stageId} not found`);
  }

  const snapshot =
    coordinator.session.snapshots.find((entry) => entry.taskIds.includes(taskId)) ??
    createSnapshotForTasks(coordinator.session, [taskId], task.stageId);
  const assignedAgent = getTaskAgent(coordinator.session, task);
  const previousResults = collectPreviousResults(task, coordinator.session.results);

  const payload: Record<string, unknown> = {
    task: {
      id: task.id,
      agentId: task.agentId,
      title: task.title,
      description: task.description,
      status: task.status,
      dependsOn: task.dependsOn,
      estimatedMinutes: task.estimatedMinutes,
    },
    stage,
    executionGraph: serializeExecutionGraph(coordinator.session.graph),
    executionPlan: serializeExecutionPlan(coordinator.session.executionPlan),
    previousResults,
    assignedAgent,
    businessContext: coordinator.session.businessContext,
    userGoal: coordinator.session.userGoal,
    selectedAgents: coordinator.session.selectedAgents,
    sessionId: options.sessionId,
    runId: options.runId,
    source: options.source ?? 'osa_workspace',
    snapshotId: options.snapshotId ?? snapshot.id,
    executionSessionId: coordinator.session.id,
    executionStepMode: 'stage-by-stage',
  };

  return {
    taskId,
    stageId: task.stageId,
    snapshotId: options.snapshotId ?? snapshot.id,
    payload,
  };
}

function beginRuntimeTask(coordinator: ExecutionCoordinator, taskId: string): ExecutionCoordinator {
  const graph = markTaskRunning(coordinator.session.graph, taskId);

  return withCoordinator(
    syncSession(
      {
        ...coordinator.session,
        graph,
      },
      graph,
    ),
  );
}

function ensureStepForTasks(
  session: ExecutionSession,
  taskIds: string[],
  stageId: string,
  snapshotId: string,
): ExecutionStep[] {
  const existing = session.steps.find(
    (step) => step.stageId === stageId && step.snapshotId === snapshotId,
  );

  if (existing) {
    return session.steps.map((step) =>
      step.id === existing.id
        ? {
            ...step,
            status: 'running',
            startedAt: step.startedAt ?? nowIso(),
            taskIds: [...new Set([...step.taskIds, ...taskIds])],
          }
        : step,
    );
  }

  return [
    ...session.steps,
    {
      id: `step-${session.steps.length + 1}-${stageId}`,
      stageId,
      taskIds: [...taskIds],
      snapshotId,
      status: 'running',
      startedAt: nowIso(),
      finishedAt: null,
    },
  ];
}

export function prepareRuntimeCallsForReadyTasks(
  coordinator: ExecutionCoordinator,
  options: PrepareRuntimeCallOptions,
): { coordinator: ExecutionCoordinator; calls: PreparedRuntimeCall[] } {
  const readyTasks = getNextReadyTasks(coordinator);

  if (readyTasks.length === 0) {
    return { coordinator, calls: [] };
  }

  const stageId = readyTasks[0]!.stageId;
  const snapshot = createSnapshotForTasks(
    coordinator.session,
    readyTasks.map((task) => task.id),
    stageId,
  );

  let nextCoordinator = withCoordinator({
    ...coordinator.session,
    snapshots: [...coordinator.session.snapshots, snapshot],
    steps: ensureStepForTasks(
      coordinator.session,
      readyTasks.map((task) => task.id),
      stageId,
      snapshot.id,
    ),
  });

  const calls = readyTasks.map((task) => {
    nextCoordinator = beginRuntimeTask(nextCoordinator, task.id);
    return prepareRuntimeCall(nextCoordinator, task.id, {
      ...options,
      snapshotId: snapshot.id,
    });
  });

  return { coordinator: nextCoordinator, calls };
}

export function completeRuntimeTask(
  coordinator: ExecutionCoordinator,
  taskId: string,
  result: ExecutionResult,
): ExecutionCoordinator {
  const graph = completeTask(coordinator.session.graph, taskId, result);
  const results = {
    ...coordinator.session.results,
    [taskId]: result,
  };

  const snapshots = coordinator.session.snapshots.map((snapshot) =>
    snapshot.taskIds.includes(taskId)
      ? {
          ...snapshot,
          results: {
            ...snapshot.results,
            [taskId]: result,
          },
        }
      : snapshot,
  );

  const steps = coordinator.session.steps.map((step) => {
    if (!step.taskIds.includes(taskId)) {
      return step;
    }

    const stepTasks = graph.tasks.filter((task) => step.taskIds.includes(task.id));
    const allCompleted = stepTasks.every((task) => task.status === 'completed');

    return {
      ...step,
      status: allCompleted ? ('completed' as const) : step.status,
      finishedAt: allCompleted ? nowIso() : step.finishedAt,
    };
  });

  return withCoordinator(
    syncSession(
      {
        ...coordinator.session,
        results,
        snapshots,
        steps,
        graph,
      },
      graph,
    ),
  );
}

export function failRuntimeTask(
  coordinator: ExecutionCoordinator,
  taskId: string,
  error: string,
): ExecutionCoordinator {
  const graph = failTask(coordinator.session.graph, taskId, error);

  const steps = coordinator.session.steps.map((step) =>
    step.taskIds.includes(taskId)
      ? {
          ...step,
          status: 'failed' as const,
          finishedAt: nowIso(),
        }
      : step,
  );

  return withCoordinator(
    syncSession(
      {
        ...coordinator.session,
        steps,
        graph,
        state: 'failed',
      },
      graph,
    ),
  );
}

export function pauseExecution(coordinator: ExecutionCoordinator): ExecutionCoordinator {
  if (coordinator.session.state !== 'running') {
    return coordinator;
  }

  return withCoordinator({
    ...coordinator.session,
    state: 'paused',
    updatedAt: nowIso(),
  });
}

export function resumeExecution(coordinator: ExecutionCoordinator): ExecutionCoordinator {
  if (coordinator.session.state !== 'paused') {
    return coordinator;
  }

  return withCoordinator(
    syncSession(
      {
        ...coordinator.session,
        state: 'running',
      },
      coordinator.session.graph,
    ),
  );
}

export function cancelExecution(coordinator: ExecutionCoordinator): ExecutionCoordinator {
  const graph = {
    ...coordinator.session.graph,
    tasks: coordinator.session.graph.tasks.map((task) => {
      if (task.status === 'completed' || task.status === 'failed' || task.status === 'blocked') {
        return task;
      }

      return {
        ...task,
        status: 'blocked' as const,
        error: task.error ?? 'Execution cancelled',
      };
    }),
  };

  return withCoordinator(
    syncSession(
      {
        ...coordinator.session,
        state: 'cancelled',
        graph,
      },
      graph,
    ),
  );
}

export function estimateRemainingTime(coordinator: ExecutionCoordinator): number {
  return estimateProgress(coordinator.session.graph.tasks).eta;
}

export function isTeamExecutionComplete(coordinator: ExecutionCoordinator): boolean {
  return (
    coordinator.session.state === 'completed' ||
    (coordinator.session.graph.totalTasks > 0 &&
      coordinator.session.graph.completedTasks === coordinator.session.graph.totalTasks)
  );
}

export function hasTeamExecutionFailure(coordinator: ExecutionCoordinator): boolean {
  return coordinator.session.state === 'failed' || coordinator.session.failedTasks.length > 0;
}

export function serializeExecutionSession(session: ExecutionSession): Record<string, unknown> {
  return {
    id: session.id,
    state: session.state,
    currentStage: session.currentStage,
    graph: serializeExecutionGraph(session.graph),
    executionPlan: serializeExecutionPlan(session.executionPlan),
    businessContext: session.businessContext,
    userGoal: session.userGoal,
    selectedAgents: session.selectedAgents,
    completedTasks: session.completedTasks,
    runningTasks: session.runningTasks,
    failedTasks: session.failedTasks,
    blockedTasks: session.blockedTasks,
    results: session.results,
    snapshots: session.snapshots,
    steps: session.steps,
    progress: session.progress,
    eta: session.eta,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

export function parseExecutionSession(value: unknown): ExecutionSession | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (typeof record.id !== 'string') {
    return null;
  }

  const graph = parseExecutionGraph(record.graph);

  if (!graph) {
    return null;
  }

  const metrics = estimateProgress(graph.tasks);

  return {
    id: record.id,
    state: (record.state as ExecutionState) ?? 'idle',
    currentStage: typeof record.currentStage === 'string' ? record.currentStage : null,
    graph: { ...graph, ...metrics },
    executionPlan: record.executionPlan as ExecutionPlan,
    businessContext: typeof record.businessContext === 'string' ? record.businessContext : '',
    userGoal: typeof record.userGoal === 'string' ? record.userGoal : '',
    selectedAgents: Array.isArray(record.selectedAgents)
      ? (record.selectedAgents as OsaTaskAgentRef[])
      : [],
    completedTasks: Array.isArray(record.completedTasks) ? (record.completedTasks as string[]) : [],
    runningTasks: Array.isArray(record.runningTasks) ? (record.runningTasks as string[]) : [],
    failedTasks: Array.isArray(record.failedTasks) ? (record.failedTasks as string[]) : [],
    blockedTasks: Array.isArray(record.blockedTasks) ? (record.blockedTasks as string[]) : [],
    results: (record.results as Record<string, ExecutionResult>) ?? {},
    snapshots: Array.isArray(record.snapshots) ? (record.snapshots as ExecutionSnapshot[]) : [],
    steps: Array.isArray(record.steps) ? (record.steps as ExecutionStep[]) : [],
    progress: typeof record.progress === 'number' ? record.progress : metrics.progress,
    eta: typeof record.eta === 'number' ? record.eta : metrics.eta,
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : nowIso(),
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : nowIso(),
  };
}

export function createExecutionCoordinatorFromSubmit(
  preparedInput: {
    userPrompt: string;
    businessDescription: string;
    selectedAgents: OsaTaskAgentRef[];
    executionPlan: ExecutionPlan;
  },
  executionGraph: ExecutionGraph,
  sessionId: string,
): ExecutionCoordinator {
  return createExecutionSession({
    sessionId,
    executionPlan: preparedInput.executionPlan,
    executionGraph,
    businessContext: preparedInput.businessDescription,
    userGoal: preparedInput.userPrompt,
    selectedAgents: preparedInput.selectedAgents,
  });
}

export type TeamRuntimeTaskOutcome = ExecutionResult | { error: string };

export type TeamRuntimeProgressHook = (
  coordinator: ExecutionCoordinator,
  meta: { phase: 'started' | 'tasks_prepared' | 'task_completed' | 'task_failed' },
) => void | Promise<void>;

export async function runTeamRuntimeExecution(
  coordinator: ExecutionCoordinator,
  options: PrepareRuntimeCallOptions,
  executeTask: (call: PreparedRuntimeCall) => Promise<TeamRuntimeTaskOutcome>,
  onProgress?: TeamRuntimeProgressHook,
): Promise<ExecutionCoordinator> {
  let current = startExecution(coordinator);

  if (onProgress) {
    await onProgress(current, { phase: 'started' });
  }

  while (!isTeamExecutionComplete(current) && !hasTeamExecutionFailure(current)) {
    const { coordinator: prepared, calls } = prepareRuntimeCallsForReadyTasks(current, options);
    current = prepared;

    if (onProgress) {
      await onProgress(current, { phase: 'tasks_prepared' });
    }

    if (calls.length === 0) {
      break;
    }

    for (const call of calls) {
      const outcome = await executeTask(call);

      if ('error' in outcome) {
        current = failRuntimeTask(current, call.taskId, outcome.error);

        if (onProgress) {
          await onProgress(current, { phase: 'task_failed' });
        }

        return current;
      }

      current = completeRuntimeTask(current, call.taskId, outcome);

      if (onProgress) {
        await onProgress(current, { phase: 'task_completed' });
      }
    }
  }

  return current;
}
