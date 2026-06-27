import {
  executeManyToolCalls,
  runToolExecutionPipeline,
  validateExecution,
} from '@/services/runtime/tools/executor/pipeline';
import type {
  ToolExecution,
  ToolValidationResult,
} from '@/services/runtime/tools/executor/executor-types';
import type { ToolResult } from '@/types/runtime/dto';

export { createToolExecutor } from '@/services/runtime/tools/executor/tool-executor-factory';
export type {
  ToolExecution,
  ToolValidationResult,
} from '@/services/runtime/tools/executor/executor-types';
export {
  ToolApprovalRequiredError,
  ToolExecutionError,
  ToolExecutorError,
  ToolNotFoundError,
  ToolPermissionDeniedError,
  ToolValidationError,
} from '@/services/runtime/tools/executor/executor-errors';

export async function execute(execution: ToolExecution): Promise<ToolResult> {
  return runToolExecutionPipeline(execution);
}

export function validate(execution: ToolExecution): ToolValidationResult {
  return validateExecution(execution);
}

export async function executeMany(
  executions: ToolExecution[],
): Promise<{ results: ToolResult[]; stoppedAt?: number }> {
  return executeManyToolCalls(executions);
}

export const toolExecutor = {
  execute,
  validate,
  executeMany,
};

export { auditRecorder } from '@/services/runtime/tools/audit/audit-recorder';
export type { ToolAuditEvent, ToolAuditMetadata } from '@/services/runtime/tools/audit/audit-types';
export {
  computeIdempotencyKey,
  stableStringify,
} from '@/services/runtime/tools/idempotency/idempotency-key';
export { shouldCacheToolResult } from '@/services/runtime/tools/idempotency/idempotency-cache-policy';
export { idempotencyStore } from '@/services/runtime/tools/idempotency/idempotency-store';
export {
  executeWithRetry,
  isRetryableError,
  toRetryConfig,
} from '@/services/runtime/tools/retry/retry-policy';
export type { BackoffStrategy, RetryConfig } from '@/services/runtime/tools/retry/retry-types';
export {
  NonRetryableError,
  RetryError,
  RetryExhaustedError,
} from '@/services/runtime/tools/retry/retry-errors';
