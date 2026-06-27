import { approvalEngine } from '@/services/runtime/tools/approval/approval-engine';
import {
  ToolExecutionError,
  ToolNotFoundError,
  ToolValidationError,
} from '@/services/runtime/tools/executor/executor-errors';
import { executeViaRegistry } from '@/services/runtime/tools/executor/handlers/registry-handler';
import type { ToolExecution } from '@/services/runtime/tools/executor/executor-types';
import { MOCK_TOOL_EXECUTED_AT } from '@/services/runtime/tools/executor/executor-types';
import {
  buildApprovalContext,
  buildPermissionContext,
} from '@/services/runtime/tools/executor/pipeline-context';
import { validateToolExecution } from '@/services/runtime/tools/executor/validator';
import { permissionEngine } from '@/services/runtime/tools/permissions/permission-engine';
import type { ToolResult } from '@/types/runtime/dto';

function buildAudit(
  execution: ToolExecution,
  startedAt: number,
  approvalRequired: boolean,
  approved: boolean,
): ToolResult['audit'] {
  return {
    runId: execution.trace.runId,
    durationMs: Date.now() - startedAt,
    approvalRequired,
    approved,
    idempotencyKey: `c54-${execution.trace.runId}-${execution.call.id}`,
    executedAt: MOCK_TOOL_EXECUTED_AT,
  };
}

function buildFailedResult(
  execution: ToolExecution,
  startedAt: number,
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
    audit: buildAudit(execution, startedAt, approvalRequired, approved),
  };
}

function buildSuccessResult(
  execution: ToolExecution,
  startedAt: number,
  output: Record<string, unknown>,
  approvalRequired: boolean,
  approved: boolean,
): ToolResult {
  return {
    toolCallId: execution.call.id,
    name: execution.call.name,
    success: true,
    output,
    audit: buildAudit(execution, startedAt, approvalRequired, approved),
  };
}

export async function runToolExecutionPipeline(execution: ToolExecution): Promise<ToolResult> {
  const startedAt = Date.now();

  const validation = validateToolExecution(execution);

  if (!validation.valid) {
    return buildFailedResult(
      execution,
      startedAt,
      'TOOL_VALIDATION_ERROR',
      validation.errors.join('; '),
    );
  }

  const permission = permissionEngine.check(buildPermissionContext(execution));

  if (!permission.allowed) {
    return buildFailedResult(execution, startedAt, 'TOOL_PERMISSION_DENIED', permission.reason);
  }

  const approval = approvalEngine.check(buildApprovalContext(execution));

  if (approval.requiresApproval && !approval.approved) {
    return buildFailedResult(
      execution,
      startedAt,
      'TOOL_APPROVAL_REQUIRED',
      approval.reason,
      true,
      false,
    );
  }

  try {
    const output = await executeViaRegistry(execution);
    return buildSuccessResult(execution, startedAt, output, approval.requiresApproval, true);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Tool execution failed';
    const code =
      error instanceof ToolValidationError
        ? error.code
        : error instanceof ToolExecutionError
          ? error.code
          : error instanceof ToolNotFoundError
            ? error.code
            : 'TOOL_EXECUTION_ERROR';

    return buildFailedResult(execution, startedAt, code, message);
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
