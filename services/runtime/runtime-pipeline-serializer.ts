import type { AgentResult } from '@/types/runtime/dto';
import type {
  RuntimePipelineSnapshot,
  SerializedRuntimePipelineResult,
  SerializedRuntimePipelineSnapshot,
} from '@/services/runtime/runtime-pipeline-types';

function nullifyRecord(value: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    result[key] = entry === undefined ? null : entry;
  }

  return result;
}

export function serializeRuntimePipelineResult(
  result: AgentResult,
): SerializedRuntimePipelineResult {
  return {
    runId: result.trace.runId,
    correlationId: result.trace.correlationId,
    traceId: result.trace.traceId,
    parentRunId: result.trace.parentRunId ?? null,
    status: result.status,
    output: result.output ? nullifyRecord(result.output) : null,
    errorCode: result.error?.code ?? null,
    errorMessage: result.error?.message ?? null,
    errorStage: result.error?.stage ?? null,
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    toolCallCount: result.usage.toolCallCount,
    gatewayCallCount: result.usage.gatewayCallCount,
    timelineStageCount: result.timeline.length,
    completedAt: result.completedAt,
  };
}

export function serializeRuntimePipelineSnapshot(
  snapshot: RuntimePipelineSnapshot,
): SerializedRuntimePipelineSnapshot {
  return {
    lastOperation: snapshot.lastOperation,
    lastRunId: snapshot.lastRunId,
    lastStatus: snapshot.lastStatus,
    lastEmployeeId: snapshot.lastEmployeeId,
    updatedAt: snapshot.updatedAt,
  };
}
