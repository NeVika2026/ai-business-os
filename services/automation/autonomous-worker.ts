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
  AutonomousWorkerExecutorResult,
  SerializedAutonomousWorkerSnapshot,
} from '@/services/automation/autonomous-worker-types';
import {
  createAITaskExecutorAdapter,
  type AITaskExecutorAdapter,
} from '@/services/automation/ai-task-executor-adapter';
import {
  createAutomationPlanner,
  type AutomationPlanner,
} from '@/services/automation/automation-planner';
import type {
  AutomationPlannerInput,
  AutomationPlannerTaskState,
} from '@/services/automation/automation-planner-types';
import { createCommandRunner, type CommandRunner } from '@/services/automation/command-runner';
import type { CommandRunResult } from '@/services/automation/command-runner-types';
import {
  createRoadmapTaskExecutor,
  type RoadmapTaskExecutor,
} from '@/services/automation/roadmap-task-executor';
import type {
  RoadmapTaskExecutionHandler,
  RoadmapTaskExecutorResult,
  RoadmapTaskInput,
  RoadmapTaskStatus,
} from '@/services/automation/roadmap-task-executor-types';
import type { RoadmapInput } from '@/services/runtime/orchestrator/roadmap/roadmap-types';
import { validateRoadmapInput } from '@/services/runtime/orchestrator/roadmap/roadmap-validator';
import {
  getRuntimeCheckpoint,
  recordExecutionStart,
  recordExecutionStatus,
  saveRuntimeCheckpoint,
} from '@/services/runtime/execution/checkpoint-store';
import {
  buildWorkerRunId,
  WORKER_CHECKPOINT_STAGE,
  type WorkerCheckpointPayload,
} from '@/services/runtime/execution/worker-checkpoint';

function toPlannerTaskStatus(status: AutonomousWorkerTaskStatus): AutomationPlannerTaskState {
  if (status === 'skipped') {
    return 'skipped';
  }

  return status;
}

function toPlannerInput(
  roadmap: RoadmapInput,
  tasks: AutonomousWorkerTask[],
): AutomationPlannerInput {
  return {
    roadmapId: roadmap.id,
    roadmapTitle: roadmap.title,
    tasks: tasks.map((task, index) => ({
      id: task.taskId,
      title: task.title,
      description: task.description,
      dependencies: [...task.dependsOn],
      status: toPlannerTaskStatus(task.status),
      priority: 0,
      order: index,
      metadata: {
        sprintId: task.sprintId,
        code: task.code,
        skipLint: task.skipLint,
        skipBuild: task.skipBuild,
        includeTests: task.includeTests,
      },
    })),
  };
}

function toRoadmapTaskStatus(status: AutonomousWorkerTaskStatus): RoadmapTaskStatus {
  if (status === 'skipped') {
    return 'failed';
  }

  return status;
}

function toRoadmapTaskInput(task: AutonomousWorkerTask): RoadmapTaskInput {
  const description = isNonEmptyString(task.description)
    ? task.description.trim()
    : task.title.trim();

  return {
    id: task.taskId,
    title: task.title,
    description,
    dependencies: [...task.dependsOn],
    status: toRoadmapTaskStatus(task.status),
    metadata: {
      sprintId: task.sprintId,
      code: task.code,
      skipLint: task.skipLint,
      skipBuild: task.skipBuild,
      includeTests: task.includeTests,
    },
  };
}

function mapTaskExecutorResult(result: RoadmapTaskExecutorResult): AutonomousWorkerExecutorResult {
  return {
    success: result.success,
    files: [...result.filesChanged],
    errors: [...result.errors],
    warnings: [...result.warnings],
    output: result.report.title,
    durationMs: result.durationMs,
    status: result.report.status,
  };
}

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

