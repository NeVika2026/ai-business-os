import { runPipeline } from '@/services/runtime/pipeline';
import type { AgentExecution, AgentResult } from '@/types/runtime/dto';

export async function executeRuntime(execution: AgentExecution): Promise<AgentResult> {
  return runPipeline(execution);
}
