import type { OrchestratorRuntimeExecutionResult } from '@/services/runtime/runtime-orchestrator-execution';
import { OSA_AGENT_TRACE_ORDER, type OsaAgentId } from '@/utils/osa/agent-registry';
import type { ExecutionPlan } from '@/utils/osa/execution-planner';
import {
  buildExecutionPlanSummary,
  resolveExecutionPlanForTask,
} from '@/utils/osa/execution-planner';
import { buildExecutionGraph, type ExecutionGraph } from '@/utils/osa/team-execution';
import { extractRuntimeOutputText } from '@/utils/osa/runtime-output';

export type OsaTaskStatus = 'completed' | 'simulated' | 'failed';

export interface OsaTaskAgentRef {
  id: OsaAgentId | string;
  name: string;
}

export interface OsaTaskSubmitInput {
  userPrompt: string;
  selectedAgents: OsaTaskAgentRef[];
  businessDescription: string;
  sessionId?: string;
  executionPlan?: ExecutionPlan | null;
}

export type PreparedOsaTaskSubmitInput = OsaTaskSubmitInput & {
  executionPlan: ExecutionPlan;
};

export interface OsaTaskRuntimeReport {
  runId: string;
  durationMs: number | null;
  toolCallCount: number;
  gatewayCallCount: number;
  inputTokens: number;
  outputTokens: number;
}

export interface OsaTaskSubmitResult {
  status: OsaTaskStatus;
  message: string;
  resultText: string | null;
  agentTrace: string[];
  runtimeReport: OsaTaskRuntimeReport | null;
}

const TRACE_ORDER = OSA_AGENT_TRACE_ORDER;

export function validateOsaTaskInput(input: OsaTaskSubmitInput): string | null {
  if (!input || typeof input !== 'object') {
    return 'input is required';
  }

  if (!input.userPrompt?.trim()) {
    return 'userPrompt is required';
  }

  if (!Array.isArray(input.selectedAgents) || input.selectedAgents.length === 0) {
    return 'selectedAgents is required';
  }

  return null;
}

export function traceLabelForAgent(agent: OsaTaskAgentRef): string {
  if (agent.id === 'business-manager') {
    return 'Navigator';
  }

  return agent.name;
}

export function buildOsaAgentTrace(selectedAgents: OsaTaskAgentRef[]): string[] {
  const byId = new Map(selectedAgents.map((agent) => [agent.id, agent]));

  const ordered = TRACE_ORDER.map((id) => byId.get(id)).filter(
    (agent): agent is OsaTaskAgentRef => agent !== undefined,
  );

  const extras = selectedAgents.filter((agent) => !TRACE_ORDER.includes(agent.id as OsaAgentId));

  return [...ordered, ...extras].map(traceLabelForAgent);
}

export function buildSimulatedOsaTaskResult(
  input: OsaTaskSubmitInput,
  sessionId: string,
): OsaTaskSubmitResult {
  const trace = buildOsaAgentTrace(input.selectedAgents);
  const prepared = prepareOsaTaskSubmitInput(input);
  const planSummary = buildExecutionPlanSummary(prepared.executionPlan);
  const graph = buildExecutionGraph({
    plan: prepared.executionPlan,
    graphId: `osa-graph-${sessionId}`,
  });

  return {
    status: 'simulated',
    message:
      'Задача обработана в демо-режиме по Execution Plan и Execution Graph. Включите RUNTIME_BRIDGE_ENABLED для реального выполнения.',
    resultText: `Команда OSA обработала задачу по Execution Plan (${planSummary}) и Execution Graph (${graph.totalTasks} tasks, ETA ${graph.eta} min): «${input.userPrompt.trim()}». Сессия: ${sessionId}.`,
    agentTrace: trace,
    runtimeReport: null,
  };
}

function extractResultText(runtime: OrchestratorRuntimeExecutionResult): string | null {
  const output = runtime.result?.output;
  const extracted = extractRuntimeOutputText(output);

  if (extracted) {
    return extracted;
  }

  if (!output) {
    return runtime.success ? 'Задача выполнена через RuntimeBridge.' : null;
  }

  if (runtime.success) {
    return 'Задача выполнена через RuntimeBridge.';
  }

  return null;
}

export function mapRuntimeResultToOsaTaskResult(
  input: OsaTaskSubmitInput,
  runtime: OrchestratorRuntimeExecutionResult,
  agentTrace?: string[],
): OsaTaskSubmitResult {
  const trace = agentTrace ?? buildOsaAgentTrace(input.selectedAgents);
  const resultText = extractResultText(runtime);

  if (!runtime.success) {
    return {
      status: 'failed',
      message: runtime.error?.message ?? 'Runtime execution failed',
      resultText,
      agentTrace: trace,
      runtimeReport: runtime.report,
    };
  }

  return {
    status: 'completed',
    message: 'Задача выполнена через RuntimeBridge.',
    resultText,
    agentTrace: trace,
    runtimeReport: runtime.report,
  };
}

export function prepareOsaTaskSubmitInput(input: OsaTaskSubmitInput): PreparedOsaTaskSubmitInput {
  return {
    ...input,
    executionPlan: resolveExecutionPlanForTask(input),
  };
}

export function buildOsaExecutionGraph(input: OsaTaskSubmitInput, graphId: string): ExecutionGraph {
  const prepared = prepareOsaTaskSubmitInput(input);

  return buildExecutionGraph({
    plan: prepared.executionPlan,
    graphId,
  });
}

export const OSA_COORDINATOR_EMPLOYEE_ID = 'osa000001-0000-4000-8000-000000000001';
