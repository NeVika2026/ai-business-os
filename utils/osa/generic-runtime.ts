import {
  routeBusinessFactoryKnowledge,
  serializeBusinessFactoryKnowledgeForRuntime,
} from '@/services/knowledge/business-factory-router';
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
  const knowledgeMethods = routeBusinessFactoryKnowledge({
    query: [
      preparedInput.userPrompt,
      preparedInput.businessDescription,
      preparedInput.goalTitle ?? '',
    ]
      .filter(Boolean)
      .join(' '),
    selectedAgentIds: preparedInput.selectedAgents.map((agent) => agent.id),
    limit: 5,
  });

  const knowledgeQuery = [
    preparedInput.userPrompt,
    preparedInput.businessDescription,
    preparedInput.goalTitle ?? '',
  ]
    .filter(Boolean)
    .join(' ');

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
    knowledgeQuery,
    business_factory_knowledge: serializeBusinessFactoryKnowledgeForRuntime(knowledgeMethods),
  };
}
