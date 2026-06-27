import { spawnSync } from 'node:child_process';
import { accessSync, constants, statSync } from 'node:fs';
import path from 'node:path';

import type {
  AITaskExecutorBackend,
  AITaskExecutorTask,
} from '@/services/automation/ai-task-executor-adapter-types';
import {
  LocalAgentRunnerInvalidStateError,
  LocalAgentRunnerValidationError,
} from '@/services/automation/local-agent-runner-errors';
import { serializeLocalAgentRunnerSnapshot } from '@/services/automation/local-agent-runner-serializer';
import type {
  LocalAgentBackendKind,
  LocalAgentCommandRunResult,
  LocalAgentExecutionPackage,
  LocalAgentExecutionResult,
  LocalAgentRunnerContract,
  LocalAgentRunnerOptions,
  LocalAgentRunnerSnapshot,
  LocalAgentRunnerState,
  LocalAgentRunnerStatusView,
  SerializedLocalAgentRunnerSnapshot,
} from '@/services/automation/local-agent-runner-types';
import {
  DEFAULT_LOCAL_AGENT_RUNNER_TIMEOUT_MS,
  LOCAL_AGENT_BACKENDS,
} from '@/services/automation/local-agent-runner-types';

const SUPPORTED_BACKEND_SET = new Set<string>(LOCAL_AGENT_BACKENDS);
const NOT_INSTALLED_BACKENDS = new Set<LocalAgentBackendKind>(['cursor', 'claude-code', 'codex']);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => String(entry).trim()).filter(Boolean);
}

function getSpawnErrorCode(error: Error | undefined): string | null {
  if (!error || !('code' in error)) {
    return null;
  }

  const code = (error as NodeJS.ErrnoException).code;
  return typeof code === 'string' ? code : null;
}

function resolveWorkingDirectory(candidate: string): string {
  if (!isNonEmptyString(candidate)) {
    throw new LocalAgentRunnerValidationError('working directory is required');
  }

  const resolved = path.resolve(candidate);

  try {
    const stats = statSync(resolved);
    if (!stats.isDirectory()) {
      throw new LocalAgentRunnerValidationError(`invalid working directory: ${candidate}`);
    }

    accessSync(resolved, constants.R_OK);
    return resolved;
  } catch (error) {
    if (error instanceof LocalAgentRunnerValidationError) {
      throw error;
    }

    throw new LocalAgentRunnerValidationError(`invalid working directory: ${candidate}`);
  }
}

function assertSupportedBackend(backend: LocalAgentBackendKind): void {
  if (!SUPPORTED_BACKEND_SET.has(backend)) {
    throw new LocalAgentRunnerValidationError(`unsupported backend: ${backend}`);
  }
}

function buildPromptFromTask(task: AITaskExecutorTask): string {
  const acceptanceLines =
    task.acceptanceCriteria.length > 0
      ? task.acceptanceCriteria.map((criterion) => `- ${criterion}`).join('\n')
      : '- Complete the task as described.';

  return [
    '# Goal',
    '',
    task.title,
    '',
    task.description,
    '',
    '## Acceptance Criteria',
    acceptanceLines,
  ].join('\n');
}

export function fromAITaskExecutorTaskToPackage(
  task: AITaskExecutorTask,
  workingDirectory: string,
): LocalAgentExecutionPackage {
  const metadata = task.metadata ?? {};
  const metadataAllowedPaths = normalizeStringArray(metadata.allowedPaths);
  const metadataForbiddenPaths = normalizeStringArray(metadata.forbiddenPaths);
  const metadataPrompt = isNonEmptyString(metadata.prompt) ? metadata.prompt.trim() : null;

  const allowedPaths =
    task.files.length > 0
      ? [...task.files]
      : metadataAllowedPaths.length > 0
        ? metadataAllowedPaths
        : [`services/automation/${task.id}.ts`];

  return {
    taskId: task.id,
    title: task.title.trim(),
    prompt: metadataPrompt ?? buildPromptFromTask(task),
    workingDirectory: resolveWorkingDirectory(workingDirectory),
    allowedPaths,
    forbiddenPaths: metadataForbiddenPaths,
    metadata: { ...metadata },
  };
}