function createDefaultTaskHandler(adapter: AITaskExecutorAdapter): RoadmapTaskExecutionHandler {
  return adapter.toRoadmapHandler();
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

function resolveNextRecommendedAction(
  state: AutonomousWorkerState,
  planner: AutomationPlanner | null,
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

  const nextTaskId = planner?.report().nextTaskId ?? null;
  const next = nextTaskId
    ? (tasks.find((task) => task.taskId === nextTaskId) ?? null)
    : findNextPendingTask(tasks);
  if (next) {
    return `Call nextTask() to execute ${next.code}: ${next.title}.`;
  }

  return 'No runnable tasks remain.';
}

function countTasksByStatus(
  tasks: AutonomousWorkerTask[],
  status: AutonomousWorkerTaskStatus,
): number {
  return tasks.filter((task) => task.status === status).length;
}

function buildWorkerReport(input: {
  roadmap: RoadmapInput;
  state: AutonomousWorkerState;
  tasks: AutonomousWorkerTask[];
  planner: AutomationPlanner | null;
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
      input.planner,
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
  private runId: string | null = null;
  private taskExecutor: RoadmapTaskExecutor | null = null;
  private updatedAt = nowIso();

  constructor(
    private readonly instanceId: string,
    private readonly organizationId: string,
    private readonly planner: AutomationPlanner,
    private readonly aiTaskExecutorAdapter: AITaskExecutorAdapter,
    private readonly taskHandler: RoadmapTaskExecutionHandler,
    private readonly commandRunner: AutonomousWorkerCommandRunner,
    private readonly injectedTaskExecutor: RoadmapTaskExecutor | null = null,
    private readonly rootDir: string | null = null,
  ) {}

  start(input: AutonomousWorkerStartInput): AutonomousWorkerStatusView {
    this.validateStartInput(input);
    validateRoadmapInput(input.roadmap);

    const timestamp = nowIso();
    this.roadmap = input.roadmap;
    this.tasks = buildTasksFromRoadmap(input.roadmap);
    this.taskReports = [];
    this.planner.reset();
    this.planner.plan(toPlannerInput(input.roadmap, this.tasks));
    this.taskExecutor = this.createTaskExecutorForRoadmap();
    this.state = 'running';
    this.currentTaskId = null;
    this.pauseReason = null;
    this.stopReason = null;
    this.startedAt = timestamp;
    this.runId = buildWorkerRunId(this.instanceId, input.roadmap.id);
    recordExecutionStart(this.runId, this.organizationId);
    this.persistCheckpoint();
    this.updatedAt = timestamp;

    return this.status();
  }

  interrupt(reason?: string): AutonomousWorkerStatusView {
    this.requireStarted();

    if (this.state === 'running') {
      this.state = 'paused';
      this.pauseReason = isNonEmptyString(reason) ? reason.trim() : 'interrupted';
      this.persistCheckpoint();
      this.updatedAt = nowIso();
    }

    return this.status();
  }

  resumeFromCheckpoint(runId: string): AutonomousWorkerStatusView {
    const checkpoint = getRuntimeCheckpoint(runId, WORKER_CHECKPOINT_STAGE);
    if (!checkpoint) {
      throw new AutonomousWorkerValidationError(`checkpoint not found: ${runId}`);
    }

    const payload = checkpoint.payload as unknown as WorkerCheckpointPayload;
    validateRoadmapInput(payload.roadmap);

    this.runId = runId;
    this.roadmap = payload.roadmap;
    this.tasks = payload.tasks.map((task) => ({ ...task, dependsOn: [...task.dependsOn] }));
    this.taskReports = payload.taskReports.map((report) => ({
      ...report,
      files: [...report.files],
      errors: [...report.errors],
      warnings: [...report.warnings],
    }));
    this.state = payload.state === 'failed' ? 'paused' : payload.state;
    this.currentTaskId = payload.currentTaskId;
    this.pauseReason = payload.pauseReason;
    this.stopReason = payload.stopReason;
    this.startedAt = payload.startedAt;
    this.planner.reset();
    this.planner.plan(toPlannerInput(payload.roadmap, this.tasks));
    this.taskExecutor = this.createTaskExecutorForRoadmap();
    this.updatedAt = nowIso();

    if (this.state === 'paused') {
      this.state = 'running';
      this.pauseReason = null;
    }

    recordExecutionStart(runId, payload.organizationId);
    this.persistCheckpoint();

    return this.status();
  }

  getRunId(): string | null {
    return this.runId;
  }

  stop(reason?: string): AutonomousWorkerStatusView {
    this.requireStarted();

    this.state = 'stopped';
    this.stopReason = isNonEmptyString(reason) ? reason.trim() : 'stopped_by_user';
    this.pauseReason = null;
    this.currentTaskId = null;
    if (this.runId) {
      this.persistCheckpoint();
      recordExecutionStatus(this.runId, 'cancelled');
    }
    this.updatedAt = nowIso();

    return this.status();
  }

  pause(reason?: string): AutonomousWorkerStatusView {
    this.requireMutableWorker();

    this.state = 'paused';
    this.pauseReason = isNonEmptyString(reason) ? reason.trim() : 'paused_by_user';
    this.persistCheckpoint();
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
    this.persistCheckpoint();
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
    const nextPlannerTask = this.planner.next();

    if (!nextPlannerTask) {
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

    const nextTask = this.tasks.find((task) => task.taskId === nextPlannerTask.id);
    if (!nextTask) {
      throw new AutonomousWorkerTaskNotFoundError(nextPlannerTask.id);
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

    const taskExecutor = this.requireTaskExecutor();
    const executorResult = mapTaskExecutorResult(
      taskExecutor.execute(toRoadmapTaskInput(nextTask)),
    );
    const isPrepared = executorResult.status === 'prepared';
    const errors = [...executorResult.errors];
    const warnings = [...executorResult.warnings];
    let lintResult: AutonomousWorkerCommandResult | null = null;
    let buildResult: AutonomousWorkerCommandResult | null = null;
    let testsResult: AutonomousWorkerCommandResult | null = null;

    if (executorResult.success && !isPrepared) {
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
    const success = isPrepared ? false : executorResult.success && commandSuccess;
    const finishedAt = nowIso();
    const durationMs =
      executorResult.durationMs +
      (lintResult?.durationMs ?? 0) +
      (buildResult?.durationMs ?? 0) +
      (testsResult?.durationMs ?? 0);

    if (isPrepared) {
      nextTask.status = 'running';
    } else {
      nextTask.status = success ? 'completed' : 'failed';
      nextTask.finishedAt = finishedAt;
      nextTask.durationMs = durationMs;
      this.planner.syncTaskStatus(nextTask.taskId, success ? 'completed' : 'failed');
    }

    const taskReport: AutonomousWorkerTaskReport = {
      taskId: nextTask.taskId,
      sprintId: nextTask.sprintId,
      code: nextTask.code,
      title: nextTask.title,
      status: isPrepared ? 'prepared' : success ? 'completed' : 'failed',
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
    this.currentTaskId = isPrepared ? nextTask.taskId : null;
    this.updatedAt = finishedAt;

    if (isPrepared) {
      this.state = 'paused';
      this.pauseReason = 'waiting_for_external_executor';
    } else if (!success) {
      this.state = 'failed';
      this.stopReason = errors[0] ?? 'task_execution_failed';
    } else if (this.tasks.every((task) => task.status === 'completed')) {
      this.state = 'completed';
      this.stopReason = null;
    } else {
      this.state = 'running';
    }

    this.persistCheckpoint();
    if (this.runId && this.state === 'completed') {
      recordExecutionStatus(this.runId, 'completed');
    } else if (this.runId && this.state === 'failed') {
      recordExecutionStatus(this.runId, 'failed');
    }

    return {
      executed: true,
      taskId: nextTask.taskId,
      taskStatus: nextTask.status,
      workerState: this.state,
      stopped: this.state !== 'running',
      reason: isPrepared ? this.pauseReason : success ? null : this.stopReason,
      report: taskReport,
    };
  }

  report(): AutonomousWorkerReport {
    const roadmap = this.requireRoadmap();

    return buildWorkerReport({
      roadmap,
      state: this.state,
      tasks: this.tasks,
      planner: this.planner,
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
    this.taskExecutor = null;
    this.planner.reset();
    this.state = 'idle';
    this.currentTaskId = null;
    this.pauseReason = null;
    this.stopReason = null;
    this.startedAt = null;
    this.runId = null;
    this.updatedAt = nowIso();
  }

  private persistCheckpoint(): void {
    if (!this.runId || !this.roadmap) {
      return;
    }

    const payload: WorkerCheckpointPayload = {
      instanceId: this.instanceId,
      organizationId: this.organizationId,
      roadmap: this.roadmap,
      tasks: this.tasks.map((task) => ({ ...task, dependsOn: [...task.dependsOn] })),
      taskReports: this.taskReports.map((report) => ({
        ...report,
        files: [...report.files],
        errors: [...report.errors],
        warnings: [...report.warnings],
      })),
      state: this.state,
      currentTaskId: this.currentTaskId,
      pauseReason: this.pauseReason,
      stopReason: this.stopReason,
      startedAt: this.startedAt,
      plannerSnapshot: this.planner.serialize(),
    };

    saveRuntimeCheckpoint({
      runId: this.runId,
      organizationId: this.organizationId,
      stage: WORKER_CHECKPOINT_STAGE,
      payload: payload as unknown as Record<string, unknown>,
    });
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  private createTaskExecutorForRoadmap(): RoadmapTaskExecutor {
    const tasks = this.tasks.map(toRoadmapTaskInput);
    const rootDir = this.rootDir ?? undefined;

    if (this.injectedTaskExecutor) {
      this.injectedTaskExecutor.reset();
      return createRoadmapTaskExecutor({
        instanceId: this.injectedTaskExecutor.getInstanceId(),
        tasks,
        handler: this.taskHandler,
        adapter: this.aiTaskExecutorAdapter,
        rootDir,
      });
    }

    return createRoadmapTaskExecutor({
      instanceId: `${this.instanceId}-task-executor`,
      tasks,
      handler: this.taskHandler,
      adapter: this.aiTaskExecutorAdapter,
      rootDir,
    });
  }

  private requireTaskExecutor(): RoadmapTaskExecutor {
    if (!this.taskExecutor) {
      throw new AutonomousWorkerNotStartedError();
    }

    return this.taskExecutor;
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
  const organizationId = options?.organizationId?.trim() || 'default-org';
  const rootDir = options?.cwd?.trim() || null;
  const runner = options?.commandRunner ?? createCommandRunner({ cwd: rootDir ?? undefined });
  const aiTaskExecutorAdapter =
    options?.aiTaskExecutorAdapter ??
    createAITaskExecutorAdapter({ instanceId: `${instanceId}-ai-adapter` });
  const taskHandler = options?.taskHandler ?? createDefaultTaskHandler(aiTaskExecutorAdapter);

  return new AutonomousWorker(
    instanceId,
    organizationId,
    options?.planner ?? createAutomationPlanner({ instanceId: `${instanceId}-planner` }),
    aiTaskExecutorAdapter,
    taskHandler,
    createWorkerCommandRunner(runner),
    options?.taskExecutor ?? null,
    rootDir,
  );
}

/** Default dev/test singleton. Single-task autonomous worker. */
export const autonomousWorker = createAutonomousWorker();
