import {
  AutomationPlannerNotPlannedError,
  AutomationPlannerValidationError,
} from '@/services/automation/automation-planner-errors';
import {
  TaskGraphValidationError,
  validateTaskGraph,
} from '@/services/automation/task-graph-validator';
import { serializeAutomationPlannerSnapshot } from '@/services/automation/automation-planner-serializer';
import type {
  AutomationPlannerInput,
  AutomationPlannerOptions,
  AutomationPlannerPlanResult,
  AutomationPlannerReport,
  AutomationPlannerSnapshot,
  AutomationPlannerStatistics,
  AutomationPlannerTask,
  AutomationPlannerTaskState,
  SerializedAutomationPlannerSnapshot,
} from '@/services/automation/automation-planner-types';

const VALID_STATES = new Set<AutomationPlannerTaskState>([
  'pending',
  'ready',
  'running',
  'completed',
  'failed',
  'blocked',
  'skipped',
]);

const TERMINAL_STATES = new Set<AutomationPlannerTaskState>(['completed', 'failed', 'skipped']);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneTask(task: AutomationPlannerTask): AutomationPlannerTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? null,
    dependencies: [...task.dependencies],
    status: task.status,
    priority: task.priority,
    order: task.order,
    metadata: { ...task.metadata },
  };
}

function normalizeDependencies(dependencies: string[] | undefined): string[] {
  if (!Array.isArray(dependencies)) {
    return [];
  }

  return dependencies.map((dependency) => String(dependency).trim()).filter(Boolean);
}

function computeDepths(tasks: AutomationPlannerTask[]): Map<string, number> {
  const depths = new Map<string, number>();
  const taskMap = new Map(tasks.map((task) => [task.id, task]));

  const resolveDepth = (taskId: string, visiting: Set<string>): number => {
    const cached = depths.get(taskId);
    if (cached !== undefined) {
      return cached;
    }

    if (visiting.has(taskId)) {
      return 0;
    }

    visiting.add(taskId);
    const task = taskMap.get(taskId);
    if (!task || task.dependencies.length === 0) {
      depths.set(taskId, 0);
      visiting.delete(taskId);
      return 0;
    }

    const depth =
      1 +
      Math.max(...task.dependencies.map((dependencyId) => resolveDepth(dependencyId, visiting)));
    depths.set(taskId, depth);
    visiting.delete(taskId);
    return depth;
  };

  for (const task of tasks) {
    resolveDepth(task.id, new Set());
  }

  return depths;
}

function compareTaskPriority(
  left: AutomationPlannerTask,
  right: AutomationPlannerTask,
  depths: Map<string, number>,
): number {
  if (left.priority !== right.priority) {
    return left.priority - right.priority;
  }

  const leftDepth = depths.get(left.id) ?? 0;
  const rightDepth = depths.get(right.id) ?? 0;
  if (leftDepth !== rightDepth) {
    return leftDepth - rightDepth;
  }

  return left.order - right.order;
}

function buildExecutionOrder(
  tasks: AutomationPlannerTask[],
  depths: Map<string, number>,
): string[] {
  return [...tasks]
    .sort((left, right) => compareTaskPriority(left, right, depths))
    .map((task) => task.id);
}

function buildStatistics(tasks: AutomationPlannerTask[]): AutomationPlannerStatistics {
  const completed = tasks.filter((task) => task.status === 'completed').length;
  const failed = tasks.filter((task) => task.status === 'failed').length;
  const blocked = tasks.filter((task) => task.status === 'blocked').length;
  const ready = tasks.filter((task) => task.status === 'ready').length;
  const pending = tasks.filter((task) => task.status === 'pending').length;
  const remaining = tasks.filter((task) => !TERMINAL_STATES.has(task.status)).length;

  return {
    totalTasks: tasks.length,
    completed,
    failed,
    blocked,
    ready,
    pending,
    remaining,
  };
}

/**
 * Deterministic roadmap task planner for autonomous worker execution.
 */
export class AutomationPlanner {
  private roadmapId: string | null = null;
  private roadmapTitle: string | null = null;
  private tasks: AutomationPlannerTask[] = [];
  private planResult: AutomationPlannerPlanResult | null = null;
  private snapshot: AutomationPlannerSnapshot;

  constructor(private readonly instanceId: string) {
    this.snapshot = this.createEmptySnapshot();
  }

