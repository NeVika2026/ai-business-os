import type {
  AutomationTaskGraphNode,
  AutomationTaskStatus,
} from '@/services/automation/automation-task-types';

export type TaskGraphValidationErrorCode =
  | 'duplicate_id'
  | 'missing_dependency'
  | 'circular_dependency'
  | 'dependency_failed'
  | 'dependency_incomplete';

export class TaskGraphValidationError extends Error {
  readonly code: TaskGraphValidationErrorCode;

  constructor(message: string, code: TaskGraphValidationErrorCode) {
    super(message);
    this.name = 'TaskGraphValidationError';
    this.code = code;
  }
}

export interface ValidateTaskGraphContext {
  /** When set, also validate runtime dependency state for this task. */
  targetTaskId?: string;
  completedTaskIds?: ReadonlySet<string>;
  taskStatusById?: ReadonlyMap<string, AutomationTaskStatus>;
}

const TERMINAL_SUCCESS_STATUSES = new Set<AutomationTaskStatus>(['completed', 'skipped']);

function normalizeDependencies(dependencies: string[] | undefined): string[] {
  if (!Array.isArray(dependencies)) {
    return [];
  }

  return dependencies.map((dependency) => String(dependency).trim()).filter(Boolean);
}

function detectCycle(tasks: AutomationTaskGraphNode[]): string | null {
  const taskIds = new Set(tasks.map((task) => task.id));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const dependencyMap = new Map(
    tasks.map((task) => [task.id, normalizeDependencies(task.dependencies)]),
  );

  const visit = (taskId: string): string | null => {
    if (visited.has(taskId)) {
      return null;
    }

    if (visiting.has(taskId)) {
      return taskId;
    }

    visiting.add(taskId);

    for (const dependencyId of dependencyMap.get(taskId) ?? []) {
      if (!taskIds.has(dependencyId)) {
        continue;
      }

      const cycleTaskId = visit(dependencyId);
      if (cycleTaskId) {
        return cycleTaskId;
      }
    }

    visiting.delete(taskId);
    visited.add(taskId);
    return null;
  };

  for (const task of tasks) {
    const cycleTaskId = visit(task.id);
    if (cycleTaskId) {
      return cycleTaskId;
    }
  }

  return null;
}

function validateStructuralGraph(tasks: AutomationTaskGraphNode[]): void {
  const ids = tasks.map((task) => task.id);
  const seen = new Set<string>();

  for (const id of ids) {
    if (seen.has(id)) {
      throw new TaskGraphValidationError(`duplicate task id: ${id}`, 'duplicate_id');
    }

    seen.add(id);
  }

  for (const task of tasks) {
    for (const dependencyId of normalizeDependencies(task.dependencies)) {
      if (!seen.has(dependencyId)) {
        throw new TaskGraphValidationError(
          `missing dependency: ${dependencyId} for task ${task.id}`,
          'missing_dependency',
        );
      }
    }
  }

  const cycleTaskId = detectCycle(tasks);
  if (cycleTaskId) {
    throw new TaskGraphValidationError(
      `circular dependency detected: ${cycleTaskId}`,
      'circular_dependency',
    );
  }
}

function validateRuntimeDependencies(
  tasks: AutomationTaskGraphNode[],
  context: ValidateTaskGraphContext,
): void {
  const targetTaskId = context.targetTaskId;
  if (!targetTaskId) {
    return;
  }

  const task = tasks.find((entry) => entry.id === targetTaskId);
  if (!task) {
    return;
  }

  const taskStatusById =
    context.taskStatusById ??
    new Map(tasks.map((entry) => [entry.id, entry.status ?? 'pending'] as const));
  const completedTaskIds = context.completedTaskIds ?? new Set<string>();

  for (const dependencyId of normalizeDependencies(task.dependencies)) {
    const dependencyStatus = taskStatusById.get(dependencyId) ?? 'pending';

    if (dependencyStatus === 'failed') {
      throw new TaskGraphValidationError(
        `dependency failed: ${dependencyId} for task ${task.id}`,
        'dependency_failed',
      );
    }

    if (!completedTaskIds.has(dependencyId) && !TERMINAL_SUCCESS_STATUSES.has(dependencyStatus)) {
      throw new TaskGraphValidationError(
        `dependencies incomplete for task: ${task.id}`,
        'dependency_incomplete',
      );
    }
  }
}

/**
 * Validates task graph structure and optional runtime dependency state.
 */
export function validateTaskGraph(
  tasks: AutomationTaskGraphNode[],
  context?: ValidateTaskGraphContext,
): void {
  validateStructuralGraph(tasks);

  if (context) {
    validateRuntimeDependencies(tasks, context);
  }
}
