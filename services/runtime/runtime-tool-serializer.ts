import type { ToolResult } from '@/types/runtime/dto';
import type {
  RuntimeToolSnapshot,
  SerializedRuntimeToolResult,
  SerializedRuntimeToolSnapshot,
} from '@/services/runtime/runtime-tool-types';

export function serializeRuntimeToolResult(result: ToolResult): SerializedRuntimeToolResult {
  return {
    toolCallId: result.toolCallId,
    name: result.name,
    success: result.success,
    output:
      result.output === null
        ? null
        : typeof result.output === 'string'
          ? result.output
          : { ...result.output },
    error: result.error
      ? {
          code: result.error.code,
          message: result.error.message,
        }
      : null,
    audit: {
      runId: result.audit.runId,
      durationMs: result.audit.durationMs,
      approvalRequired: result.audit.approvalRequired,
      approved: result.audit.approved,
      idempotencyKey: result.audit.idempotencyKey,
      executedAt: result.audit.executedAt,
    },
  };
}

export function serializeRuntimeToolSnapshot(
  snapshot: RuntimeToolSnapshot,
): SerializedRuntimeToolSnapshot {
  return {
    lastOperation: snapshot.lastOperation,
    lastToolId: snapshot.lastToolId,
    lastSuccess: snapshot.lastSuccess,
    updatedAt: snapshot.updatedAt,
  };
}
