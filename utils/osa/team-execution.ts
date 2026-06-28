import type {
  ExecutionPlan,
  ExecutionStage as PlanExecutionStage,
} from '@/utils/osa/execution-planner';

export type ExecutionTaskStatus =
  | 'pending'
  | 'ready'
  | 'running'
  | 'completed'
  | 'failed'
  | 'blocked';

export type ExecutionResult = {
  summary: string;
  output: string | null;
};

export type ExecutionTask = {
  id: string;
  agentId: string;
  stageId: string;
  title: string;
  description: string;
  status: ExecutionTaskStatus;
  dependsOn: string[];
  startedAt: string | null;
  finishedAt: string | null;
  estimatedMinutes: number;
  result: ExecutionResult | null;
  error: string | null;
};

export type ExecutionStage = {
  id: string;
  title: string;
  description: string;
  parallel: boolean;
  estimatedMinutes: number;
  dependsOn: string[];
  taskIds: string[];
};

export type ExecutionGraph = {
  id: string;
  stages: ExecutionStage[];
  tasks: ExecutionTask[];
  parallelGroups: string[][];
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  progress: number;
  remainingTasks: number;
  eta: number;
};

export type ExecutionGraphProgress = Pick<
  ExecutionGraph,
  'totalTasks' | 'completedTasks' | 'failedTasks' | 'progress' | 'remainingTasks' | 'eta'
>;

export type BuildExecutionGraphInput = {
  plan: ExecutionPlan;
  graphId?: string;
};

function createTaskId(stageId: string, agentId: string): string {
  return `${stageId}:${agentId}`;
}

function splitStageMinutes(stage: PlanExecutionStage): number {
  const agentCount = Math.max(stage.assignedAgents.length, 1);
  return Math.max(1, Math.ceil(stage.estimatedMinutes / agentCount));
}

export function buildAgentTasks(
  stage: PlanExecutionStage,
  upstreamTaskIds: string[],
): ExecutionTask[] {
  const perAgentMinutes = splitStageMinutes(stage);
  const tasks: ExecutionTask[] = [];

  for (const [index, agent] of stage.assignedAgents.entries()) {
    const dependsOn: string[] = [...upstreamTaskIds];

    if (!stage.parallel && index > 0) {
      const previousAgent = stage.assignedAgents[index - 1];
      if (previousAgent) {
        dependsOn.push(createTaskId(stage.id, previousAgent.id));
      }
    }

    tasks.push({
      id: createTaskId(stage.id, agent.id),
      agentId: agent.id,
      stageId: stage.id,
      title: `${stage.title} — ${agent.name}`,
      description: stage.description,
      status: 'pending',
      dependsOn: [...new Set(dependsOn)],
      startedAt: null,
      finishedAt: null,
      estimatedMinutes: perAgentMinutes,
      result: null,
      error: null,
    });
  }

  return tasks;
}

export function groupParallelTasks(tasks: ExecutionTask[], stages: ExecutionStage[]): string[][] {
  const taskIds = new Set(tasks.map((task) => task.id));
  const groups: string[][] = [];

  for (const stage of stages) {
    if (!stage.parallel || stage.taskIds.length <= 1) {
      continue;
    }

    const group = stage.taskIds.filter((taskId) => taskIds.has(taskId));

    if (group.length > 1) {
      groups.push(group);
    }
  }

  return groups;
}

function indexTasks(tasks: ExecutionTask[]): Map<string, ExecutionTask> {
  return new Map(tasks.map((task) => [task.id, task]));
}

function dependenciesMet(task: ExecutionTask, tasksById: Map<string, ExecutionTask>): boolean {
  return task.dependsOn.every((dependencyId) => {
    const dependency = tasksById.get(dependencyId);
    return dependency?.status === 'completed';
  });
}

function refreshTaskStatuses(tasks: ExecutionTask[]): ExecutionTask[] {
  const tasksById = indexTasks(tasks);

  return tasks.map((task) => {
    if (
      task.status === 'completed' ||
      task.status === 'failed' ||
      task.status === 'running' ||
      task.status === 'blocked'
    ) {
      return task;
    }

    if (task.dependsOn.length === 0 || dependenciesMet(task, tasksById)) {
      return { ...task, status: 'ready' };
    }

    return { ...task, status: 'pending' };
  });
}

function collectDownstreamTaskIds(taskId: string, tasks: ExecutionTask[]): Set<string> {
  const downstream = new Set<string>();
  const queue = [taskId];

  while (queue.length > 0) {
    const current = queue.pop();

    if (!current) {
      continue;
    }

    for (const task of tasks) {
      if (task.dependsOn.includes(current) && !downstream.has(task.id)) {
        downstream.add(task.id);
        queue.push(task.id);
      }
    }
  }

  return downstream;
}

