import {
  AutonomousWorkerInvalidStateError,
  AutonomousWorkerNotStartedError,
  AutonomousWorkerTaskNotFoundError,
  AutonomousWorkerValidationError,
} from '@/services/automation/autonomous-worker-errors';
import { serializeAutonomousWorkerSnapshot } from '@/services/automation/autonomous-worker-serializer';
import type {
  AutonomousWorkerCommandResult,
  AutonomousWorkerCommandRunner,
  AutonomousWorkerExternalExecutor,
  AutonomousWorkerNextTaskResult,
  AutonomousWorkerOptions,
  AutonomousWorkerReport,
  AutonomousWorkerSnapshot,
  AutonomousWorkerStartInput,
  AutonomousWorkerState,
  AutonomousWorkerStatusView,
  AutonomousWorkerTask,
  AutonomousWorkerTaskReport,
  AutonomousWorkerTaskStatus,
  SerializedAutonomousWorkerSnapshot,
} from '@/services/automation/autonomous-worker-types';
import { createCommandRunner, type CommandRunner } from '@/services/automation/command-runner';
import type { CommandRunResult } from '@/services/automation/command-runner-types';
import type { RoadmapInput } from '@/services/runtime/orchestrator/roadmap/roadmap-types';
import { validateRoadmapInput } from '@/services/runtime/orchestrator/roadmap/roadmap-validator';

const EXECUTOR_DURATION_MS = 100;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function nowIso(): string {
  return new Date().toISOString();
}

function mapCommandRunResult(
  displayCommand: string,
  result: CommandRunResult,
): AutonomousWorkerCommandResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!result.success) {
    if (result.timedOut) {
      errors.push(`${displayCommand} timed out`);
    } else if (result.stderr.trim().length > 0) {
      errors.push(result.stderr.trim());
    } else {
      errors.push(`${displayCommand} failed with exit code ${result.exitCode}`);
    }
  }

  const stdout = result.stdout.trim().length > 0 ? result.stdout : null;
  const stderr = result.stderr.trim().length > 0 ? result.stderr : null;

  return {
    success: result.success,
    command: displayCommand,
    args: [...result.args],
    exitCode: result.exitCode,
    stdout,
    stderr,
    errors,
    warnings,
    output: stdout ?? stderr,
    durationMs: result.durationMs,
  };
}

function createWorkerCommandRunner(runner: CommandRunner): AutonomousWorkerCommandRunner {
  return {
    lint() {
      return mapCommandRunResult('npm run lint', runner.run('npm', ['run', 'lint']));
    },
    build() {
      return mapCommandRunResult('npm run build', runner.run('npm', ['run', 'build']));
    },
    test() {
      return mapCommandRunResult('npm test', runner.run('npm', ['test']));
    },
  };
}

function createDefaultExecutor(): AutonomousWorkerExternalExecutor {
  return {
    execute({ task, sprint }) {
      return {
        success: true,
        files: [`services/automation/${task.taskId}.ts`],
        errors: [],
        warnings: [],
        output: `Executed sprint ${sprint.code}: ${sprint.title}`,
        durationMs: EXECUTOR_DURATION_MS,
      };
    },
  };
}

function buildTasksFromRoadmap(roadmap: RoadmapInput): AutonomousWorkerTask[] {
  return roadmap.sprints.map((sprint) => ({
    taskId: sprint.id,
    sprintId: sprint.id,
    code: sprint.code,
    title: sprint.title,
    description: sprint.description?.trim() || null,
    status: 'pending',
    dependsOn: [...(sprint.dependsOn ?? [])],
    skipLint: sprint.skipLint ?? false,
    skipBuild: sprint.skipBuild ?? false,
    includeTests: sprint.includeValidateStep ?? false,
    startedAt: null,
    finishedAt: null,
    durationMs: null,
  }));
}

function findNextPendingTask(tasks: AutonomousWorkerTask[]): AutonomousWorkerTask | null {
  const completedIds = new Set(
    tasks.filter((task) => task.status === 'completed').map((task) => task.taskId),
  );
  const failedIds = new Set(
    tasks.filter((task) => task.status === 'failed').map((task) => task.taskId),
  );

  for (const task of tasks) {
    if (task.status !== 'pending') {
      continue;
    }

    if (failedIds.size > 0) {
      return null;
    }

    const depsMet = task.dependsOn.every((depId) => completedIds.has(depId));
    if (depsMet) {
      return task;
    }
  }

  return null;
}

