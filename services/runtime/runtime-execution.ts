import { buildContext } from '@/services/runtime/context/context-builder';
import type { BuildContextInput } from '@/services/runtime/context/types';
import { toCompilePromptInput, toGatewayRequest } from '@/services/runtime/pipeline';
import { createRuntimeContextAdapter } from '@/services/runtime/runtime-context-adapter';
import {
  RuntimeExecutionStageError,
  RuntimeExecutionValidationError,
} from '@/services/runtime/runtime-execution-errors';
import {
  serializeRuntimeExecutionReport,
  serializeRuntimeExecutionSnapshot,
} from '@/services/runtime/runtime-execution-serializer';
import type {
  AgentExecution,
  AgentResult,
  RuntimeExecutionAdapters,
  RuntimeExecutionOptions,
  RuntimeExecutionReport,
  RuntimeExecutionRequest,
  RuntimeExecutionSnapshot,
  RuntimeExecutionStageReport,
  RuntimeExecutionValidationView,
  SerializedRuntimeExecutionReport,
  SerializedRuntimeExecutionSnapshot,
  TraceContext,
} from '@/services/runtime/runtime-execution-types';
import { createRuntimeGatewayAdapter } from '@/services/runtime/runtime-gateway-adapter';
import { createRuntimeMemoryAdapter } from '@/services/runtime/runtime-memory-adapter';
import { createRuntimePipelineAdapter } from '@/services/runtime/runtime-pipeline-adapter';
import { createRuntimePromptAdapter } from '@/services/runtime/runtime-prompt-adapter';
import { createRuntimeToolAdapter } from '@/services/runtime/runtime-tool-adapter';
import type { RuntimeToolRequest } from '@/services/runtime/runtime-tool-types';
import type { ContextPackage, GatewayResponse, ISODateTime, ToolCall } from '@/types/runtime/dto';

