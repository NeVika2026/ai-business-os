import path from 'node:path';

import {
  createAITaskExecutorAdapter,
  type AITaskExecutorAdapter,
} from '@/services/automation/ai-task-executor-adapter';
import { createRealTaskHandler } from '@/services/automation/real-task-handler';
import { RoadmapTaskExecutorValidationError } from '@/services/automation/roadmap-task-executor-errors';
import { serializeRoadmapTaskExecutorSnapshot } from '@/services/automation/roadmap-task-executor-serializer';
import type {
  RoadmapTaskExecutionHandler,
  RoadmapTaskExecutionReport,
  RoadmapTaskExecutorOptions,
  RoadmapTaskExecutorReport,
  RoadmapTaskExecutorResult,
  RoadmapTaskExecutorSnapshot,
  RoadmapTaskInput,
  SerializedRoadmapTaskExecutorSnapshot,
} from '@/services/automation/roadmap-task-executor-types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeDependencies(dependencies: string[] | undefined): string[] {
  if (!Array.isArray(dependencies)) {
    return [];
  }

  return dependencies.map((dependency) => String(dependency).trim()).filter(Boolean);
}

function normalizeMetadata(
  metadata: Record<string, string | number | boolean | null> | undefined,
): Record<string, string | number | boolean | null> {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  return { ...metadata };
}

function isTestRuntime(): boolean {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.AUTOMATION_TEST_ROOT_REQUIRED === '1' ||
    process.argv.includes('--test') ||
    process.argv.some((arg) => arg.includes('.test.ts'))
  );
}

export function assertSafeHandlerRootDir(rootDir?: string): void {
  if (!isTestRuntime() || !isNonEmptyString(rootDir)) {
    return;
  }

  const resolved = path.resolve(rootDir);
  const projectRoot = path.resolve(process.cwd());
  const automationDir = path.resolve(projectRoot, 'services/automation');

  if (resolved === automationDir) {
    throw new RoadmapTaskExecutorValidationError(
      'rootDir must not be services/automation during tests',
    );
  }

  if (resolved === projectRoot) {
    throw new RoadmapTaskExecutorValidationError(
      'rootDir must not be the project root during tests',
    );
  }
}

export function createSafeRealTaskRoadmapHandler(rootDir?: string): RoadmapTaskExecutionHandler {
  if (isTestRuntime()) {
    if (!isNonEmptyString(rootDir)) {
      return {
        execute() {
          throw new RoadmapTaskExecutorValidationError(
            'rootDir is required when using the default file handler in tests',
          );
        },
      };
    }

    assertSafeHandlerRootDir(rootDir);
  }

  return createRealTaskHandler({ rootDir }).toRoadmapHandler();
}

function createDefaultHandler(options?: {
  adapter?: AITaskExecutorAdapter;
  rootDir?: string;
}): RoadmapTaskExecutionHandler {
  if (isTestRuntime() && !isNonEmptyString(options?.rootDir) && !options?.adapter) {
    return {
      execute() {
        throw new RoadmapTaskExecutorValidationError(
          'rootDir is required when using the default file handler in tests',
        );
      },
    };
  }

  const adapter = options?.adapter ?? createAITaskExecutorAdapter();
  return adapter.toRoadmapHandler();
}

function createFailureResult(
  task: RoadmapTaskInput,
  startedAt: string,
  finishedAt: string,
  durationMs: number,
  errors: string[],
  warnings: string[] = [],
): RoadmapTaskExecutorResult {
  const report: RoadmapTaskExecutionReport = {
    taskId: task.id,
    title: task.title,
    status: 'failed',
    startedAt,
    finishedAt,
    durationMs,
    filesChanged: [],
    warnings: [...warnings],
    errors: [...errors],
  };

  return {
    success: false,
    durationMs,
    filesChanged: [],
    warnings: [...warnings],
    errors: [...errors],
    report,
  };
}

