import {
  routeBusinessFactoryKnowledge,
  serializeBusinessFactoryKnowledgeForRuntime,
} from '@/services/knowledge/business-factory-router';
import type { OrchestratorRuntimeExecutionResult } from '@/services/runtime/runtime-orchestrator-execution';
import {
  buildFindClientsFallbackDeliverable,
  buildFindClientsRuntimePrompt,
  parseFindClientsDeliverable,
  type FindClientsDeliverable,
} from '@/utils/results/find-clients-deliverable';
import { isRuntimeBridgeEnabledForGoal } from '@/utils/osa/runtime-bridge-policy';
import type { PreparedOsaTaskSubmitInput } from '@/utils/osa/osa-task';

export type FindClientsExecutionOutcome = {
  deliverable: FindClientsDeliverable;
  resultText: string;
  usedRuntime: boolean;
  runtimeResult: OrchestratorRuntimeExecutionResult | null;
};

export function resolveFindClientsResultText(
  input: PreparedOsaTaskSubmitInput,
  runtimeOutput: string | null,
): FindClientsExecutionOutcome {
  const rawText =
    runtimeOutput?.trim() ||
    buildFindClientsFallbackDeliverable(input.userPrompt, input.businessDescription);

  const deliverable = parseFindClientsDeliverable(rawText);

  return {
    deliverable,
    resultText: deliverable.rawText,
    usedRuntime: Boolean(runtimeOutput?.trim()),
    runtimeResult: null,
  };
}

export function buildFindClientsAgentPayload(
  input: PreparedOsaTaskSubmitInput,
  sessionId: string,
  runId: string,
): Record<string, unknown> {
  const knowledgeMethods = routeBusinessFactoryKnowledge({
    query: [input.userPrompt, input.businessDescription, 'клиенты продажи целевая аудитория']
      .filter(Boolean)
      .join(' '),
    selectedAgentIds: input.selectedAgents.map((agent) => agent.id),
    limit: 5,
  });

  const knowledgeQuery = [
    input.userPrompt,
    input.businessDescription,
    'клиенты продажи целевая аудитория воронка скрипт возражения',
  ]
    .filter(Boolean)
    .join(' ');

  return {
    source: 'osa_workspace',
    session_id: sessionId,
    task_goal: 'find_clients',
    user_prompt: buildFindClientsRuntimePrompt(input.userPrompt, input.businessDescription),
    business_description: input.businessDescription.trim(),
    goal_id: 'find_clients',
    goal_title: 'Find Clients',
    knowledgeQuery,
    business_factory_knowledge: serializeBusinessFactoryKnowledgeForRuntime(knowledgeMethods),
    trace: {
      runId,
      correlationId: runId,
      traceId: runId,
    },
  };
}

export function shouldExecuteFindClientsWithRuntime(goalId: string | null | undefined): boolean {
  return isRuntimeBridgeEnabledForGoal(goalId);
}
