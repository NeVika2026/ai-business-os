import type { AgentExecution, AgentResult } from '@/types/runtime/dto';

export function isRuntimeBridgeEnabled(): boolean {
  return process.env.RUNTIME_BRIDGE_ENABLED === 'true';
}

export interface BuildOrchestratorAgentExecutionInput {
  organizationId: string;
  employeeId: string;
  action?: string;
  runId: string;
  correlationId?: string;
  traceId?: string;
  payload?: Record<string, unknown>;
}

export function buildOrchestratorAgentExecution(
  input: BuildOrchestratorAgentExecutionInput,
): AgentExecution {
  const correlationId = input.correlationId ?? input.runId;
  const traceId = input.traceId ?? input.runId;

  return {
    scope: {
      organizationId: input.organizationId,
    },
    employeeId: input.employeeId,
    input: {
      action: input.action ?? 'execute',
      payload: {
        ...(input.payload ?? {}),
        trace: {
          runId: input.runId,
          correlationId,
          traceId,
        },
      },
    },
  };
}

export interface OrchestratorRuntimeExecutionResult {
  success: boolean;
  status: AgentResult['status'];
  simulated: boolean;
  result: AgentResult | null;
  error: {
    code: string;
    message: string;
    stage: string | null;
  } | null;
  report: {
    runId: string;
    durationMs: number | null;
    toolCallCount: number;
    gatewayCallCount: number;
    inputTokens: number;
    outputTokens: number;
  } | null;
}

export async function executeOrchestratorRuntimeAgent(
  execution: AgentExecution,
): Promise<OrchestratorRuntimeExecutionResult> {
  const { createRuntimeBridge } = await import('@/services/runtime/runtime-bridge');
  const bridge = createRuntimeBridge({
    instanceId: `orchestrator-${execution.input.payload?.trace && typeof execution.input.payload.trace === 'object' && 'runId' in execution.input.payload.trace ? String((execution.input.payload.trace as { runId: string }).runId) : 'run'}`,
    orchestrationOnly: false,
    memoryInjectionEnabled: true,
    knowledgeInjectionEnabled: true,
  });

  try {
    const result = await bridge.runAgent(execution, { useFullExecution: true });
    const durationMs =
      result.timeline.reduce((total, entry) => total + entry.durationMs, 0) || null;

    return {
      success: result.status === 'completed',
      status: result.status,
      simulated: false,
      result,
      error: result.error
        ? {
            code: result.error.code,
            message: result.error.message,
            stage: result.error.stage ?? null,
          }
        : null,
      report: {
        runId: result.trace.runId,
        durationMs,
        toolCallCount: result.usage.toolCallCount,
        gatewayCallCount: result.usage.gatewayCallCount,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Runtime bridge execution failed';
    return {
      success: false,
      status: 'failed',
      simulated: false,
      result: null,
      error: {
        code: error instanceof Error ? error.name : 'RuntimeBridgeError',
        message,
        stage: 'bridge',
      },
      report: null,
    };
  } finally {
    bridge.resetRuntime();
  }
}
