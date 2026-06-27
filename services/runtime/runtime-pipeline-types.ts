import type { AgentExecution, AgentResult, TraceContext } from '@/types/runtime/dto';

export type RuntimePipelineExecution = AgentExecution;

export interface RuntimePipelineValidationView {
  valid: boolean;
  errors: string[];
}

export interface SerializedRuntimePipelineResult {
  runId: string;
  correlationId: string;
  traceId: string;
  parentRunId: string | null;
  status: AgentResult['status'];
  output: Record<string, unknown> | null;
  errorCode: string | null;
  errorMessage: string | null;
  errorStage: string | null;
  inputTokens: number;
  outputTokens: number;
  toolCallCount: number;
  gatewayCallCount: number;
  timelineStageCount: number;
  completedAt: string;
}

export type RuntimePipelineOperation = 'execute' | 'validate' | null;

export interface RuntimePipelineSnapshot {
  lastOperation: RuntimePipelineOperation;
  lastRunId: string | null;
  lastStatus: AgentResult['status'] | null;
  lastEmployeeId: string | null;
  updatedAt: string;
}

export interface SerializedRuntimePipelineSnapshot {
  lastOperation: RuntimePipelineOperation;
  lastRunId: string | null;
  lastStatus: AgentResult['status'] | null;
  lastEmployeeId: string | null;
  updatedAt: string;
}

export interface RuntimePipelineDependencies {
  runPipeline: (execution: AgentExecution) => Promise<AgentResult>;
  validateAgentExecution: (execution: AgentExecution) => void;
  resolveTrace: (execution: AgentExecution) => TraceContext;
}

export interface RuntimePipelineAdapterOptions {
  dependencies?: Partial<RuntimePipelineDependencies>;
}

export type { AgentExecution, AgentResult, TraceContext };