function createNotInstalledResult(
  backend: LocalAgentBackendKind,
  durationMs: number,
): LocalAgentExecutionResult {
  return {
    success: false,
    backend,
    durationMs,
    stdout: '',
    stderr: '',
    exitCode: 127,
    filesChanged: [],
    warnings: [],
    errors: [`${backend}: not installed`],
    report: null,
  };
}

function defaultRunCommand(
  executable: string,
  args: string[],
  cwd: string,
  timeoutMs: number,
  env: NodeJS.ProcessEnv,
): LocalAgentCommandRunResult {
  const startedAt = Date.now();
  const spawnResult = spawnSync(executable, args, {
    cwd,
    env,
    encoding: 'utf8',
    timeout: timeoutMs,
    maxBuffer: 10 * 1024 * 1024,
    shell: false,
  });

  const durationMs = Date.now() - startedAt;
  const errorCode = getSpawnErrorCode(spawnResult.error);
  const timedOut = errorCode === 'ETIMEDOUT';
  const stdout = typeof spawnResult.stdout === 'string' ? spawnResult.stdout : '';
  const stderr =
    typeof spawnResult.stderr === 'string'
      ? spawnResult.stderr
      : (spawnResult.error?.message ?? '');

  if (errorCode === 'ENOENT') {
    return {
      stdout: '',
      stderr: `command not found: ${executable}`,
      exitCode: 127,
      durationMs,
      timedOut: false,
    };
  }

  const exitCode =
    typeof spawnResult.status === 'number'
      ? spawnResult.status
      : timedOut
        ? 124
        : spawnResult.error
          ? 1
          : 0;

  return {
    stdout,
    stderr,
    exitCode,
    durationMs,
    timedOut,
  };
}

/**
 * Executes AI task packages through pluggable local agent backends.
 */
export class LocalAgentRunner implements LocalAgentRunnerContract {
  private state: LocalAgentRunnerState = 'idle';
  private currentTaskId: string | null = null;
  private cancelled = false;
  private lastResult: LocalAgentExecutionResult | null = null;
  private snapshot: LocalAgentRunnerSnapshot;

  constructor(
    private readonly instanceId: string,
    private readonly backend: LocalAgentBackendKind,
    private readonly timeoutMs: number,
    private defaultWorkingDirectory: string | null,
    private readonly genericCliExecutable: string | null,
    private readonly genericCliArgs: string[],
    private readonly env: NodeJS.ProcessEnv,
    private readonly runCommand: (
      executable: string,
      args: string[],
      cwd: string,
      timeoutMs: number,
      env: NodeJS.ProcessEnv,
    ) => LocalAgentCommandRunResult,
  ) {
    assertSupportedBackend(backend);
    this.snapshot = this.createEmptySnapshot();
  }

  validate(pkg: LocalAgentExecutionPackage): void {
    this.assertPackageFields(pkg);
  }

  execute(pkg: LocalAgentExecutionPackage): LocalAgentExecutionResult {
    this.validate(pkg);

    if (this.state === 'running') {
      throw new LocalAgentRunnerInvalidStateError('runner is already executing');
    }

    const startMs = Date.now();
    this.state = 'running';
    this.currentTaskId = pkg.taskId;
    this.cancelled = false;
    this.updateSnapshot(pkg.taskId, null);

    if (this.cancelled) {
      return this.buildCancelledResult(pkg, startMs);
    }

    const result = this.executeWithBackend(pkg, startMs);

    if (this.cancelled) {
      return this.buildCancelledResult(pkg, startMs);
    }

    this.state = result.success ? 'completed' : 'failed';
    this.currentTaskId = null;
    this.storeResult(pkg.taskId, result);
    return result;
  }