export function estimateProgress(tasks: ExecutionTask[]): ExecutionGraphProgress {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const failedTasks = tasks.filter((task) => task.status === 'failed').length;
  const remainingTasks = tasks.filter(
    (task) => task.status !== 'completed' && task.status !== 'failed',
  ).length;
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const eta = tasks
    .filter((task) => task.status !== 'completed' && task.status !== 'failed')
    .reduce((sum, task) => sum + task.estimatedMinutes, 0);

  return {
    totalTasks,
    completedTasks,
    failedTasks,
    progress,
    remainingTasks,
    eta,
  };
}

function applyProgressMetrics(graph: ExecutionGraph): ExecutionGraph {
  const metrics = estimateProgress(graph.tasks);

  return {
    ...graph,
    ...metrics,
  };
}

export function getReadyTasks(graph: ExecutionGraph): ExecutionTask[] {
  return graph.tasks.filter((task) => task.status === 'ready');
}

export function completeTask(
  graph: ExecutionGraph,
  taskId: string,
  result: ExecutionResult,
  finishedAt: string = new Date().toISOString(),
): ExecutionGraph {
  const tasks = graph.tasks.map((task) => {
    if (task.id !== taskId) {
      return task;
    }

    return {
      ...task,
      status: 'completed' as const,
      result,
      error: null,
      finishedAt,
      startedAt: task.startedAt ?? finishedAt,
    };
  });

  const refreshedTasks = refreshTaskStatuses(tasks);

  return applyProgressMetrics({
    ...graph,
    tasks: refreshedTasks,
  });
}

export function failTask(
  graph: ExecutionGraph,
  taskId: string,
  error: string,
  finishedAt: string = new Date().toISOString(),
): ExecutionGraph {
  const downstream = collectDownstreamTaskIds(taskId, graph.tasks);

  const tasks = graph.tasks.map((task) => {
    if (task.id === taskId) {
      return {
        ...task,
        status: 'failed' as const,
        error,
        result: null,
        finishedAt,
        startedAt: task.startedAt ?? finishedAt,
      };
    }

    if (downstream.has(task.id)) {
      return {
        ...task,
        status: 'blocked' as const,
        error: `Blocked by failed task ${taskId}`,
      };
    }

    return task;
  });

  return applyProgressMetrics({
    ...graph,
    tasks: refreshTaskStatuses(tasks),
  });
}

export function buildExecutionGraph(input: BuildExecutionGraphInput): ExecutionGraph {
  const graphId =
    input.graphId ?? `osa-graph-${input.plan.stages.map((stage) => stage.id).join('-') || 'empty'}`;
  const stageSnapshots: ExecutionStage[] = [];
  const tasks: ExecutionTask[] = [];
  const tasksByStage = new Map<string, ExecutionTask[]>();

  for (const stage of input.plan.stages) {
    const upstreamStageIds = stage.dependsOn;
    const upstreamTaskIds = upstreamStageIds.flatMap(
      (stageId) => tasksByStage.get(stageId)?.map((task) => task.id) ?? [],
    );
    const stageTasks = buildAgentTasks(stage, upstreamTaskIds);

    tasksByStage.set(stage.id, stageTasks);
    tasks.push(...stageTasks);

    stageSnapshots.push({
      id: stage.id,
      title: stage.title,
      description: stage.description,
      parallel: stage.parallel,
      estimatedMinutes: stage.estimatedMinutes,
      dependsOn: [...stage.dependsOn],
      taskIds: stageTasks.map((task) => task.id),
    });
  }

  const refreshedTasks = refreshTaskStatuses(tasks);
  const parallelGroups = groupParallelTasks(refreshedTasks, stageSnapshots);

  return applyProgressMetrics({
    id: graphId,
    stages: stageSnapshots,
    tasks: refreshedTasks,
    parallelGroups,
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    progress: 0,
    remainingTasks: 0,
    eta: 0,
  });
}

export function serializeExecutionGraph(graph: ExecutionGraph): Record<string, unknown> {
  return {
    id: graph.id,
    stages: graph.stages,
    tasks: graph.tasks,
    parallelGroups: graph.parallelGroups,
    totalTasks: graph.totalTasks,
    completedTasks: graph.completedTasks,
    failedTasks: graph.failedTasks,
    progress: graph.progress,
    remainingTasks: graph.remainingTasks,
    eta: graph.eta,
  };
}

export function parseExecutionGraph(value: unknown): ExecutionGraph | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (!Array.isArray(record.tasks) || !Array.isArray(record.stages)) {
    return null;
  }

  const tasks = record.tasks as ExecutionTask[];
  const stages = record.stages as ExecutionStage[];
  const parallelGroups = Array.isArray(record.parallelGroups)
    ? (record.parallelGroups as string[][])
    : groupParallelTasks(tasks, stages);

  return applyProgressMetrics({
    id: typeof record.id === 'string' ? record.id : 'osa-graph',
    stages,
    tasks,
    parallelGroups,
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    progress: 0,
    remainingTasks: 0,
    eta: 0,
  });
}