function countTasksByStatus(
  tasks: AutonomousWorkerTask[],
  status: AutonomousWorkerTaskStatus,
): number {
  return tasks.filter((task) => task.status === status).length;
}

function resolveNextRecommendedAction(
  state: AutonomousWorkerState,
  tasks: AutonomousWorkerTask[],
  pauseReason: string | null,
  stopReason: string | null,
): string {
  if (state === 'paused') {
    return pauseReason ?? 'Worker paused. Call resume() to continue.';
  }

  if (state === 'stopped') {
    return stopReason ?? 'Worker stopped.';
  }

  if (state === 'completed') {
    return 'Roadmap completed. Review task reports.';
  }

  if (state === 'failed') {
    return stopReason ?? 'Worker failed. Review errors and reset before retrying.';
  }

  if (state === 'idle') {
    return 'Call start() with a roadmap to begin.';
  }

  const next = findNextPendingTask(tasks);
  if (next) {
    return `Call nextTask() to execute ${next.code}: ${next.title}.`;
  }

  return 'No runnable tasks remain.';
}

function buildWorkerReport(input: {
  roadmap: RoadmapInput;
  state: AutonomousWorkerState;
  tasks: AutonomousWorkerTask[];
  currentTaskId: string | null;
  pauseReason: string | null;
  stopReason: string | null;
  taskReports: AutonomousWorkerTaskReport[];
}): AutonomousWorkerReport {
  return {
    roadmapId: input.roadmap.id,
    roadmapTitle: input.roadmap.title,
    workerState: input.state,
    completedTaskCount: countTasksByStatus(input.tasks, 'completed'),
    failedTaskCount: countTasksByStatus(input.tasks, 'failed'),
    pendingTaskCount: countTasksByStatus(input.tasks, 'pending'),
    currentTaskId: input.currentTaskId,
    pauseReason: input.pauseReason,
    stopReason: input.stopReason,
    taskReports: [...input.taskReports],
    nextRecommendedAction: resolveNextRecommendedAction(
      input.state,
      input.tasks,
      input.pauseReason,
      input.stopReason,
    ),
  };
}

/**
 * Deterministic single-task autonomous worker for roadmap execution.
 */
export class AutonomousWorker {
  private roadmap: RoadmapInput | null = null;
  private tasks: AutonomousWorkerTask[] = [];
  private taskReports: AutonomousWorkerTaskReport[] = [];
  private state: AutonomousWorkerState = 'idle';
  private currentTaskId: string | null = null;
  private pauseReason: string | null = null;
  private stopReason: string | null = null;
  private startedAt: string | null = null;
  private updatedAt = nowIso();

  constructor(
    private readonly instanceId: string,
    private readonly executor: AutonomousWorkerExternalExecutor,
    private readonly commandRunner: AutonomousWorkerCommandRunner,
  ) {}

  start(input: AutonomousWorkerStartInput): AutonomousWorkerStatusView {
    this.validateStartInput(input);
    validateRoadmapInput(input.roadmap);

    const timestamp = nowIso();
    this.roadmap = input.roadmap;
    this.tasks = buildTasksFromRoadmap(input.roadmap);
    this.taskReports = [];
    this.state = 'running';
    this.currentTaskId = null;
    this.pauseReason = null;
    this.stopReason = null;
    this.startedAt = timestamp;
    this.updatedAt = timestamp;

    return this.status();
  }

  stop(reason?: string): AutonomousWorkerStatusView {
    this.requireStarted();

    this.state = 'stopped';
    this.stopReason = isNonEmptyString(reason) ? reason.trim() : 'stopped_by_user';
    this.pauseReason = null;
    this.currentTaskId = null;
    this.updatedAt = nowIso();

    return this.status();
  }

  pause(reason?: string): AutonomousWorkerStatusView {
    this.requireMutableWorker();

    this.state = 'paused';
    this.pauseReason = isNonEmptyString(reason) ? reason.trim() : 'paused_by_user';
    this.updatedAt = nowIso();

    return this.status();
  }