  plan(input: AutomationPlannerInput): AutomationPlannerPlanResult {
    this.validateInput(input);

    const normalizedTasks = input.tasks.map((task, index) => this.normalizeTask(task, index));
    this.validateTaskGraph(normalizedTasks);

    const resolvedTasks = this.resolveTaskStates(normalizedTasks);
    const depths = computeDepths(resolvedTasks);
    const readyTasks = resolvedTasks
      .filter((task) => task.status === 'ready')
      .sort((left, right) => compareTaskPriority(left, right, depths));
    const blockedTasks = resolvedTasks.filter((task) => task.status === 'blocked');
    const completedTasks = resolvedTasks.filter((task) => task.status === 'completed');
    const remainingTasks = resolvedTasks.filter((task) => !TERMINAL_STATES.has(task.status));

    this.roadmapId = input.roadmapId;
    this.roadmapTitle = input.roadmapTitle;
    this.tasks = resolvedTasks;

    this.planResult = {
      nextTask: readyTasks[0] ? cloneTask(readyTasks[0]) : null,
      blockedTasks: blockedTasks.map(cloneTask),
      readyTasks: readyTasks.map(cloneTask),
      completedTasks: completedTasks.map(cloneTask),
      remainingTasks: remainingTasks.map(cloneTask),
      executionOrder: buildExecutionOrder(resolvedTasks, depths),
    };

    this.snapshot = {
      instanceId: this.instanceId,
      roadmapId: this.roadmapId,
      roadmapTitle: this.roadmapTitle,
      planned: true,
      statistics: buildStatistics(resolvedTasks),
      nextTaskId: this.planResult.nextTask?.id ?? null,
      updatedAt: nowIso(),
    };

    return this.clonePlanResult(this.planResult);
  }

  next(): AutomationPlannerTask | null {
    this.requirePlan();

    const depths = computeDepths(this.tasks);
    const readyTasks = this.tasks
      .filter((task) => task.status === 'ready')
      .sort((left, right) => compareTaskPriority(left, right, depths));

    const nextTask = readyTasks[0] ?? null;
    if (!nextTask) {
      this.planResult = {
        ...this.planResult!,
        nextTask: null,
      };
      this.snapshot = {
        ...this.snapshot,
        nextTaskId: null,
        statistics: buildStatistics(this.tasks),
        updatedAt: nowIso(),
      };
      return null;
    }

    nextTask.status = 'running';
    this.refreshPlanFromTasks();
    return cloneTask(nextTask);
  }

  blocked(): AutomationPlannerTask[] {
    this.requirePlan();
    return this.planResult!.blockedTasks.map(cloneTask);
  }

  completed(): AutomationPlannerTask[] {
    this.requirePlan();
    return this.planResult!.completedTasks.map(cloneTask);
  }

  remaining(): AutomationPlannerTask[] {
    this.requirePlan();
    return this.planResult!.remainingTasks.map(cloneTask);
  }

  report(): AutomationPlannerReport {
    const statistics = this.planResult ? buildStatistics(this.tasks) : this.snapshot.statistics;

    return {
      instanceId: this.instanceId,
      roadmapId: this.roadmapId,
      roadmapTitle: this.roadmapTitle,
      statistics,
      nextTaskId: this.planResult?.nextTask?.id ?? null,
      blockedTaskIds: this.planResult?.blockedTasks.map((task) => task.id) ?? [],
      readyTaskIds: this.planResult?.readyTasks.map((task) => task.id) ?? [],
      completedTaskIds: this.planResult?.completedTasks.map((task) => task.id) ?? [],
      remainingTaskIds: this.planResult?.remainingTasks.map((task) => task.id) ?? [],
      executionOrder: this.planResult?.executionOrder ?? [],
      updatedAt: nowIso(),
    };
  }

  serialize(): SerializedAutomationPlannerSnapshot {
    return serializeAutomationPlannerSnapshot({
      snapshot: this.snapshot,
      plan: this.planResult ? this.clonePlanResult(this.planResult) : null,
      report: this.report(),
    });
  }

  reset(): void {
    this.roadmapId = null;
    this.roadmapTitle = null;
    this.tasks = [];
    this.planResult = null;
    this.snapshot = this.createEmptySnapshot();
  }

