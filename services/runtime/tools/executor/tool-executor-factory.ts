import {
  createRegistryHandlerScope,
  type RegistryHandlerScope,
} from '@/services/runtime/tools/executor/handlers/registry-handler';
import {
  executeManyToolCalls,
  runToolExecutionPipeline,
  validateExecution,
} from '@/services/runtime/tools/executor/pipeline';
import type { ToolExecution } from '@/services/runtime/tools/executor/executor-types';
import { createProductionToolRegistry, toolRegistry } from '@/services/runtime/tools/tool-registry';
import type { ToolRegistry } from '@/services/runtime/tools/registry';

export function createToolExecutor(registry: ToolRegistry = createProductionToolRegistry()) {
  const registryScope: RegistryHandlerScope = createRegistryHandlerScope(registry);

  return {
    execute: (execution: ToolExecution) => runToolExecutionPipeline(execution, registryScope),
    validate: (execution: ToolExecution) => validateExecution(execution),
    executeMany: (executions: ToolExecution[]) => executeManyToolCalls(executions, registryScope),
    registry,
  };
}

export const defaultToolExecutor = createToolExecutor(toolRegistry);
