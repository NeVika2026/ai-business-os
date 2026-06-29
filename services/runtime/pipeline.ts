import { buildRoutingHintsFromContext } from '@/lib/ai/model-router';
import { buildContext } from '@/services/runtime/context/context-builder';
import type { BuildContextInput } from '@/services/runtime/context/types';
import { ContextValidationError } from '@/services/runtime/context/validation';
import { aiGateway } from '@/services/runtime/gateway/ai-gateway';
import { compilePrompt } from '@/services/runtime/prompt/prompt-compiler';
import type { CompilePromptInput, CrmSectionItem } from '@/services/runtime/prompt/types';
import {
  ContextBuildError,
  GatewayExecutionError,
  PromptCompileError,
  RuntimeValidationError,
} from '@/services/runtime/runtime-errors';
import type {
  AgentExecution,
  AgentResult,
  ContextPackage,
  GatewayRequest,
  GatewayResponse,
  ISODateTime,
  KnowledgeChunkRef,
  MemoryEntry,
  PromptRequest,
  TraceContext,
} from '@/types/runtime/dto';

const DEFAULT_GATEWAY_TIMEOUT_MS = 30_000;
const DEFAULT_RETRY_POLICY: GatewayRequest['retryPolicy'] = {
  maxAttempts: 3,
  backoffMs: [500, 1_000, 2_000],
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function toIsoTimestamp(value: number): ISODateTime {
  return new Date(value).toISOString();
}

export function validateAgentExecution(execution: AgentExecution): void {
  if (!isNonEmptyString(execution.scope?.organizationId)) {
    throw new RuntimeValidationError('scope.organizationId is required');
  }

  if (!isNonEmptyString(execution.employeeId)) {
    throw new RuntimeValidationError('employeeId is required');
  }

  if (!execution.input || !isNonEmptyString(execution.input.action)) {
    throw new RuntimeValidationError('input.action is required');
  }

  if (!execution.input.payload || typeof execution.input.payload !== 'object') {
    throw new RuntimeValidationError('input.payload must be an object');
  }
}

function buildUniformTrace(
  id: string,
  execution: AgentExecution,
  parentRunId?: unknown,
): TraceContext {
  return {
    runId: id,
    correlationId: id,
    traceId: id,
    parentRunId: isNonEmptyString(parentRunId) ? parentRunId : (execution.parentRunId ?? null),
  };
}

export function resolveTrace(execution: AgentExecution): TraceContext {
  const payload = execution.input.payload;
  const payloadTrace = payload.trace;

  if (payloadTrace && typeof payloadTrace === 'object' && !Array.isArray(payloadTrace)) {
    const trace = payloadTrace as Record<string, unknown>;

    if (isNonEmptyString(trace.runId)) {
      const runId = trace.runId;

      return {
        runId,
        correlationId: isNonEmptyString(trace.correlationId) ? trace.correlationId : runId,
        traceId: isNonEmptyString(trace.traceId) ? trace.traceId : runId,
        parentRunId: isNonEmptyString(trace.parentRunId)
          ? trace.parentRunId
          : (execution.parentRunId ?? null),
      };
    }
  }

  if (isNonEmptyString(payload.runId)) {
    const runId = payload.runId;

    return {
      runId,
      correlationId: isNonEmptyString(payload.correlationId) ? payload.correlationId : runId,
      traceId: isNonEmptyString(payload.traceId) ? payload.traceId : runId,
      parentRunId: execution.parentRunId ?? null,
    };
  }

  if (isNonEmptyString(payload.correlationId)) {
    return buildUniformTrace(payload.correlationId, execution);
  }

  if (isNonEmptyString(payload.traceId)) {
    return buildUniformTrace(payload.traceId, execution);
  }

  throw new RuntimeValidationError(
    'trace is required in input.payload.trace.runId, runId, correlationId, or traceId',
  );
}

function toBuildContextInput(execution: AgentExecution, trace: TraceContext): BuildContextInput {
  return {
    scope: execution.scope,
    trace,
    employeeId: execution.employeeId,
    taskId: execution.taskId,
    request: {
      action: execution.input.action,
      payload: execution.input.payload,
    },
  };
}

function stripContextPayload(payload: Record<string, unknown>) {
  const reservedKeys = new Set([
    'knowledgeChunks',
    'memoryEntries',
    'crmLeads',
    'organization',
    'history',
    'trace',
    'runId',
    'correlationId',
    'traceId',
  ]);

  return Object.fromEntries(Object.entries(payload).filter(([key]) => !reservedKeys.has(key)));
}

function toKnowledgePackage(context: ContextPackage) {
  const chunks = context.userIntent.payload.knowledgeChunks;

  if (!Array.isArray(chunks) || chunks.length === 0) {
    return null;
  }

  const typedChunks = chunks as KnowledgeChunkRef[];

  return {
    scope: context.scope,
    trace: context.trace,
    query: context.userIntent.action,
    chunks: typedChunks,
    totalChunks: typedChunks.length,
    truncated: false,
    retrievedAt: context.retrievedAt,
  };
}

function toMemoryPackage(context: ContextPackage) {
  const entries = context.userIntent.payload.memoryEntries;

  if (!Array.isArray(entries) || entries.length === 0) {
    return null;
  }

  return {
    scope: context.scope,
    trace: context.trace,
    employeeId: context.employee.id,
    entries: entries as MemoryEntry[],
    enabled: true,
    retrievedAt: context.retrievedAt,
  };
}

function toCrmItems(context: ContextPackage): CrmSectionItem[] | undefined {
  const leads = context.userIntent.payload.crmLeads;

  if (!Array.isArray(leads) || leads.length === 0) {
    return undefined;
  }

  return leads.map((lead) => {
    const item = lead as Record<string, unknown>;

    return {
      id: String(item.id ?? ''),
      name: String(item.name ?? ''),
      status: typeof item.status === 'string' ? item.status : undefined,
      email: typeof item.email === 'string' || item.email === null ? item.email : undefined,
      phone: typeof item.phone === 'string' || item.phone === null ? item.phone : undefined,
      notes: typeof item.notes === 'string' || item.notes === null ? item.notes : undefined,
    };
  });
}

export function toCompilePromptInput(context: ContextPackage): CompilePromptInput {
  return {
    context: {
      ...context,
      userIntent: {
        action: context.userIntent.action,
        payload: stripContextPayload(context.userIntent.payload),
      },
    },
    knowledge: toKnowledgePackage(context),
    memory: toMemoryPackage(context),
    crmItems: toCrmItems(context),
  };
}

export function toGatewayRequest(prompt: PromptRequest, context: ContextPackage): GatewayRequest {
  return {
    scope: prompt.scope,
    trace: prompt.trace,
    providerCode: 'auto',
    modelCode: 'auto',
    messages: prompt.messages,
    tools: prompt.tools,
    parameters: prompt.parameters,
    timeoutMs: DEFAULT_GATEWAY_TIMEOUT_MS,
    retryPolicy: DEFAULT_RETRY_POLICY,
    routing: buildRoutingHintsFromContext(context, prompt.messages, prompt.tools),
  };
}

type RuntimeFailureStage = NonNullable<AgentResult['error']>['stage'];

function buildFailedResult(
  trace: TraceContext,
  stage: RuntimeFailureStage,
  error: unknown,
  timeline: AgentResult['timeline'],
  completedAt: ISODateTime,
): AgentResult {
  const message = error instanceof Error ? error.message : 'Runtime pipeline failed unexpectedly';

  return {
    trace,
    status: 'failed',
    output: null,
    error: {
      code: error instanceof Error ? error.name : 'RuntimeError',
      message,
      stage,
    },
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      toolCallCount: 0,
      gatewayCallCount: 0,
    },
    timeline,
    completedAt,
  };
}