  syncTaskStatus(taskId: string, status: AutomationPlannerTaskState): void {
    this.requirePlan();

    const task = this.tasks.find((entry) => entry.id === taskId);
    if (!task) {
      throw new AutomationPlannerValidationError(`task not found: ${taskId}`);
    }

    if (!VALID_STATES.has(status)) {
      throw new AutomationPlannerValidationError(`invalid task state: ${status}`);
    }

    task.status = status;
    this.refreshPlanFromTasks();
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  private refreshPlanFromTasks(): void {
    if (!this.roadmapId || !this.roadmapTitle) {
      return;
    }

    this.plan({
      roadmapId: this.roadmapId,
      roadmapTitle: this.roadmapTitle,
      tasks: this.tasks.map(cloneTask),
    });
  }

  private normalizeTask(task: AutomationPlannerTask, index: number): AutomationPlannerTask {
    if (!task || typeof task !== 'object') {
      throw new AutomationPlannerValidationError('task must be an object');
    }

    if (!isNonEmptyString(task.id)) {
      throw new AutomationPlannerValidationError('task id is required');
    }

    if (!isNonEmptyString(task.title)) {
      throw new AutomationPlannerValidationError('task title is required');
    }

    if (!VALID_STATES.has(task.status)) {
      throw new AutomationPlannerValidationError(`invalid task state: ${task.status}`);
    }

    const priority =
      typeof task.priority === 'number' && Number.isFinite(task.priority) ? task.priority : 0;
    const order =
      typeof task.order === 'number' && Number.isFinite(task.order) ? task.order : index;

    return {
      id: task.id.trim(),
      title: task.title.trim(),
      description: isNonEmptyString(task.description) ? task.description.trim() : null,
      dependencies: normalizeDependencies(task.dependencies),
      status: task.status,
      priority,
      order,
      metadata: task.metadata ? { ...task.metadata } : {},
    };
  }

  private validateInput(input: AutomationPlannerInput): void {
    if (!input || typeof input !== 'object') {
      throw new AutomationPlannerValidationError('planner input must be an object');
    }

    if (!isNonEmptyString(input.roadmapId)) {
      throw new AutomationPlannerValidationError('roadmap id is required');
    }

    if (!isNonEmptyString(input.roadmapTitle)) {
      throw new AutomationPlannerValidationError('roadmap title is required');
    }

    if (!Array.isArray(input.tasks)) {
      throw new AutomationPlannerValidationError('tasks must be an array');
    }
  }

  private validateTaskGraph(tasks: AutomationPlannerTask[]): void {
    try {
      validateTaskGraph(tasks);
    } catch (error) {
      if (error instanceof TaskGraphValidationError) {
        throw new AutomationPlannerValidationError(error.message);
      }

      throw error;
    }
  }

  private resolveTaskStates(tasks: AutomationPlannerTask[]): AutomationPlannerTask[] {
    const taskMap = new Map(tasks.map((task) => [task.id, cloneTask(task)]));

    for (const task of taskMap.values()) {
      if (TERMINAL_STATES.has(task.status) || task.status === 'running') {
        continue;
      }

      const dependencyStates = task.dependencies.map(
        (dependencyId) => taskMap.get(dependencyId)?.status ?? 'pending',
      );

      if (dependencyStates.some((status) => status === 'failed')) {
        task.status = 'blocked';
        continue;
      }

      if (dependencyStates.some((status) => status !== 'completed' && status !== 'skipped')) {
        task.status = 'pending';
        continue;
      }

      if (task.status === 'pending' || task.status === 'ready' || task.status === 'blocked') {
        task.status = 'ready';
      }
    }

    return [...taskMap.values()];
  }

  private requirePlan(): void {
    if (!this.planResult) {
      throw new AutomationPlannerNotPlannedError();
    }
  }

  private clonePlanResult(plan: AutomationPlannerPlanResult): AutomationPlannerPlanResult {
    return {
      nextTask: plan.nextTask ? cloneTask(plan.nextTask) : null,
      blockedTasks: plan.blockedTasks.map(cloneTask),
      readyTasks: plan.readyTasks.map(cloneTask),
      completedTasks: plan.completedTasks.map(cloneTask),
      remainingTasks: plan.remainingTasks.map(cloneTask),
      executionOrder: [...plan.executionOrder],
    };
  }

  private createEmptySnapshot(): AutomationPlannerSnapshot {
    return {
      instanceId: this.instanceId,
      roadmapId: null,
      roadmapTitle: null,
      planned: false,
      statistics: {
        totalTasks: 0,
        completed: 0,
        failed: 0,
        blocked: 0,
        ready: 0,
        pending: 0,
        remaining: 0,
      },
      nextTaskId: null,
      updatedAt: nowIso(),
    };
  }
}

export function createAutomationPlanner(options?: AutomationPlannerOptions): AutomationPlanner {
  const instanceId = options?.instanceId?.trim() || 'default-automation-planner';
  return new AutomationPlanner(instanceId);
}

/** Default dev/test singleton. Deterministic automation planner. */
export const automationPlanner = createAutomationPlanner();
