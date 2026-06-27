import { spawnSync } from 'node:child_process';
import { accessSync, constants, statSync } from 'node:fs';
import path from 'node:path';

import { CommandRunnerValidationError } from '@/services/automation/command-runner-errors';
import { serializeCommandRunnerSnapshot } from '@/services/automation/command-runner-serializer';
import type {
  CommandRunResult,
  CommandRunnerOptions,
  CommandRunnerSnapshot,
  SerializedCommandRunnerSnapshot,
  SupportedCommand,
} from '@/services/automation/command-runner-types';
import {
  DEFAULT_COMMAND_RUNNER_TIMEOUT_MS,
  SUPPORTED_COMMANDS,
} from '@/services/automation/command-runner-types';

const SUPPORTED_COMMAND_SET = new Set<string>(SUPPORTED_COMMANDS);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeCommand(command: string): SupportedCommand {
  const normalized = command.trim();

  if (!isNonEmptyString(normalized)) {
    throw new CommandRunnerValidationError('command is required');
  }

  if (!SUPPORTED_COMMAND_SET.has(normalized)) {
    throw new CommandRunnerValidationError(`unsupported command: ${normalized}`);
  }

  return normalized as SupportedCommand;
}

function resolveCwd(cwd: string | undefined, fallback: string | null): string | null {
  const candidate = cwd ?? fallback;

  if (candidate === null || candidate === undefined) {
    return null;
  }

  if (!isNonEmptyString(candidate)) {
    throw new CommandRunnerValidationError('cwd must be a non-empty path');
  }

  const resolved = path.resolve(candidate);

  try {
    const stats = statSync(resolved);
    if (!stats.isDirectory()) {
      throw new CommandRunnerValidationError(`invalid cwd: ${candidate}`);
    }

    accessSync(resolved, constants.R_OK);
    return resolved;
  } catch (error) {
    if (error instanceof CommandRunnerValidationError) {
      throw error;
    }

    throw new CommandRunnerValidationError(`invalid cwd: ${candidate}`);
  }
}

function getSpawnErrorCode(error: Error | undefined): string | null {
  if (!error || !('code' in error)) {
    return null;
  }

  const code = (error as NodeJS.ErrnoException).code;
  return typeof code === 'string' ? code : null;
}

function createFailureResult(
  command: string,
  args: string[],
  cwd: string | null,
  stderr: string,
  exitCode: number,
  durationMs: number,
  timedOut: boolean,
): CommandRunResult {
  return {
    command,
    args: [...args],
    cwd,
    exitCode,
    stdout: '',
    stderr,
    durationMs,
    success: false,
    timedOut,
  };
}

/**
 * Local synchronous command runner using Node child_process.
 */
export class CommandRunner {
  private lastResult: CommandRunResult | null = null;
  private snapshot: CommandRunnerSnapshot;

  constructor(
    private readonly instanceId: string,
    private defaultCwd: string | null,
    private readonly timeoutMs: number,
    private readonly env: NodeJS.ProcessEnv,
  ) {
    this.snapshot = this.createEmptySnapshot();
  }

  run(command: string, args: string[] = [], cwd?: string): CommandRunResult {
    const normalizedCommand = normalizeCommand(command);
    const normalizedArgs = Array.isArray(args) ? args.map(String) : [];
    const resolvedCwd = resolveCwd(cwd, this.defaultCwd);
    const startedAt = Date.now();

    if (!this.exists(normalizedCommand)) {
      const result = createFailureResult(
        normalizedCommand,
        normalizedArgs,
        resolvedCwd,
        `command not found: ${normalizedCommand}`,
        127,
        0,
        false,
      );
      this.storeResult(result);
      return result;
    }

    const spawnResult = spawnSync(normalizedCommand, normalizedArgs, {
      cwd: resolvedCwd ?? undefined,
      env: this.env,
      encoding: 'utf8',
      timeout: this.timeoutMs,
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
      const result = createFailureResult(
        normalizedCommand,
        normalizedArgs,
        resolvedCwd,
        `command not found: ${normalizedCommand}`,
        127,
        durationMs,
        false,
      );
      this.storeResult(result);
      return result;
    }

    const exitCode =
      typeof spawnResult.status === 'number'
        ? spawnResult.status
        : timedOut
          ? 124
          : spawnResult.error
            ? 1
            : 0;

    const result: CommandRunResult = {
      command: normalizedCommand,
      args: normalizedArgs,
      cwd: resolvedCwd,
      exitCode,
      stdout,
      stderr,
      durationMs,
      success: exitCode === 0 && !timedOut && !spawnResult.error,
      timedOut,
    };

    this.storeResult(result);
    return result;
  }

  exists(command: string): boolean {
    let normalized: SupportedCommand;

    try {
      normalized = normalizeCommand(command);
    } catch {
      return false;
    }

    const probe = spawnSync(normalized, ['--version'], {
      env: this.env,
      encoding: 'utf8',
      timeout: 5000,
      shell: false,
    });

    if (getSpawnErrorCode(probe.error) === 'ENOENT') {
      return false;
    }

    return probe.status === 0 || probe.stdout.length > 0 || probe.stderr.length > 0;
  }

  version(command: string): string | null {
    if (!this.exists(command)) {
      return null;
    }

    const normalized = normalizeCommand(command);
    const probe = spawnSync(normalized, ['--version'], {
      env: this.env,
      encoding: 'utf8',
      timeout: 5000,
      shell: false,
    });

    const output = `${probe.stdout ?? ''}${probe.stderr ?? ''}`.trim();
    return output.length > 0 ? (output.split('\n')[0] ?? output) : null;
  }

  serialize(): SerializedCommandRunnerSnapshot {
    return serializeCommandRunnerSnapshot({
      snapshot: this.snapshot,
      lastResult: this.lastResult,
    });
  }

  reset(): void {
    this.lastResult = null;
    this.snapshot = this.createEmptySnapshot();
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  getLastResult(): CommandRunResult | null {
    return this.lastResult;
  }

  private storeResult(result: CommandRunResult): void {
    this.lastResult = result;
    this.snapshot = {
      ...this.snapshot,
      lastCommand: result.command,
      lastArgs: [...result.args],
      lastCwd: result.cwd,
      lastExitCode: result.exitCode,
      lastDurationMs: result.durationMs,
      lastSuccess: result.success,
      runCount: this.snapshot.runCount + 1,
      updatedAt: nowIso(),
    };
  }

  private createEmptySnapshot(): CommandRunnerSnapshot {
    return {
      instanceId: this.instanceId,
      defaultCwd: this.defaultCwd,
      timeoutMs: this.timeoutMs,
      lastCommand: null,
      lastArgs: [],
      lastCwd: null,
      lastExitCode: null,
      lastDurationMs: null,
      lastSuccess: null,
      runCount: 0,
      updatedAt: nowIso(),
    };
  }
}

export function createCommandRunner(options?: CommandRunnerOptions): CommandRunner {
  const instanceId = options?.instanceId?.trim() || 'default-command-runner';
  const defaultCwd = options?.cwd ? resolveCwd(options.cwd, null) : null;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_COMMAND_RUNNER_TIMEOUT_MS;
  const env = options?.env ? { ...process.env, ...options.env } : { ...process.env };

  return new CommandRunner(instanceId, defaultCwd, timeoutMs, env);
}

/** Default dev/test singleton. Local synchronous command runner. */
export const commandRunner = createCommandRunner();