function detectCycle(tasks: RoadmapTaskInput[]): string | null {
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

/**
 * Executes one roadmap task at a time through an injected handler.
 */
export class RoadmapTaskExecutor {
  private registeredTasks: RoadmapTaskInput[] = [];
  private completedTaskIds = new Set<string>();
  private executedTaskIds = new Set<string>();
  private reports: RoadmapTaskExecutionReport[] = [];
  private lastResult: RoadmapTaskExecutorResult | null = null;
  private graphValidated = false;
  private snapshot: RoadmapTaskExecutorSnapshot;

  constructor(
    private readonly instanceId: string,
    private handler: RoadmapTaskExecutionHandler,
    tasks: RoadmapTaskInput[] | undefined,
  ) {
    if (tasks) {
      this.registerTasks(tasks);
    }

    this.snapshot = this.createEmptySnapshot();
  }

  validate(task: RoadmapTaskInput): void {
    this.assertTaskFields(task);

    if (this.registeredTasks.length > 0) {
      this.validateRegisteredGraph();
      this.assertTaskRegistered(task.id);
      this.assertDependenciesExist(task);
    }
  }

  canExecute(task: RoadmapTaskInput): boolean {
    try {
      this.validate(task);
    } catch {
      return false;
    }

    if (this.executedTaskIds.has(task.id)) {
      return false;
    }

    if (task.status !== 'pending' && task.status !== 'running') {
      return false;
    }

    return this.areDependenciesComplete(task);
  }

  execute(task: RoadmapTaskInput): RoadmapTaskExecutorResult {
    const startedAt = nowIso();
    const startMs = Date.now();

    if (!this.canExecute(task)) {
      const errors: string[] = [];

      if (this.executedTaskIds.has(task.id)) {
        errors.push(`task already executed: ${task.id}`);
      } else if (!this.areDependenciesComplete(task)) {
        errors.push(`dependencies incomplete for task: ${task.id}`);
      } else if (task.status !== 'pending' && task.status !== 'running') {
        errors.push(`task is not executable in status: ${task.status}`);
      } else {
        errors.push(`task cannot be executed: ${task.id}`);
      }

      const finishedAt = nowIso();
      const result = createFailureResult(task, startedAt, finishedAt, Date.now() - startMs, errors);
      this.storeResult(result);
      return result;
    }

    this.executedTaskIds.add(task.id);

    const handlerResult = this.handler.execute(task);
    const finishedAt = nowIso();
    const durationMs = Date.now() - startMs;
    const success = handlerResult.success;
    const report: RoadmapTaskExecutionReport = {
      taskId: task.id,
      title: task.title,
      status: success ? 'completed' : 'failed',
      startedAt,
      finishedAt,
      durationMs,
      filesChanged: [...handlerResult.filesChanged],
      warnings: [...handlerResult.warnings],
      errors: [...handlerResult.errors],
    };

    if (success) {
      this.completedTaskIds.add(task.id);
    }

    this.reports.push(report);

    const result: RoadmapTaskExecutorResult = {
      success,
      durationMs,
      filesChanged: [...handlerResult.filesChanged],
      warnings: [...handlerResult.warnings],
      errors: [...handlerResult.errors],
      report,
    };

    this.storeResult(result);
    return result;
  }

  report(): RoadmapTaskExecutorReport {
    return {
      instanceId: this.instanceId,
      registeredTaskCount: this.registeredTasks.length,
      executedTaskCount: this.executedTaskIds.size,
      completedTaskCount: this.completedTaskIds.size,
      failedTaskCount: this.reports.filter((entry) => entry.status === 'failed').length,
      reports: [...this.reports],
    };
  }

  serialize(): SerializedRoadmapTaskExecutorSnapshot {
    return serializeRoadmapTaskExecutorSnapshot({
      snapshot: this.snapshot,
      lastResult: this.lastResult,
      report: this.report(),
    });
  }

  reset(): void {
    this.completedTaskIds.clear();
    this.executedTaskIds.clear();
    this.reports = [];
    this.lastResult = null;
    this.graphValidated = false;
    this.snapshot = this.createEmptySnapshot();
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  getLastResult(): RoadmapTaskExecutorResult | null {
    return this.lastResult;
  }

  private registerTasks(tasks: RoadmapTaskInput[]): void {
    const normalizedTasks = tasks.map((task) => this.normalizeTask(task));
    this.registeredTasks = normalizedTasks;
    this.graphValidated = false;
    this.validateRegisteredGraph();
  }

  private normalizeTask(task: RoadmapTaskInput): RoadmapTaskInput {
    this.assertTaskFields(task);

    return {
      id: task.id.trim(),
      title: task.title.trim(),
      description: isNonEmptyString(task.description) ? task.description.trim() : null,
      dependencies: normalizeDependencies(task.dependencies),
      status: task.status,
      metadata: normalizeMetadata(task.metadata),
    };
  }

  private assertTaskFields(task: RoadmapTaskInput): void {
    if (!task || typeof task !== 'object') {
      throw new RoadmapTaskExecutorValidationError('task must be an object');
    }

    if (!isNonEmptyString(task.id)) {
      throw new RoadmapTaskExecutorValidationError('task id is required');
    }

    if (!isNonEmptyString(task.title)) {
      throw new RoadmapTaskExecutorValidationError('task title is required');
    }

    if (!Array.isArray(task.dependencies)) {
      throw new RoadmapTaskExecutorValidationError('task dependencies must be an array');
    }

    if (!task.status) {
      throw new RoadmapTaskExecutorValidationError('task status is required');
    }
  }

  private validateRegisteredGraph(): void {
    if (this.graphValidated) {
      return;
    }

    const ids = this.registeredTasks.map((task) => task.id);
    const seen = new Set<string>();

    for (const id of ids) {
      if (seen.has(id)) {
        throw new RoadmapTaskExecutorValidationError(`duplicate task id: ${id}`);
      }

      seen.add(id);
    }

    for (const task of this.registeredTasks) {
      for (const dependencyId of task.dependencies) {
        if (!seen.has(dependencyId)) {
          throw new RoadmapTaskExecutorValidationError(
            `missing dependency: ${dependencyId} for task ${task.id}`,
          );
        }
      }
    }

    const cycleTaskId = detectCycle(this.registeredTasks);
    if (cycleTaskId) {
      throw new RoadmapTaskExecutorValidationError(`circular dependency detected: ${cycleTaskId}`);
    }

    this.graphValidated = true;
  }

  private assertTaskRegistered(taskId: string): void {
    const exists = this.registeredTasks.some((task) => task.id === taskId);
    if (!exists) {
      throw new RoadmapTaskExecutorValidationError(`task is not registered: ${taskId}`);
    }
  }

  private assertDependenciesExist(task: RoadmapTaskInput): void {
    const registeredIds = new Set(this.registeredTasks.map((entry) => entry.id));

    for (const dependencyId of normalizeDependencies(task.dependencies)) {
      if (!registeredIds.has(dependencyId)) {
        throw new RoadmapTaskExecutorValidationError(
          `missing dependency: ${dependencyId} for task ${task.id}`,
        );
      }
    }
  }

  private areDependenciesComplete(task: RoadmapTaskInput): boolean {
    return normalizeDependencies(task.dependencies).every((dependencyId) =>
      this.completedTaskIds.has(dependencyId),
    );
  }

  private storeResult(result: RoadmapTaskExecutorResult): void {
    this.lastResult = result;
    this.snapshot = {
      instanceId: this.instanceId,
      registeredTaskCount: this.registeredTasks.length,
      executedTaskCount: this.executedTaskIds.size,
      completedTaskCount: this.completedTaskIds.size,
      failedTaskCount: this.reports.filter((entry) => entry.status === 'failed').length,
      lastTaskId: result.report.taskId,
      lastSuccess: result.success,
      updatedAt: nowIso(),
    };
  }

  private createEmptySnapshot(): RoadmapTaskExecutorSnapshot {
    return {
      instanceId: this.instanceId,
      registeredTaskCount: this.registeredTasks.length,
      executedTaskCount: 0,
      completedTaskCount: 0,
      failedTaskCount: 0,
      lastTaskId: null,
      lastSuccess: null,
      updatedAt: nowIso(),
    };
  }
}

export function createRoadmapTaskExecutor(
  options?: RoadmapTaskExecutorOptions,
): RoadmapTaskExecutor {
  const instanceId = options?.instanceId?.trim() || 'default-roadmap-task-executor';

  return new RoadmapTaskExecutor(
    instanceId,
    options?.handler ??
      createDefaultHandler({
        adapter: options?.adapter,
        rootDir: options?.rootDir,
      }),
    options?.tasks,
  );
}

/** Default dev/test singleton. Roadmap task executor. */
export const roadmapTaskExecutor = createRoadmapTaskExecutor();