  status(): LocalAgentRunnerStatusView {
    return {
      state: this.state,
      backend: this.backend,
      currentTaskId: this.currentTaskId,
      lastSuccess: this.lastResult?.success ?? null,
      updatedAt: nowIso(),
    };
  }

  cancel(): void {
    if (this.state !== 'running') {
      throw new LocalAgentRunnerInvalidStateError('runner is not executing');
    }

    this.cancelled = true;
    this.state = 'cancelled';
    this.currentTaskId = null;
    this.updateSnapshot(null, false);
  }

  availableBackends(): LocalAgentBackendKind[] {
    return [...LOCAL_AGENT_BACKENDS];
  }

  serialize(): SerializedLocalAgentRunnerSnapshot {
    return serializeLocalAgentRunnerSnapshot({
      snapshot: this.snapshot,
      lastResult: this.lastResult,
      status: this.status(),
    });
  }

  reset(): void {
    this.state = 'idle';
    this.currentTaskId = null;
    this.cancelled = false;
    this.lastResult = null;
    this.snapshot = this.createEmptySnapshot();
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  getBackend(): LocalAgentBackendKind {
    return this.backend;
  }

  private executeWithBackend(
    pkg: LocalAgentExecutionPackage,
    startMs: number,
  ): LocalAgentExecutionResult {
    if (NOT_INSTALLED_BACKENDS.has(this.backend)) {
      return createNotInstalledResult(this.backend, Date.now() - startMs);
    }

    if (this.backend === 'mock') {
      return this.executeMock(pkg, Date.now() - startMs);
    }

    return this.executeGenericCli(pkg, startMs);
  }

  private executeMock(
    pkg: LocalAgentExecutionPackage,
    durationMs: number,
  ): LocalAgentExecutionResult {
    const stdout = `mock executed ${pkg.taskId}`;
    const filesChanged =
      pkg.allowedPaths.length > 0
        ? [...pkg.allowedPaths]
        : [`services/automation/${pkg.taskId}.ts`];

    return {
      success: true,
      backend: 'mock',
      durationMs,
      stdout,
      stderr: '',
      exitCode: 0,
      filesChanged,
      warnings: [],
      errors: [],
      report: `Mock executed ${pkg.title}`,
    };
  }

  private executeGenericCli(
    pkg: LocalAgentExecutionPackage,
    startMs: number,
  ): LocalAgentExecutionResult {
    if (!isNonEmptyString(this.genericCliExecutable)) {
      throw new LocalAgentRunnerValidationError('generic-cli executable is required');
    }

    const args = [...this.genericCliArgs, pkg.prompt];
    const commandResult = this.runCommand(
      this.genericCliExecutable,
      args,
      pkg.workingDirectory,
      this.timeoutMs,
      this.env,
    );
    const durationMs = Date.now() - startMs;
    const success = commandResult.exitCode === 0 && !commandResult.timedOut;
    const errors: string[] = [];

    if (commandResult.timedOut) {
      errors.push('execution timed out');
    } else if (!success) {
      errors.push(commandResult.stderr.trim() || 'generic-cli failed');
    }

    return {
      success,
      backend: 'generic-cli',
      durationMs,
      stdout: commandResult.stdout,
      stderr: commandResult.stderr,
      exitCode: commandResult.exitCode,
      filesChanged: [],
      warnings: [],
      errors,
      report: success ? commandResult.stdout.trim() || null : null,
    };
  }

  private buildCancelledResult(
    pkg: LocalAgentExecutionPackage,
    startMs: number,
  ): LocalAgentExecutionResult {
    const durationMs = Date.now() - startMs;
    const result: LocalAgentExecutionResult = {
      success: false,
      backend: this.backend,
      durationMs,
      stdout: '',
      stderr: '',
      exitCode: 130,
      filesChanged: [],
      warnings: [],
      errors: ['execution cancelled'],
      report: null,
    };

    this.currentTaskId = null;
    this.storeResult(pkg.taskId, result);
    return result;
  }

  private assertPackageFields(pkg: LocalAgentExecutionPackage): void {
    if (!pkg || typeof pkg !== 'object') {
      throw new LocalAgentRunnerValidationError('package must be an object');
    }

    if (!isNonEmptyString(pkg.taskId)) {
      throw new LocalAgentRunnerValidationError('task id is required');
    }

    if (!isNonEmptyString(pkg.prompt)) {
      throw new LocalAgentRunnerValidationError('prompt is required');
    }

    resolveWorkingDirectory(pkg.workingDirectory);
    assertSupportedBackend(this.backend);
  }

  private storeResult(taskId: string, result: LocalAgentExecutionResult): void {
    this.lastResult = result;
    this.snapshot = {
      instanceId: this.instanceId,
      backend: this.backend,
      state: this.state,
      timeoutMs: this.timeoutMs,
      defaultWorkingDirectory: this.defaultWorkingDirectory,
      executionCount: this.snapshot.executionCount + 1,
      lastTaskId: taskId,
      lastSuccess: result.success,
      updatedAt: nowIso(),
    };
  }

  private updateSnapshot(taskId: string | null, lastSuccess: boolean | null): void {
    this.snapshot = {
      instanceId: this.instanceId,
      backend: this.backend,
      state: this.state,
      timeoutMs: this.timeoutMs,
      defaultWorkingDirectory: this.defaultWorkingDirectory,
      executionCount: this.snapshot.executionCount,
      lastTaskId: taskId,
      lastSuccess,
      updatedAt: nowIso(),
    };
  }

  private createEmptySnapshot(): LocalAgentRunnerSnapshot {
    return {
      instanceId: this.instanceId,
      backend: this.backend,
      state: 'idle',
      timeoutMs: this.timeoutMs,
      defaultWorkingDirectory: this.defaultWorkingDirectory,
      executionCount: 0,
      lastTaskId: null,
      lastSuccess: null,
      updatedAt: nowIso(),
    };
  }
}

export function createLocalAgentRunner(
  options?: LocalAgentRunnerOptions,
): LocalAgentRunnerContract {
  const instanceId = options?.instanceId?.trim() || 'default-local-agent-runner';
  const backend = options?.backend ?? 'mock';
  assertSupportedBackend(backend);

  const timeoutMs = options?.timeoutMs ?? DEFAULT_LOCAL_AGENT_RUNNER_TIMEOUT_MS;
  const defaultWorkingDirectory = options?.workingDirectory
    ? resolveWorkingDirectory(options.workingDirectory)
    : null;
  const env = options?.env ? { ...process.env, ...options.env } : { ...process.env };
  const runCommand = options?.runCommand ?? defaultRunCommand;

  return new LocalAgentRunner(
    instanceId,
    backend,
    timeoutMs,
    defaultWorkingDirectory,
    options?.genericCliExecutable?.trim() ?? null,
    Array.isArray(options?.genericCliArgs) ? options.genericCliArgs.map(String) : [],
    env,
    runCommand,
  );
}

export function createLocalAgentBackend(options?: {
  runner?: LocalAgentRunnerContract;
  runnerOptions?: LocalAgentRunnerOptions;
  workingDirectory?: string;
}): AITaskExecutorBackend {
  const runner = options?.runner ?? createLocalAgentRunner(options?.runnerOptions);
  const workingDirectory =
    options?.workingDirectory ?? options?.runnerOptions?.workingDirectory ?? process.cwd();

  return {
    name: 'local-agent',
    version: '1.0.0',
    execute(task: AITaskExecutorTask) {
      const pkg = fromAITaskExecutorTaskToPackage(task, workingDirectory);
      const result = runner.execute(pkg);

      return {
        success: result.success,
        filesChanged: [...result.filesChanged],
        warnings: [...result.warnings],
        errors: [...result.errors],
        report: result.report,
      };
    },
    cancel() {
      runner.cancel();
    },
  };
}

/** Default dev/test singleton. Local agent runner with mock backend. */
export const localAgentRunner = createLocalAgentRunner();