  resume(): AutonomousWorkerStatusView {
    this.requireStarted();

    if (this.state !== 'paused') {
      throw new AutonomousWorkerInvalidStateError('worker is not paused');
    }

    this.state = 'running';
    this.pauseReason = null;
    this.updatedAt = nowIso();

    return this.status();
  }

  status(): AutonomousWorkerStatusView {
    return {
      state: this.state,
      roadmapId: this.roadmap?.id ?? null,
      roadmapTitle: this.roadmap?.title ?? null,
      currentTaskId: this.currentTaskId,
      completedTaskCount: countTasksByStatus(this.tasks, 'completed'),
      failedTaskCount: countTasksByStatus(this.tasks, 'failed'),
      pendingTaskCount: countTasksByStatus(this.tasks, 'pending'),
      pauseReason: this.pauseReason,
      stopReason: this.stopReason,
      startedAt: this.startedAt,
      updatedAt: this.updatedAt,
    };
  }

  currentTask(): AutonomousWorkerTask | null {
    if (!this.currentTaskId) {
      return null;
    }

    return this.tasks.find((task) => task.taskId === this.currentTaskId) ?? null;
  }

  nextTask(): AutonomousWorkerNextTaskResult {
    this.requireMutableWorker();

    const roadmap = this.requireRoadmap();
    const nextTask = findNextPendingTask(this.tasks);

    if (!nextTask) {
      const allCompleted = this.tasks.every((task) => task.status === 'completed');
      this.state = allCompleted ? 'completed' : 'failed';
      this.stopReason = allCompleted ? null : 'no_runnable_tasks';
      this.currentTaskId = null;
      this.updatedAt = nowIso();

      return {
        executed: false,
        taskId: null,
        taskStatus: null,
        workerState: this.state,
        stopped: true,
        reason: this.stopReason,
        report: null,
      };
    }

    const sprint = roadmap.sprints.find((entry) => entry.id === nextTask.sprintId);
    if (!sprint) {
      throw new AutonomousWorkerTaskNotFoundError(nextTask.taskId);
    }

    const startedAt = nowIso();
    nextTask.status = 'running';
    nextTask.startedAt = startedAt;
    this.currentTaskId = nextTask.taskId;
    this.updatedAt = startedAt;

    const executorResult = this.executor.execute({ task: nextTask, sprint });
    const errors = [...executorResult.errors];
    const warnings = [...executorResult.warnings];
    let lintResult: AutonomousWorkerCommandResult | null = null;
    let buildResult: AutonomousWorkerCommandResult | null = null;
    let testsResult: AutonomousWorkerCommandResult | null = null;

    if (executorResult.success) {
      if (!nextTask.skipLint) {
        lintResult = this.commandRunner.lint();
        errors.push(...lintResult.errors);
        warnings.push(...lintResult.warnings);
      }

      if (!nextTask.skipBuild && (lintResult === null || lintResult.success)) {
        buildResult = this.commandRunner.build();
        errors.push(...buildResult.errors);
        warnings.push(...buildResult.warnings);
      }

      if (
        nextTask.includeTests &&
        (lintResult === null || lintResult.success) &&
        (buildResult === null || buildResult.success)
      ) {
        testsResult = this.commandRunner.test();
        errors.push(...testsResult.errors);
        warnings.push(...testsResult.warnings);
      }
    }

    const commandSuccess =
      (lintResult === null || lintResult.success) &&
      (buildResult === null || buildResult.success) &&
      (testsResult === null || testsResult.success);
    const success = executorResult.success && commandSuccess;
    const finishedAt = nowIso();
    const durationMs =
      executorResult.durationMs +
      (lintResult?.durationMs ?? 0) +
      (buildResult?.durationMs ?? 0) +
      (testsResult?.durationMs ?? 0);

    nextTask.status = success ? 'completed' : 'failed';
    nextTask.finishedAt = finishedAt;
    nextTask.durationMs = durationMs;

    const taskReport: AutonomousWorkerTaskReport = {
      taskId: nextTask.taskId,
      sprintId: nextTask.sprintId,
      code: nextTask.code,
      title: nextTask.title,
      status: success ? 'completed' : 'failed',
      durationMs,
      files: [...executorResult.files],
      errors: [...new Set(errors)],
      warnings: [...new Set(warnings)],
      lint: lintResult,
      build: buildResult,
      tests: testsResult,
      executor: executorResult,
    };

    this.taskReports.push(taskReport);
    this.currentTaskId = null;
    this.updatedAt = finishedAt;

    if (!success) {
      this.state = 'failed';
      this.stopReason = errors[0] ?? 'task_execution_failed';
    } else if (this.tasks.every((task) => task.status === 'completed')) {
      this.state = 'completed';
      this.stopReason = null;
    } else {
      this.state = 'running';
    }

    return {
      executed: true,
      taskId: nextTask.taskId,
      taskStatus: nextTask.status,
      workerState: this.state,
      stopped: this.state !== 'running',
      reason: success ? null : this.stopReason,
      report: taskReport,
    };
  }

