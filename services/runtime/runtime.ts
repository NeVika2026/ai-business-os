import { executeRuntime } from '@/services/runtime/executor';
import type { AgentExecution, AgentResult } from '@/types/runtime/dto';

export async function execute(execution: AgentExecution): Promise<AgentResult> {
  return executeRuntime(execution);
}

export const runtime = {
  execute,
};

export { executeRuntime } from '@/services/runtime/executor';
export { runPipeline } from '@/services/runtime/pipeline';
export {
  ContextBuildError,
  GatewayExecutionError,
  PromptCompileError,
  RuntimeValidationError,
} from '@/services/runtime/runtime-errors';
