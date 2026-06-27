import type { ISODateTime } from '@/types/runtime/dto';

export const LOCAL_AGENT_BACKENDS = [
  'mock',
  'generic-cli',
  'cursor',
  'claude-code',
  'codex',
] as const;

export type LocalAgentBackendKind = (typeof LOCAL_AGENT_BACKENDS)[number];

export const DEFAULT_LOCAL_AGENT_RUNNER_TIMEOUT_MS = 300000;

export type LocalAgentRunnerState = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';

export type LocalAgentMetadataValue = string | number | boolean | null;

export interface LocalAgentExecutionPackage {
  taskId: string;
  title: string;
  prompt: string;
  workingDirectory: string;
  allowedPaths: string[];
  forbiddenPaths: string[];
  metadata: Record<string, LocalAgentMetadataValue>;
}

export interface LocalAgentExecutionResult {
  success: boolean;
  backend: LocalAgentBackendKind;
  durationMs: number;
  stdout: string;
  stderr: string;
  exitCode: number;
  filesChanged: string[];
  warnings: string[];
  errors: string[];
  report: string | null;
}

export interface LocalAgentCommandRunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  timedOut: boolean;
}

export interface LocalAgentRunnerOptions {
  instanceId?: string;
  backend?: LocalAgentBackendKind;
  timeoutMs?: number;
  workingDirectory?: string;
  genericCliExecutable?: string;
  genericCliArgs?: string[];
  env?: NodeJS.ProcessEnv;
  runCommand?: (
    executable: string,
    args: string[],
    cwd: string,
    timeoutMs: number,
    env: NodeJS.ProcessEnv,
  ) => LocalAgentCommandRunResult;
}

export interface LocalAgentRunnerStatusView {
  state: LocalAgentRunnerState;
  backend: LocalAgentBackendKind;
  currentTaskId: string | null;
  lastSuccess: boolean | null;
  updatedAt: ISODateTime;
}

export interface LocalAgentRunnerSnapshot {
  instanceId: string;
  backend: LocalAgentBackendKind;
  state: LocalAgentRunnerState;
  timeoutMs: number;
  defaultWorkingDirectory: string | null;
  executionCount: number;
  lastTaskId: string | null;
  lastSuccess: boolean | null;
  updatedAt: ISODateTime;
}

export interface LocalAgentRunnerContract {
  execute(pkg: LocalAgentExecutionPackage): LocalAgentExecutionResult;
  validate(pkg: LocalAgentExecutionPackage): void;
  status(): LocalAgentRunnerStatusView;
  cancel(): void;
  availableBackends(): LocalAgentBackendKind[];
  serialize(): SerializedLocalAgentRunnerSnapshot;
  reset(): void;
}

export interface SerializedLocalAgentExecutionResult {
  success: boolean;
  backend: LocalAgentBackendKind;
  durationMs: number;
  stdout: string;
  stderr: string;
  exitCode: number;
  filesChanged: string[];
  warnings: string[];
  errors: string[];
  report: string | null;
}

export interface SerializedLocalAgentRunnerStatusView {
  state: LocalAgentRunnerState;
  backend: LocalAgentBackendKind;
  currentTaskId: string | null;
  lastSuccess: boolean | null;
  updatedAt: ISODateTime;
}

export interface SerializedLocalAgentRunnerSnapshot {
  instanceId: string;
  backend: LocalAgentBackendKind;
  state: LocalAgentRunnerState;
  timeoutMs: number;
  defaultWorkingDirectory: string | null;
  executionCount: number;
  lastTaskId: string | null;
  lastSuccess: boolean | null;
  updatedAt: ISODateTime;
  lastResult: SerializedLocalAgentExecutionResult | null;
  status: SerializedLocalAgentRunnerStatusView;
}
