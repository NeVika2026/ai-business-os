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
