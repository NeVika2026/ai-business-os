import type { OrchestratorRuntimeExecutionResult } from '@/services/runtime/runtime-orchestrator-execution';
import type { AgentRunStatus } from '@/types/ai';
import type {
  OsaTaskAgentRef,
  OsaTaskSubmitInput,
  OsaTaskSubmitResult,
} from '@/utils/osa/osa-task';
import {
  buildOsaAgentTrace,
  buildSimulatedOsaTaskResult,
  mapRuntimeResultToOsaTaskResult,
} from '@/utils/osa/osa-task';
import { serializeExecutionPlan, type ExecutionPlan } from '@/utils/osa/execution-planner';

export const OSA_EVENT_SOURCE = 'osa';

export type OsaRunEventType =
  | 'osa_task_submitted'
  | 'osa_team_selected'
  | 'osa_execution_plan_created'
  | 'osa_runtime_started'
  | 'osa_runtime_completed'
  | 'osa_runtime_failed';

export interface OsaRunPersistenceContext {
  runId: string;
  sessionId: string;
  organizationId: string;
  aiEmployeeId: string;
  userId: string;
  runtimeBridgeEnabled: boolean;
}

export interface OsaRunInsertRecord {
  organization_id: string;
  ai_employee_id: string;
  status: AgentRunStatus;
  input: Record<string, unknown>;
  started_at: string;
  created_by: string;
}

export interface OsaRunUpdateRecord {
  status: AgentRunStatus;
  completed_at: string;
  output: Record<string, unknown>;
  tokens_input?: number;
  tokens_output?: number;
  error_message?: string | null;
}

export interface OsaEventInsertRecord {
  organization_id: string;
  type: OsaRunEventType;
  source: typeof OSA_EVENT_SOURCE;
  actor_type: string;
  actor_id: string | null;
  payload: Record<string, unknown>;
  correlation_id: string;
}

export function buildOsaRunInsertRecord(
  input: OsaTaskSubmitInput & { executionPlan: ExecutionPlan },
  context: OsaRunPersistenceContext,
): OsaRunInsertRecord {
  return {
    organization_id: context.organizationId,
    ai_employee_id: context.aiEmployeeId,
    status: 'running',
    started_at: new Date().toISOString(),
    created_by: context.userId,
    input: buildOsaRunInputPayload(input, context),
  };
}

export function buildOsaRunInputPayload(
  input: OsaTaskSubmitInput & { executionPlan: ExecutionPlan },
  context: OsaRunPersistenceContext,
): Record<string, unknown> {
  return {
    action: 'osa_task',
    source: 'osa_workspace',
    session_id: context.sessionId,
    user_prompt: input.userPrompt.trim(),
    business_description: input.businessDescription.trim(),
    selected_agents: input.selectedAgents,
    agent_trace: buildOsaAgentTrace(input.selectedAgents),
    execution_plan: serializeExecutionPlan(input.executionPlan),
    simulated: !context.runtimeBridgeEnabled,
    runtime_bridge_enabled: context.runtimeBridgeEnabled,
  };
}

export function buildOsaExecutionPlanCreatedEvent(
  context: OsaRunPersistenceContext,
  executionPlan: ExecutionPlan,
): OsaEventInsertRecord {
  return buildOsaEventRecord(context, 'osa_execution_plan_created', 'system', null, {
    session_id: context.sessionId,
    ...serializeExecutionPlan(executionPlan),
  });
}

export function buildOsaTeamSelectedEvent(
  context: OsaRunPersistenceContext,
  selectedAgents: OsaTaskAgentRef[],
): OsaEventInsertRecord {
  return buildOsaEventRecord(context, 'osa_team_selected', 'user', context.userId, {
    session_id: context.sessionId,
    selected_agents: selectedAgents,
    agent_trace: buildOsaAgentTrace(selectedAgents),
  });
}

export function buildOsaTaskSubmittedEvent(
  context: OsaRunPersistenceContext,
): OsaEventInsertRecord {
  return buildOsaEventRecord(context, 'osa_task_submitted', 'user', context.userId, {
    session_id: context.sessionId,
  });
}

export function buildOsaRuntimeStartedEvent(
  context: OsaRunPersistenceContext,
): OsaEventInsertRecord {
  return buildOsaEventRecord(context, 'osa_runtime_started', 'system', null, {
    session_id: context.sessionId,
    runtime_bridge_enabled: context.runtimeBridgeEnabled,
    simulated: !context.runtimeBridgeEnabled,
  });
}