function toIsoTimestamp(value: number): ISODateTime {
  return new Date(value).toISOString();
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

function extractToolCalls(
  execution: AgentExecution,
  trace: TraceContext,
  contextPackage: ContextPackage,
): RuntimeToolRequest[] {
  const rawToolCalls = execution.input.payload.toolCalls;

  if (!Array.isArray(rawToolCalls) || rawToolCalls.length === 0) {
    return [];
  }

  const enabledTools = new Set(
    contextPackage.employee.tools.filter((tool) => tool.enabled).map((tool) => tool.id),
  );

  return rawToolCalls
    .filter((entry): entry is ToolCall => {
      if (!entry || typeof entry !== 'object') {
        return false;
      }

      const call = entry as ToolCall;
      return typeof call.id === 'string' && typeof call.name === 'string';
    })
    .map((call) => ({
      call,
      scope: execution.scope,
      trace,
      employee: {
        id: contextPackage.employee.id,
        roleTitle: contextPackage.employee.roleTitle,
        permissions: contextPackage.employee.permissions,
        enabledTools: [...enabledTools],
      },
    }));
}

type RuntimeFailureStage = NonNullable<AgentResult['error']>['stage'];

function buildFailedResult(
  trace: TraceContext,
  stage: RuntimeFailureStage,
  error: unknown,
  timeline: AgentResult['timeline'],
  completedAt: ISODateTime,
): AgentResult {
  const message = error instanceof Error ? error.message : 'Runtime execution failed unexpectedly';

  return {
    trace,
    status: 'failed',
    output: null,
    error: {
      code: error instanceof Error ? error.name : 'RuntimeExecutionError',
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
  toolCallCount: number,
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
      toolCallCount,
      gatewayCallCount: 1,
    },
    timeline,
    completedAt,
  };
}

function buildEmptyReport(): RuntimeExecutionReport {
  return {
    runId: null,
    status: null,
    stageCount: 0,
    toolCallCount: 0,
    gatewayCallCount: 0,
    inputTokens: 0,
    outputTokens: 0,
    errorCode: null,
    errorMessage: null,
    errorStage: null,
    stages: [],
    completedAt: null,
  };
}

function buildReportFromResult(
  result: AgentResult,
  stages: RuntimeExecutionStageReport[],
): RuntimeExecutionReport {
  return {
    runId: result.trace.runId,
    status: result.status,
    stageCount: stages.length,
    toolCallCount: result.usage.toolCallCount,
    gatewayCallCount: result.usage.gatewayCallCount,
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    errorCode: result.error?.code ?? null,
    errorMessage: result.error?.message ?? null,
    errorStage: result.error?.stage ?? null,
    stages,
    completedAt: result.completedAt,
  };
}

function createDefaultAdapters(): RuntimeExecutionAdapters {
  return {
    context: createRuntimeContextAdapter(),
    memory: createRuntimeMemoryAdapter(),
    prompt: createRuntimePromptAdapter(),
    pipeline: createRuntimePipelineAdapter(),
    tool: createRuntimeToolAdapter(),
    gateway: createRuntimeGatewayAdapter(),
  };
}

/**
 * Orchestrates full runtime execution through existing adapters only.
 */
export class RuntimeExecution {
  private currentRequest: RuntimeExecutionRequest | null = null;
  private lastResult: AgentResult | null = null;
  private lastReport: RuntimeExecutionReport = buildEmptyReport();
  private snapshot: RuntimeExecutionSnapshot = {
    lastOperation: null,
    lastRunId: null,
    lastStatus: null,
    lastEmployeeId: null,
    stageCount: null,
    updatedAt: new Date().toISOString(),
  };

  constructor(private readonly adapters: RuntimeExecutionAdapters) {}

  async run(request: RuntimeExecutionRequest): Promise<AgentResult> {
    this.currentRequest = request;
    const validation = this.validateRequest(request);

    if (!validation.valid) {
      throw new RuntimeExecutionValidationError(validation.errors.join('; '));
    }

    const { execution } = request;
    const trace = this.adapters.pipeline.resolveTrace(execution);
    const contextInput = toBuildContextInput(execution, trace);
    const timeline: AgentResult['timeline'] = [];
    const stageReports: RuntimeExecutionStageReport[] = [];

    let contextPackage: ContextPackage;

    const contextStartedAt = Date.now();

    try {
      this.adapters.context.build(contextInput);
      contextPackage = buildContext(contextInput);
      const durationMs = Date.now() - contextStartedAt;
      timeline.push({
        stage: 'context.built',
        startedAt: toIsoTimestamp(contextStartedAt),
        durationMs,
        status: 'ok',
      });
      stageReports.push({ stage: 'context', status: 'ok', durationMs });
    } catch (error) {
      const durationMs = Date.now() - contextStartedAt;
      timeline.push({
        stage: 'context.built',
        startedAt: toIsoTimestamp(contextStartedAt),
        durationMs,
        status: 'error',
      });
      stageReports.push({ stage: 'context', status: 'error', durationMs });
      const result = buildFailedResult(
        trace,
        'context',
        error,
        timeline,
        toIsoTimestamp(Date.now()),
      );
      this.finishRun(result, stageReports, execution.employeeId);
      return result;
    }

    const memoryStartedAt = Date.now();

    try {
      this.adapters.memory.read({
        scope: execution.scope,
        trace,
        employeeId: execution.employeeId,
      });
      const durationMs = Date.now() - memoryStartedAt;
      timeline.push({
        stage: 'memory.loaded',
        startedAt: toIsoTimestamp(memoryStartedAt),
        durationMs,
        status: 'ok',
      });
      stageReports.push({ stage: 'memory', status: 'ok', durationMs });
    } catch (error) {
      const durationMs = Date.now() - memoryStartedAt;
      timeline.push({
        stage: 'memory.loaded',
        startedAt: toIsoTimestamp(memoryStartedAt),
        durationMs,
        status: 'error',
      });
      stageReports.push({ stage: 'memory', status: 'error', durationMs });
      const result = buildFailedResult(
        trace,
        'memory',
        error,
        timeline,
        toIsoTimestamp(Date.now()),
      );
      this.finishRun(result, stageReports, execution.employeeId);
      return result;
    }

    let promptRequest;

    const promptStartedAt = Date.now();

    try {
      promptRequest = this.adapters.prompt.compile(toCompilePromptInput(contextPackage));
      const durationMs = Date.now() - promptStartedAt;
      timeline.push({
        stage: 'prompt.compiled',
        startedAt: toIsoTimestamp(promptStartedAt),
        durationMs,
        status: 'ok',
      });
      stageReports.push({ stage: 'prompt', status: 'ok', durationMs });
    } catch (error) {
      const durationMs = Date.now() - promptStartedAt;
      timeline.push({
        stage: 'prompt.compiled',
        startedAt: toIsoTimestamp(promptStartedAt),
        durationMs,
        status: 'error',
      });
      stageReports.push({ stage: 'prompt', status: 'error', durationMs });
      const result = buildFailedResult(
        trace,
        'prompt',
        error,
        timeline,
        toIsoTimestamp(Date.now()),
      );
      this.finishRun(result, stageReports, execution.employeeId);
      return result;
    }

    const pipelineStartedAt = Date.now();

    try {
      const pipelineValidation = this.adapters.pipeline.validate(execution);
      if (!pipelineValidation.valid) {
        throw new RuntimeExecutionStageError(pipelineValidation.errors.join('; '), 'pipeline');
      }

      const durationMs = Date.now() - pipelineStartedAt;
      timeline.push({
        stage: 'pipeline.validated',
        startedAt: toIsoTimestamp(pipelineStartedAt),
        durationMs,
        status: 'ok',
      });
      stageReports.push({ stage: 'pipeline', status: 'ok', durationMs });
    } catch (error) {
      const durationMs = Date.now() - pipelineStartedAt;
      timeline.push({
        stage: 'pipeline.validated',
        startedAt: toIsoTimestamp(pipelineStartedAt),
        durationMs,
        status: 'error',
      });
      stageReports.push({ stage: 'pipeline', status: 'error', durationMs });
      const result = buildFailedResult(
        trace,
        'prompt',
        error,
        timeline,
        toIsoTimestamp(Date.now()),
      );
      this.finishRun(result, stageReports, execution.employeeId);
      return result;
    }

    const toolCalls = extractToolCalls(execution, trace, contextPackage);
    let toolCallCount = 0;
    const toolsStartedAt = Date.now();

    if (toolCalls.length === 0) {
      stageReports.push({ stage: 'tool', status: 'skipped', durationMs: 0 });
    } else {
      try {
        for (const toolRequest of toolCalls) {
          await this.adapters.tool.execute(toolRequest);
          toolCallCount += 1;
        }

        const durationMs = Date.now() - toolsStartedAt;
        timeline.push({
          stage: 'tools.executed',
          startedAt: toIsoTimestamp(toolsStartedAt),
          durationMs,
          status: 'ok',
        });
        stageReports.push({ stage: 'tool', status: 'ok', durationMs });
      } catch (error) {
        const durationMs = Date.now() - toolsStartedAt;
        timeline.push({
          stage: 'tools.executed',
          startedAt: toIsoTimestamp(toolsStartedAt),
          durationMs,
          status: 'error',
        });
        stageReports.push({ stage: 'tool', status: 'error', durationMs });
        const result = buildFailedResult(
          trace,
          'tool',
          error,
          timeline,
          toIsoTimestamp(Date.now()),
        );
        result.usage.toolCallCount = toolCallCount;
        this.finishRun(result, stageReports, execution.employeeId);
        return result;
      }
    }

    const gatewayStartedAt = Date.now();

    try {
      const gatewayResponse = await this.adapters.gateway.complete(
        toGatewayRequest(promptRequest, contextPackage),
      );

      if (gatewayResponse.error) {
        throw new RuntimeExecutionStageError(gatewayResponse.error.message, 'gateway');
      }

      const durationMs = Date.now() - gatewayStartedAt;
      timeline.push({
        stage: 'gateway.completed',
        startedAt: toIsoTimestamp(gatewayStartedAt),
        durationMs,
        status: 'ok',
      });
      stageReports.push({ stage: 'gateway', status: 'ok', durationMs });

      const finishedStartedAt = Date.now();
      timeline.push({
        stage: 'finished',
        startedAt: toIsoTimestamp(finishedStartedAt),
        durationMs: 0,
        status: 'ok',
      });
      stageReports.push({ stage: 'finished', status: 'ok', durationMs: 0 });

      const result = buildCompletedResult(
        trace,
        gatewayResponse,
        timeline,
        toolCallCount,
        contextPackage.retrievedAt,
      );
      this.finishRun(result, stageReports, execution.employeeId);
      return result;
    } catch (error) {
      const durationMs = Date.now() - gatewayStartedAt;
      timeline.push({
        stage: 'gateway.completed',
        startedAt: toIsoTimestamp(gatewayStartedAt),
        durationMs,
        status: 'error',
      });
      stageReports.push({ stage: 'gateway', status: 'error', durationMs });
      const result = buildFailedResult(
        trace,
        'gateway',
        error,
        timeline,
        toIsoTimestamp(Date.now()),
      );
      result.usage.toolCallCount = toolCallCount;
      this.finishRun(result, stageReports, execution.employeeId);
      return result;
    }
  }

  validate(): RuntimeExecutionValidationView {
    if (!this.currentRequest) {
      return { valid: false, errors: ['execution request is required before validate'] };
    }

    const result = this.validateRequest(this.currentRequest);
    this.touch('validate', null, null, this.currentRequest.execution.employeeId ?? null, null);
    return result;
  }

  report(): SerializedRuntimeExecutionReport {
    return serializeRuntimeExecutionReport(this.lastReport);
  }

  serialize(): SerializedRuntimeExecutionSnapshot {
    return serializeRuntimeExecutionSnapshot(this.snapshot);
  }

  reset(): void {
    this.currentRequest = null;
    this.lastResult = null;
    this.lastReport = buildEmptyReport();
    this.adapters.context.reset();
    this.adapters.memory.reset();
    this.adapters.prompt.reset();
    this.adapters.pipeline.reset();
    this.adapters.tool.reset();
    this.adapters.gateway.reset();
    this.snapshot = {
      lastOperation: null,
      lastRunId: null,
      lastStatus: null,
      lastEmployeeId: null,
      stageCount: null,
      updatedAt: new Date().toISOString(),
    };
  }

  getLastResult(): AgentResult | null {
    return this.lastResult;
  }

  private validateRequest(request: RuntimeExecutionRequest): RuntimeExecutionValidationView {
    const errors: string[] = [];

    const pipelineValidation = this.adapters.pipeline.validate(request.execution);
    if (!pipelineValidation.valid) {
      errors.push(...pipelineValidation.errors);
    }

    try {
      const trace = this.adapters.pipeline.resolveTrace(request.execution);
      const contextInput = toBuildContextInput(request.execution, trace);
      const contextValidation = this.adapters.context.validate(contextInput);
      if (!contextValidation.valid) {
        errors.push(...contextValidation.errors);
      }

      const promptValidation = this.adapters.prompt.validate(
        toCompilePromptInput(buildContext(contextInput)),
      );
      if (!promptValidation.valid) {
        errors.push(...promptValidation.errors);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'execution validation failed';
      errors.push(message);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private finishRun(
    result: AgentResult,
    stages: RuntimeExecutionStageReport[],
    employeeId: string,
  ): void {
    this.lastResult = result;
    this.lastReport = buildReportFromResult(result, stages);
    this.touch('run', result.trace.runId, result.status, employeeId, stages.length);
  }

  private touch(
    operation: RuntimeExecutionSnapshot['lastOperation'],
    runId: string | null,
    status: AgentResult['status'] | null,
    employeeId: string | null,
    stageCount: number | null,
  ): void {
    this.snapshot = {
      lastOperation: operation,
      lastRunId: runId,
      lastStatus: status,
      lastEmployeeId: employeeId,
      stageCount,
      updatedAt: new Date().toISOString(),
    };
  }
}

export function createRuntimeExecution(options?: RuntimeExecutionOptions): RuntimeExecution {
  const defaults = createDefaultAdapters();
  const adapters: RuntimeExecutionAdapters = {
    context: options?.adapters?.context ?? defaults.context,
    memory: options?.adapters?.memory ?? defaults.memory,
    prompt: options?.adapters?.prompt ?? defaults.prompt,
    pipeline: options?.adapters?.pipeline ?? defaults.pipeline,
    tool: options?.adapters?.tool ?? defaults.tool,
    gateway: options?.adapters?.gateway ?? defaults.gateway,
  };

  return new RuntimeExecution(adapters);
}

/** Default dev/test singleton. Do not use for concurrent production executions. */
export const runtimeExecution = createRuntimeExecution();
