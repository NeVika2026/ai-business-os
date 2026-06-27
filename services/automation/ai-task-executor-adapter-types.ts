import type { ISODateTime } from '@/types/runtime/dto';

import type {
  LocalAgentRunnerContract,
  LocalAgentRunnerOptions,
} from '@/services/automation/local-agent-runner-types';

export type AITaskExecutorState = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';

export type AITaskExecutorResultStatus = 'completed' | 'failed' | 'cancelled' | 'prepared';

export type AITaskExecutorBackendKind = 'mock' | 'cursor' | 'local-agent';

export type AITaskExecutorMetadataValue = string | number | boolean | null;

export interface AITaskExecutorTask {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  files: string[];
  dependencies: string[];
  status: AITaskExecutorState;
  metadata: Record<string, AITaskExecutorMetadataValue>;
}

export interface AITaskExecutorExecutionReport {
  taskId: string;
  title: string;
  status: AITaskExecutorResultStatus;
  startedAt: ISODateTime;
  finishedAt: ISODateTime;
  durationMs: number;
  filesChanged: string[];
  warnings: string[];
  errors: string[];
  summary: string | null;
}

export interface AITaskExecutorResult {
  success: boolean;
  status?: AITaskExecutorResultStatus;
  durationMs: number;
  filesChanged: string[];
  warnings: string[];
  errors: string[];
  report: AITaskExecutorExecutionReport;
  executorName: string;
  executorVersion: string;
  prompt?: string;
  packageSummary?: string;
}

export interface AITaskExecutorBackendResult {
  success: boolean;
  status?: AITaskExecutorResultStatus;
  filesChanged: string[];
  warnings: string[];
  errors: string[];
  report: string | null;
  prompt?: string;
  packageSummary?: string;
}

export interface AITaskExecutorBackend {
  name: string;
  version: string;
  execute(task: AITaskExecutorTask): AITaskExecutorBackendResult;
  cancel?(): void;
}

export interface AITaskExecutorStatusView {
  state: AITaskExecutorState;
  currentTaskId: string | null;
  executorName: string;
  executorVersion: string;
  lastSuccess: boolean | null;
  updatedAt: ISODateTime;
}

export interface AITaskExecutorReport {
  instanceId: string;
  state: AITaskExecutorState;
  executorName: string;
  executorVersion: string;
  executionCount: number;
  completedCount: number;
  failedCount: number;
  cancelledCount: number;
  lastTaskId: string | null;
  reports: AITaskExecutorExecutionReport[];
}

export interface AITaskExecutorSnapshot {
  instanceId: string;
  state: AITaskExecutorState;
  executorName: string;
  executorVersion: string;
  executionCount: number;
  lastTaskId: string | null;
  lastSuccess: boolean | null;
  updatedAt: ISODateTime;
}

export interface AITaskExecutorAdapterOptions {
  instanceId?: string;
  backend?: AITaskExecutorBackendKind;
  executor?: AITaskExecutorBackend;
  localAgentRunner?: LocalAgentRunnerContract;
  localAgentRunnerOptions?: LocalAgentRunnerOptions;
  workingDirectory?: string;
}

export interface SerializedAITaskExecutorExecutionReport {
  taskId: string;
  title: string;
  status: AITaskExecutorResultStatus;
  startedAt: ISODateTime;
  finishedAt: ISODateTime;
  durationMs: number;
  filesChanged: string[];
  warnings: string[];
  errors: string[];
  summary: string | null;
}

export interface SerializedAITaskExecutorResult {
  success: boolean;
  status?: AITaskExecutorResultStatus;
  durationMs: number;
  filesChanged: string[];
  warnings: string[];
  errors: string[];
  report: SerializedAITaskExecutorExecutionReport;
  executorName: string;
  executorVersion: string;
  prompt?: string;
  packageSummary?: string;
}

export interface SerializedAITaskExecutorStatusView {
  state: AITaskExecutorState;
  currentTaskId: string | null;
  executorName: string;
  executorVersion: string;
  lastSuccess: boolean | null;
  updatedAt: ISODateTime;
}

export interface SerializedAITaskExecutorReport {
  instanceId: string;
  state: AITaskExecutorState;
  executorName: string;
  executorVersion: string;
  executionCount: number;
  completedCount: number;
  failedCount: number;
  cancelledCount: number;
  lastTaskId: string | null;
  reports: SerializedAITaskExecutorExecutionReport[];
}

export interface SerializedAITaskExecutorSnapshot {
  instanceId: string;
  state: AITaskExecutorState;
  executorName: string;
  executorVersion: string;
  executionCount: number;
  lastTaskId: string | null;
  lastSuccess: boolean | null;
  updatedAt: ISODateTime;
  lastResult: SerializedAITaskExecutorResult | null;
  report: SerializedAITaskExecutorReport;
}
