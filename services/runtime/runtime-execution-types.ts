import type { RuntimeContextAdapter } from '@/services/runtime/runtime-context-adapter';
import type { RuntimeGatewayAdapter } from '@/services/runtime/runtime-gateway-adapter';
import type { RuntimeMemoryAdapter } from '@/services/runtime/runtime-memory-adapter';
import type { RuntimePipelineAdapter } from '@/services/runtime/runtime-pipeline-adapter';
import type { RuntimePromptAdapter } from '@/services/runtime/runtime-prompt-adapter';
import type { RuntimeToolAdapter } from '@/services/runtime/runtime-tool-adapter';
import type { AgentExecution, AgentResult, TraceContext } from '@/types/runtime/dto';

export interface RuntimeExecutionRequest {
  execution: AgentExecution;
}

export interface RuntimeExecutionAdapters {
  context: RuntimeContextAdapter;
  memory: RuntimeMemoryAdapter;
  prompt: RuntimePromptAdapter;
  pipeline: RuntimePipelineAdapter;
  tool: RuntimeToolAdapter;
  gateway: RuntimeGatewayAdapter;
}

export interface RuntimeExecutionValidationView {
  valid: boolean;
  errors: string[];
}

export interface RuntimeExecutionStageReport {
  stage: string;
  status: 'ok' | 'error' | 'skipped';
  durationMs: number;
}

export interface RuntimeExecutionReport {
  runId: string | null;
  status: AgentResult['status'] | null;
  stageCount: number;
  toolCallCount: number;
  gatewayCallCount: number;
  inputTokens: number;
  outputTokens: number;
  errorCode: string | null;
  errorMessage: string | null;
  errorStage: string | null;
  stages: RuntimeExecutionStageReport[];
  completedAt: string | null;
}

export type RuntimeExecutionOperation = 'run' | 'validate' | null;

export interface RuntimeExecutionSnapshot {
  lastOperation: RuntimeExecutionOperation;
  lastRunId: string | null;
  lastStatus: AgentResult['status'] | null;
  lastEmployeeId: string | null;
  stageCount: number | null;
  updatedAt: string;
}

export interface SerializedRuntimeExecutionSnapshot {
  lastOperation: RuntimeExecutionOperation;
  lastRunId: string | null;
  lastStatus: AgentResult['status'] | null;
  lastEmployeeId: string | null;
  stageCount: number | null;
  updatedAt: string;
}

export interface SerializedRuntimeExecutionReport {
  runId: string | null;
  status: AgentResult['status'] | null;
  stageCount: number;
  toolCallCount: number;
  gatewayCallCount: number;
  inputTokens: number;
  outputTokens: number;
  errorCode: string | null;
  errorMessage: string | null;
  errorStage: string | null;
  stages: RuntimeExecutionStageReport[];
  completedAt: string | null;
}

export interface RuntimeExecutionOptions {
  adapters?: Partial<RuntimeExecutionAdapters>;
}

export type { AgentExecution, AgentResult, TraceContext };
