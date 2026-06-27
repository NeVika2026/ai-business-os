import { approvalEngine } from '@/services/runtime/tools/approval/approval-engine';
import { auditRecorder } from '@/services/runtime/tools/audit/audit-recorder';
import {
  ToolNotFoundError,
  ToolValidationError,
} from '@/services/runtime/tools/executor/executor-errors';
import {
  executeRegisteredToolHandler,
  prepareRegistryTool,
} from '@/services/runtime/tools/executor/handlers/registry-handler';
import type { ToolExecution } from '@/services/runtime/tools/executor/executor-types';
import { MOCK_TOOL_EXECUTED_AT } from '@/services/runtime/tools/executor/executor-types';
import {
  buildApprovalContext,
  buildPermissionContext,
} from '@/services/runtime/tools/executor/pipeline-context';
import { validateToolExecution } from '@/services/runtime/tools/executor/validator';
import { computeIdempotencyKey } from '@/services/runtime/tools/idempotency/idempotency-key';
import { shouldCacheToolResult } from '@/services/runtime/tools/idempotency/idempotency-cache-policy';
import { idempotencyStore } from '@/services/runtime/tools/idempotency/idempotency-store';
import { permissionEngine } from '@/services/runtime/tools/permissions/permission-engine';
import {
  executeWithRetry,
  extractErrorCode,
  toRetryConfig,
} from '@/services/runtime/tools/retry/retry-policy';
import type { ToolResult } from '@/types/runtime/dto';

function buildAudit(
  execution: ToolExecution,
  startedAt: number,
  idempotencyKey: string,
  approvalRequired: boolean,
  approved: boolean,
): ToolResult['audit'] {
  return {
    runId: execution.trace.runId,
    durationMs: Date.now() - startedAt,
    approvalRequired,
    approved,
    idempotencyKey,
    executedAt: MOCK_TOOL_EXECUTED_AT,
  };
}

function buildFailedResult(
  execution: ToolExecution,
  startedAt: number,
  idempotencyKey: string,
  code: string,
  message: string,
  approvalRequired = false,
  approved = false,
): ToolResult {
  return {
    toolCallId: execution.call.id,
    name: execution.call.name,
    success: false,
    output: null,
    error: { code, message },
    audit: buildAudit(execution, startedAt, idempotencyKey, approvalRequired, approved),
  };
}

function buildSuccessResult(
  execution: ToolExecution,
  startedAt: number,
  idempotencyKey: string,
  output: Record<string, unknown>,
  approvalRequired: boolean,
  approved: boolean,
): ToolResult {
  return {
    toolCallId: execution.call.id,
    name: execution.call.name,
    success: true,
    output,
    audit: buildAudit(execution, startedAt, idempotencyKey, approvalRequired, approved),
  };
}

function recordAuditEvent(
  execution: ToolExecution,
  startedAt: number,
  idempotencyKey: string,
  status: 'success' | 'failed' | 'cached',
  retryAttempts: number,
  error?: { code: string; message: string },
) {
  auditRecorder.record({
    traceId: execution.trace.traceId,
    runId: execution.trace.runId,
    toolId: execution.call.name,
    toolCallId: execution.call.id,
    status,
    durationMs: Date.now() - startedAt,
    idempotencyKey,
    cached: status === 'cached',
    retryAttempts,
    error,
  });
}

export async function runToolExecutionPipeline(execution: ToolExecution): Promise<ToolResult> {
  const startedAt = Date.now();
  const provisionalKey = computeIdempotencyKey(
    execution.trace.runId,
    execution.call.name,
    execution.call.arguments,
  );

  const validation = validateToolExecution(execution);

  if (!validation.valid) {
    const result = buildFailedResult(
      execution,
      startedAt,
      provisionalKey,
      'TOOL_VALIDATION_ERROR',
      validation.errors.join('; '),
    );
    recordAuditEvent(execution, startedAt, provisionalKey, 'failed', 0, result.error);
    return result;
  }

  const permission = permissionEngine.check(buildPermissionContext(execution));

  if (!permission.allowed) {
    const result = buildFailedResult(
      execution,
      startedAt,
      provisionalKey,
      'TOOL_PERMISSION_DENIED',
      permission.reason,
    );
    recordAuditEvent(execution, startedAt, provisionalKey, 'failed', 0, result.error);
    return result;
  }

  const approval = approvalEngine.check(buildApprovalContext(execution));

  if (approval.requiresApproval && !approval.approved) {
    const result = buildFailedResult(
      execution,
      startedAt,
      provisionalKey,
      'TOOL_APPROVAL_REQUIRED',
      approval.reason,
      true,
      false,
    );
    recordAuditEvent(execution, startedAt, provisionalKey, 'failed', 0, result.error);
    return result;
  }

  let tool;

  try {
    tool = prepareRegistryTool(execution);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registry validation failed';
    const code =
      error instanceof ToolValidationError
        ? error.code
        : error instanceof ToolNotFoundError
          ? error.code
          : 'TOOL_NOT_FOUND';
    const result = buildFailedResult(execution, startedAt, provisionalKey, code, message);
    recordAuditEvent(execution, startedAt, provisionalKey, 'failed', 0, result.error);
    return result;
  }

  const idempotencyKey = computeIdempotencyKey(
    execution.trace.runId,
    tool.id,
    execution.call.arguments,
  );

  const cachedResult = idempotencyStore.get(idempotencyKey);

  if (cachedResult) {
    recordAuditEvent(execution, startedAt, idempotencyKey, 'cached', 0);
    return cachedResult;
  }

  const retryConfig = toRetryConfig(tool.retryPolicy);

  try {
    const { value, attempts } = await executeWithRetry(
      () => executeRegisteredToolHandler(execution, tool),
      retryConfig,
    );

    const result = buildSuccessResult(
      execution,
      startedAt,
      idempotencyKey,
      value,
      approval.requiresApproval,
      true,
    );

    idempotencyStore.set(idempotencyKey, result);
    recordAuditEvent(execution, startedAt, idempotencyKey, 'success', attempts);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Tool execution failed';
    const code = extractErrorCode(error);
    const result = buildFailedResult(execution, startedAt, idempotencyKey, code, message);

    if (shouldCacheToolResult(result, retryConfig)) {
      idempotencyStore.set(idempotencyKey, result);
    }

    recordAuditEvent(
      execution,
      startedAt,
      idempotencyKey,
      'failed',
      retryConfig.maxAttempts,
      result.error,
    );
    return result;
  }
}

export function validateExecution(execution: ToolExecution) {
  return validateToolExecution(execution);
}

export async function executeManyToolCalls(
  executions: ToolExecution[],
): Promise<{ results: ToolResult[]; stoppedAt?: number }> {
  const results: ToolResult[] = [];

  for (let index = 0; index < executions.length; index += 1) {
    const result = await runToolExecutionPipeline(executions[index]);
    results.push(result);

    if (!result.success) {
      return { results, stoppedAt: index };
    }
  }

  return { results };
}