function buildCompletedResult(
  trace: TraceContext,
  gatewayResponse: GatewayResponse,
  timeline: AgentResult['timeline'],
  completedAt: ISODateTime,
): AgentResult {
  return {
    trace,
    status: 'completed',
    output: {
      content: gatewayResponse.content,
      finishReason: gatewayResponse.finishReason,
      providerCode: gatewayResponse.providerCode,
      modelCode: gatewayResponse.modelCode,
      providerRequestId: gatewayResponse.providerRequestId ?? null,
    },
    usage: {
      inputTokens: gatewayResponse.usage.inputTokens,
      outputTokens: gatewayResponse.usage.outputTokens,
      toolCallCount: 0,
      gatewayCallCount: 1,
    },
    timeline,
    completedAt,
  };
}

export async function runPipeline(execution: AgentExecution): Promise<AgentResult> {
  const timeline: AgentResult['timeline'] = [];

  validateAgentExecution(execution);
  const trace = resolveTrace(execution);

  let contextPackage: ContextPackage;

  const contextStartedAt = Date.now();

  try {
    contextPackage = buildContext(toBuildContextInput(execution, trace));
    timeline.push({
      stage: 'context.built',
      startedAt: toIsoTimestamp(contextStartedAt),
      durationMs: Date.now() - contextStartedAt,
      status: 'ok',
    });
  } catch (error) {
    timeline.push({
      stage: 'context.built',
      startedAt: toIsoTimestamp(contextStartedAt),
      durationMs: Date.now() - contextStartedAt,
      status: 'error',
    });

    const wrappedError =
      error instanceof ContextValidationError
        ? new ContextBuildError(error.message, error)
        : new ContextBuildError('Failed to build context', error);

    return buildFailedResult(trace, 'context', wrappedError, timeline, toIsoTimestamp(Date.now()));
  }

  let promptRequest: PromptRequest;
  const promptStartedAt = Date.now();

  try {
    promptRequest = compilePrompt(toCompilePromptInput(contextPackage));
    timeline.push({
      stage: 'prompt.compiled',
      startedAt: toIsoTimestamp(promptStartedAt),
      durationMs: Date.now() - promptStartedAt,
      status: 'ok',
    });
  } catch (error) {
    timeline.push({
      stage: 'prompt.compiled',
      startedAt: toIsoTimestamp(promptStartedAt),
      durationMs: Date.now() - promptStartedAt,
      status: 'error',
    });

    return buildFailedResult(
      trace,
      'prompt',
      new PromptCompileError('Failed to compile prompt', error),
      timeline,
      toIsoTimestamp(Date.now()),
    );
  }

  let gatewayResponse: GatewayResponse;
  const gatewayStartedAt = Date.now();

  try {
    gatewayResponse = await aiGateway.complete(toGatewayRequest(promptRequest, contextPackage));

    if (gatewayResponse.error) {
      throw new GatewayExecutionError(gatewayResponse.error.message);
    }

    timeline.push({
      stage: 'gateway.completed',
      startedAt: toIsoTimestamp(gatewayStartedAt),
      durationMs: Date.now() - gatewayStartedAt,
      status: 'ok',
    });
  } catch (error) {
    timeline.push({
      stage: 'gateway.completed',
      startedAt: toIsoTimestamp(gatewayStartedAt),
      durationMs: Date.now() - gatewayStartedAt,
      status: 'error',
    });

    return buildFailedResult(
      trace,
      'gateway',
      new GatewayExecutionError('Gateway execution failed', error),
      timeline,
      toIsoTimestamp(Date.now()),
    );
  }

  const finishedStartedAt = Date.now();
  timeline.push({
    stage: 'finished',
    startedAt: toIsoTimestamp(finishedStartedAt),
    durationMs: 0,
    status: 'ok',
  });

  return buildCompletedResult(trace, gatewayResponse, timeline, contextPackage.retrievedAt);
}