  report(): AutonomousWorkerReport {
    const roadmap = this.requireRoadmap();

    return buildWorkerReport({
      roadmap,
      state: this.state,
      tasks: this.tasks,
      currentTaskId: this.currentTaskId,
      pauseReason: this.pauseReason,
      stopReason: this.stopReason,
      taskReports: this.taskReports,
    });
  }

  serialize(): SerializedAutonomousWorkerSnapshot {
    return serializeAutonomousWorkerSnapshot({
      snapshot: this.buildSnapshot(),
      report: this.roadmap ? this.report() : null,
    });
  }

  reset(): void {
    this.roadmap = null;
    this.tasks = [];
    this.taskReports = [];
    this.state = 'idle';
    this.currentTaskId = null;
    this.pauseReason = null;
    this.stopReason = null;
    this.startedAt = null;
    this.updatedAt = nowIso();
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  private validateStartInput(input: AutonomousWorkerStartInput): void {
    if (!input || typeof input !== 'object') {
      throw new AutonomousWorkerValidationError('start input must be an object');
    }

    if (!input.roadmap || typeof input.roadmap !== 'object') {
      throw new AutonomousWorkerValidationError('roadmap is required');
    }
  }

  private requireStarted(): void {
    if (!this.roadmap || this.state === 'idle') {
      throw new AutonomousWorkerNotStartedError();
    }
  }

  private requireMutableWorker(): void {
    this.requireStarted();

    if (this.state === 'completed') {
      throw new AutonomousWorkerInvalidStateError('worker is already completed');
    }

    if (this.state === 'stopped') {
      throw new AutonomousWorkerInvalidStateError('worker is stopped');
    }

    if (this.state === 'failed') {
      throw new AutonomousWorkerInvalidStateError('worker has failed — reset before continuing');
    }

    if (this.state === 'paused') {
      throw new AutonomousWorkerInvalidStateError('worker is paused — call resume() first');
    }
  }

  private requireRoadmap(): RoadmapInput {
    if (!this.roadmap) {
      throw new AutonomousWorkerNotStartedError();
    }

    return this.roadmap;
  }

  private buildSnapshot(): AutonomousWorkerSnapshot {
    return {
      instanceId: this.instanceId,
      state: this.state,
      roadmapId: this.roadmap?.id ?? null,
      roadmapTitle: this.roadmap?.title ?? null,
      currentTaskId: this.currentTaskId,
      completedTaskCount: countTasksByStatus(this.tasks, 'completed'),
      failedTaskCount: countTasksByStatus(this.tasks, 'failed'),
      pendingTaskCount: countTasksByStatus(this.tasks, 'pending'),
      pauseReason: this.pauseReason,
      stopReason: this.stopReason,
      startedAt: this.startedAt,
      updatedAt: this.updatedAt,
    };
  }
}

export function createAutonomousWorker(options?: AutonomousWorkerOptions): AutonomousWorker {
  const instanceId = options?.instanceId?.trim() || 'default-autonomous-worker';
  const runner = options?.commandRunner ?? createCommandRunner({ cwd: options?.cwd });

  return new AutonomousWorker(
    instanceId,
    options?.executor ?? createDefaultExecutor(),
    createWorkerCommandRunner(runner),
  );
}

/** Default dev/test singleton. Single-task autonomous worker. */
export const autonomousWorker = createAutonomousWorker();
