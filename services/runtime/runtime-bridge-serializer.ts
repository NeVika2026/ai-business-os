import type { AgentResult } from '@/types/runtime/dto';
import type {
  RuntimeBridgeRecord,
  RuntimeBridgeReport,
  RuntimeBridgeStatusView,
  SerializedAgentResult,
  SerializedRuntimeBridgeSnapshot,
} from '@/services/runtime/runtime-bridge-types';
import type { SerializedRuntimeSnapshot } from '@/services/runtime/runtime/runtime-types';

function nullifyRecord(value: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    result[key] = entry === undefined ? null : entry;
  }

  return result;
}

export function serializeAgentResult(result: AgentResult): SerializedAgentResult {
  return {
    trace: {
      runId: result.trace.runId,
      correlationId: result.trace.correlationId,
      traceId: result.trace.traceId,
      parentRunId: result.trace.parentRunId ?? null,
    },
    status: result.status,
    output: result.output ? nullifyRecord(result.output) : null,
    error: result.error
      ? {
          code: result.error.code,
          message: result.error.message,
          stage: result.error.stage,
        }
      : null,
    usage: {
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      toolCallCount: result.usage.toolCallCount,
      gatewayCallCount: result.usage.gatewayCallCount,
    },
    timeline: result.timeline.map((entry) => ({
      stage: entry.stage,
      startedAt: entry.startedAt,
      durationMs: entry.durationMs,
      status: entry.status,
    })),
    completedAt: result.completedAt,
  };
}

export function serializeRuntimeBridgeRecord(record: RuntimeBridgeRecord): {
  mode: RuntimeBridgeRecord['mode'];
  agentResult: SerializedAgentResult | null;
  updatedAt: string;
} {
  return {
    mode: record.mode,
    agentResult: record.lastAgentResult ? serializeAgentResult(record.lastAgentResult) : null,
    updatedAt: record.updatedAt,
  };
}

export function serializeRuntimeBridgeSnapshot(input: {
  mode: RuntimeBridgeStatusView['mode'];
  agentResult: AgentResult | null;
  facade: SerializedRuntimeSnapshot;
  updatedAt: string;
}): SerializedRuntimeBridgeSnapshot {
  return {
    mode: input.mode,
    agentResult: input.agentResult ? serializeAgentResult(input.agentResult) : null,
    facade: input.facade,
    updatedAt: input.updatedAt,
  };
}

export function buildRuntimeBridgeReport(input: {
  mode: RuntimeBridgeReport['mode'];
  agentResult: AgentResult | null;
  facadeReport: RuntimeBridgeReport['facadeReport'];
}): RuntimeBridgeReport {
  const nextRecommendedAction =
    input.facadeReport.nextRecommendedAction ??
    (input.agentResult?.status === 'failed'
      ? `Review agent failure: ${input.agentResult.error?.message ?? 'unknown error'}`
      : null);

  return {
    mode: input.mode,
    agentResult: input.agentResult,
    facadeReport: input.facadeReport,
    nextRecommendedAction,
  };
}
