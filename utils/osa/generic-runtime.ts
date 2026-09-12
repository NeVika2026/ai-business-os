import type { PreparedOsaTaskSubmitInput } from '@/utils/osa/osa-task';

export function shouldUseGenericOsaRuntime(input: {
  runtimeBridgeEnabled: boolean;
  goalId: string | null | undefined;
}): boolean {
  return input.runtimeBridgeEnabled && input.goalId !== 'find_clients';
}

export function buildGenericOsaRuntimePayload(input: {
  preparedInput: PreparedOsaTaskSubmitInput;
  sessionId: string;
  runId: string;
}): Record<string, unknown> {
  const { preparedInput, sessionId, runId } = input;

  return {
    run_id: runId,
    session_id: sessionId,
    user_prompt: preparedInput.userPrompt.trim(),
    business_description: preparedInput.businessDescription.trim(),
    selected_agents: preparedInput.selectedAgents,
    execution_plan: preparedInput.executionPlan,
    goal_id: preparedInput.goalId ?? null,
    goal_title: preparedInput.goalTitle ?? null,
    project_id: preparedInput.projectId ?? null,
  };
}