export function buildOsaRuntimeCompletedEvent(
  context: OsaRunPersistenceContext,
  payload: Record<string, unknown>,
): OsaEventInsertRecord {
  return buildOsaEventRecord(
    context,
    'osa_runtime_completed',
    'ai_employee',
    context.aiEmployeeId,
    payload,
  );
}

export function buildOsaRuntimeFailedEvent(
  context: OsaRunPersistenceContext,
  payload: Record<string, unknown>,
): OsaEventInsertRecord {
  return buildOsaEventRecord(context, 'osa_runtime_failed', 'system', null, payload);
}

export function buildOsaRunUpdateForSimulated(
  input: OsaTaskSubmitInput,
  context: OsaRunPersistenceContext,
): OsaRunUpdateRecord {
  const trace = buildOsaAgentTrace(input.selectedAgents);

  return {
    status: 'completed',
    completed_at: new Date().toISOString(),
    tokens_input: 0,
    tokens_output: 0,
    output: {
      simulated: true,
      runtime_bridge_enabled: false,
      status: 'simulated',
      session_id: context.sessionId,
      agent_trace: trace,
      message: `OSA demo pipeline completed for session ${context.sessionId}`,
    },
  };
}

export function buildOsaRunUpdateForRuntimeSuccess(
  runtime: OrchestratorRuntimeExecutionResult,
  input: OsaTaskSubmitInput,
  context: OsaRunPersistenceContext,
): OsaRunUpdateRecord {
  return {
    status: 'completed',
    completed_at: new Date().toISOString(),
    tokens_input: runtime.report?.inputTokens ?? 0,
    tokens_output: runtime.report?.outputTokens ?? 0,
    output: {
      simulated: false,
      runtime_bridge_enabled: true,
      status: runtime.status,
      session_id: context.sessionId,
      agent_trace: buildOsaAgentTrace(input.selectedAgents),
      report: runtime.report,
      result_status: runtime.result?.status ?? null,
      result_text: extractPersistedResultText(runtime),
    },
  };
}

export function buildOsaRunUpdateForRuntimeFailure(
  runtime: OrchestratorRuntimeExecutionResult,
  input: OsaTaskSubmitInput,
  context: OsaRunPersistenceContext,
): OsaRunUpdateRecord {
  const errorMessage = runtime.error?.message ?? 'Runtime execution failed';

  return {
    status: 'failed',
    completed_at: new Date().toISOString(),
    error_message: errorMessage,
    output: {
      simulated: false,
      runtime_bridge_enabled: true,
      status: runtime.status,
      session_id: context.sessionId,
      agent_trace: buildOsaAgentTrace(input.selectedAgents),
      error: runtime.error,
      report: runtime.report,
    },
  };
}

export function attachRunIdToOsaTaskResult(
  result: OsaTaskSubmitResult,
  runId: string,
): OsaTaskSubmitResult {
  if (result.runtimeReport) {
    return {
      ...result,
      runtimeReport: {
        ...result.runtimeReport,
        runId,
      },
    };
  }

  return {
    ...result,
    runtimeReport: {
      runId,
      durationMs: null,
      toolCallCount: 0,
      gatewayCallCount: 0,
      inputTokens: 0,
      outputTokens: 0,
    },
  };
}

export function buildPersistedSimulatedOsaTaskResult(
  input: OsaTaskSubmitInput,
  sessionId: string,
  runId: string,
): OsaTaskSubmitResult {
  return attachRunIdToOsaTaskResult(buildSimulatedOsaTaskResult(input, sessionId), runId);
}

export function buildPersistedRuntimeOsaTaskResult(
  input: OsaTaskSubmitInput,
  runtime: OrchestratorRuntimeExecutionResult,
  runId: string,
): OsaTaskSubmitResult {
  return attachRunIdToOsaTaskResult(mapRuntimeResultToOsaTaskResult(input, runtime), runId);
}

function buildOsaEventRecord(
  context: OsaRunPersistenceContext,
  type: OsaRunEventType,
  actorType: string,
  actorId: string | null,
  payload: Record<string, unknown>,
): OsaEventInsertRecord {
  return {
    organization_id: context.organizationId,
    type,
    source: OSA_EVENT_SOURCE,
    actor_type: actorType,
    actor_id: actorId,
    correlation_id: context.runId,
    payload: {
      run_id: context.runId,
      ai_employee_id: context.aiEmployeeId,
      ...payload,
    },
  };
}

function extractPersistedResultText(runtime: OrchestratorRuntimeExecutionResult): string | null {
  const output = runtime.result?.output;
  if (!output || typeof output !== 'object') {
    return null;
  }

  for (const key of ['content', 'summary', 'message'] as const) {
    const value = output[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}
