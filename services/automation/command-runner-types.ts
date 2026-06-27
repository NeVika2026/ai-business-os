export const SUPPORTED_COMMANDS = ['npm', 'git', 'node', 'pnpm', 'yarn', 'bun'] as const;

export type SupportedCommand = (typeof SUPPORTED_COMMANDS)[number];

export const DEFAULT_COMMAND_RUNNER_TIMEOUT_MS = 300000;

export interface CommandRunResult {
  command: string;
  args: string[];
  cwd: string | null;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  success: boolean;
  timedOut: boolean;
}

export interface CommandRunnerSnapshot {
  instanceId: string;
  defaultCwd: string | null;
  timeoutMs: number;
  lastCommand: string | null;
  lastArgs: string[];
  lastCwd: string | null;
  lastExitCode: number | null;
  lastDurationMs: number | null;
  lastSuccess: boolean | null;
  runCount: number;
  updatedAt: string;
}

export interface CommandRunnerOptions {
  instanceId?: string;
  cwd?: string;
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
}

export interface SerializedCommandRunResult {
  command: string;
  args: string[];
  cwd: string | null;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  success: boolean;
  timedOut: boolean;
}

export interface SerializedCommandRunnerSnapshot {
  instanceId: string;
  defaultCwd: string | null;
  timeoutMs: number;
  lastCommand: string | null;
  lastArgs: string[];
  lastCwd: string | null;
  lastExitCode: number | null;
  lastDurationMs: number | null;
  lastSuccess: boolean | null;
  runCount: number;
  updatedAt: string;
  lastResult: SerializedCommandRunResult | null;
}
