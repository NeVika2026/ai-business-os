import type { AgentResult } from '@/types/runtime/dto';
import type {
  RuntimeExecuteRoadmapInput,
  RuntimeExecuteRoadmapResult,
  RuntimeExecuteSprintInput,
  RuntimeExecuteSprintResult,
  RuntimeOptions,
  RuntimeReport,
  RuntimeStatusView,
  SerializedRuntimeSnapshot,
} from '@/services/runtime/runtime/runtime-types';

export type RuntimeBridgeMode = 'idle' | 'agent' | 'roadmap' | 'sprint';

export interface RuntimeBridgeExecuteAgentOptions {
  useLegacyPipeline?: boolean;
}

export interface RuntimeBridgeStatusView {
  mode: RuntimeBridgeMode;
  agentStatus: AgentResult['status'] | null;
  facadeStatus: RuntimeStatusView;
}

export interface RuntimeBridgeReport {
  mode: RuntimeBridgeMode;
  agentResult: AgentResult | null;
  facadeReport: RuntimeReport;
  nextRecommendedAction: string | null;
}

export interface SerializedAgentResult {
  trace: {
    runId: string;
    correlationId: string;
    traceId: string;
    parentRunId: string | null;
  };
  status: AgentResult['status'];
  output: Record<string, unknown> | null;
  error: {
    code: string;
    message: string;
    stage: string;
  } | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
    toolCallCount: number;
    gatewayCallCount: number;
  };
  timeline: Array<{
    stage: string;
    startedAt: string;
    durationMs: number;
    status: 'ok' | 'error';
  }>;
  completedAt: string;
}

export interface SerializedRuntimeBridgeSnapshot {
  mode: RuntimeBridgeMode;
  agentResult: SerializedAgentResult | null;
  facade: SerializedRuntimeSnapshot;
  updatedAt: string;
}

export interface RuntimeBridgeRecord {
  mode: RuntimeBridgeMode;
  lastAgentResult: AgentResult | null;
  updatedAt: string;
}

export interface RuntimeBridgeProvider {
  save(instanceId: string, record: RuntimeBridgeRecord): void;
  update(instanceId: string, record: RuntimeBridgeRecord): void;
  get(instanceId: string): RuntimeBridgeRecord | null;
  reset?(): void;
}

export type RuntimeBridgeExecuteRoadmapInput = RuntimeExecuteRoadmapInput;
export type RuntimeBridgeExecuteRoadmapResult = RuntimeExecuteRoadmapResult;
export type RuntimeBridgeExecuteSprintInput = RuntimeExecuteSprintInput;
export type RuntimeBridgeExecuteSprintResult = RuntimeExecuteSprintResult;

export interface RuntimeBridgeOptions {
  instanceId?: string;
  facadeOptions?: RuntimeOptions;
  facade?: import('@/services/runtime/runtime/runtime').Runtime;
  legacyExecute?: (execution: import('@/types/runtime/dto').AgentExecution) => Promise<AgentResult>;
  orchestrationOnly?: boolean;
  provider?: RuntimeBridgeProvider;
  gatewayAdapter?: import('@/services/runtime/runtime-gateway-adapter').RuntimeGatewayAdapter;
  toolAdapter?: import('@/services/runtime/runtime-tool-adapter').RuntimeToolAdapter;
  promptAdapter?: import('@/services/runtime/runtime-prompt-adapter').RuntimePromptAdapter;
  memoryAdapter?: import('@/services/runtime/runtime-memory-adapter').RuntimeMemoryAdapter;
  contextAdapter?: import('@/services/runtime/runtime-context-adapter').RuntimeContextAdapter;
  pipelineAdapter?: import('@/services/runtime/runtime-pipeline-adapter').RuntimePipelineAdapter;
}

export const DEFAULT_RUNTIME_BRIDGE_INSTANCE_ID = 'default-bridge';
