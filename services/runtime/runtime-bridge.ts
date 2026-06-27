import {
  buildRuntimeBridgeReport,
  serializeRuntimeBridgeSnapshot,
} from '@/services/runtime/runtime-bridge-serializer';
import { RuntimeBridgeValidationError } from '@/services/runtime/runtime-bridge-errors';
import type {
  RuntimeBridgeExecuteAgentOptions,
  RuntimeBridgeExecuteRoadmapInput,
  RuntimeBridgeExecuteRoadmapResult,
  RuntimeBridgeExecuteSprintInput,
  RuntimeBridgeExecuteSprintResult,
  RuntimeBridgeMode,
  RuntimeBridgeOptions,
  RuntimeBridgeProvider,
  RuntimeBridgeRecord,
  RuntimeBridgeReport,
  RuntimeBridgeStatusView,
  SerializedRuntimeBridgeSnapshot,
} from '@/services/runtime/runtime-bridge-types';
import { DEFAULT_RUNTIME_BRIDGE_INSTANCE_ID } from '@/services/runtime/runtime-bridge-types';
import { createRuntimeApiFromBridge, type RuntimeApi } from '@/services/runtime/runtime-api';
import {
  createRuntimeGatewayAdapter,
  type RuntimeGatewayAdapter,
} from '@/services/runtime/runtime-gateway-adapter';
import {
  createRuntimeToolAdapter,
  type RuntimeToolAdapter,
} from '@/services/runtime/runtime-tool-adapter';
import {
  createRuntimePromptAdapter,
  type RuntimePromptAdapter,
} from '@/services/runtime/runtime-prompt-adapter';
import {
  createRuntimeMemoryServiceAdapter,
  type RuntimeMemoryServiceAdapter,
} from '@/services/runtime/runtime-memory-service-adapter';
import {
  createRuntimeMemoryAdapter,
  type RuntimeMemoryAdapter,
} from '@/services/runtime/runtime-memory-adapter';
import {
  createRuntimeContextAdapter,
  type RuntimeContextAdapter,
} from '@/services/runtime/runtime-context-adapter';
import {
  createRuntimePipelineAdapter,
  type RuntimePipelineAdapter,
} from '@/services/runtime/runtime-pipeline-adapter';
import {
  createRuntimeExecution,
  type RuntimeExecution,
} from '@/services/runtime/runtime-execution';
import {
  createRuntimeKnowledgeAdapter,
  type RuntimeKnowledgeAdapter,
} from '@/services/runtime/runtime-knowledge-adapter';
import {
  createRuntimeKnowledgeContext,
  type RuntimeKnowledgeContext,
} from '@/services/runtime/runtime-knowledge-context';
import {
  createRuntimeMemoryContext,
  type RuntimeMemoryContext,
} from '@/services/runtime/runtime-memory-context';
import { createRuntimeObserver, type RuntimeObserver } from '@/services/runtime/runtime-observer';
import type { RuntimeObserverEmitInput } from '@/services/runtime/runtime-observer-types';
import {
  createRuntimeValidator,
  type RuntimeValidator,
} from '@/services/runtime/runtime-validator';
import {
  createRuntime as createOrchestratorRuntime,
  Runtime as OrchestratorRuntime,
} from '@/services/runtime/runtime/runtime';
import type { RuntimeExecutionContext } from '@/services/runtime/runtime/runtime-types';
import type { AgentExecution, AgentResult, ISODateTime, TraceContext } from '@/types/runtime/dto';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateBridgeInstanceId(instanceId: string): void {
  if (!isNonEmptyString(instanceId)) {
    throw new RuntimeBridgeValidationError('instanceId is required');
  }
}

function toRuntimeExecutionContext(
  execution: AgentExecution,
  trace: TraceContext,
): RuntimeExecutionContext {
  return {
    organizationId: execution.scope.organizationId,
    employeeId: execution.employeeId,
    runId: trace.runId,
    traceId: trace.traceId,
    startedAt: new Date().toISOString(),
  };
}

function buildOrchestrationAgentResult(
  trace: TraceContext,
  runResult: {
    finished: boolean;
    executedTasks: string[];
    duration: number;
    finalStatus: string;
    stopReason: string;
  },
  completedAt: ISODateTime,
): AgentResult {
  const startedAt = completedAt;

  return {
    trace,
    status: runResult.finished ? 'completed' : 'failed',
    output: {
      orchestration: true,
      executedTasks: runResult.executedTasks,
      finalStatus: runResult.finalStatus,
      stopReason: runResult.stopReason,
      durationMs: runResult.duration,
    },
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      toolCallCount: 0,
      gatewayCallCount: 0,
    },
    timeline: [
      {
        stage: 'orchestration',
        startedAt,
        durationMs: runResult.duration,
        status: runResult.finished ? 'ok' : 'error',
      },
    ],
    completedAt,
  };
}

class InMemoryRuntimeBridgeProvider implements RuntimeBridgeProvider {
  private readonly records = new Map<string, RuntimeBridgeRecord>();

  save(instanceId: string, record: RuntimeBridgeRecord): void {
    this.records.set(instanceId, record);
  }

  update(instanceId: string, record: RuntimeBridgeRecord): void {
    this.records.set(instanceId, record);
  }

  get(instanceId: string): RuntimeBridgeRecord | null {
    return this.records.get(instanceId) ?? null;
  }

  reset(): void {
    this.records.clear();
  }
}

const defaultBridgeProvider = new InMemoryRuntimeBridgeProvider();

function resolveRunId(execution: AgentExecution): string | null {
  try {
    return execution.input.payload.trace &&
      typeof execution.input.payload.trace === 'object' &&
      typeof (execution.input.payload.trace as { runId?: unknown }).runId === 'string'
      ? ((execution.input.payload.trace as { runId: string }).runId ?? null)
      : null;
  } catch {
    return null;
  }
}

function wireGatewayObserver(adapter: RuntimeGatewayAdapter, observer: RuntimeObserver): void {
  const originalComplete = adapter.complete.bind(adapter);

  adapter.complete = async (request) => {
    const startedAt = Date.now();

    try {
      const response = await originalComplete(request);
      observer.emit({
        event: 'gateway.called',
        runId: request.trace.runId,
        duration: Date.now() - startedAt,
        payload: {
          providerCode: request.providerCode,
          modelCode: request.modelCode,
          hasError: response.error !== undefined,
        },
      });
      return response;
    } catch (error) {
      observer.emit({
        event: 'gateway.called',
        runId: request.trace.runId,
        duration: Date.now() - startedAt,
        payload: {
          providerCode: request.providerCode,
          modelCode: request.modelCode,
          failed: true,
          message: error instanceof Error ? error.message : 'gateway call failed',
        },
      });
      throw error;
    }
  };
}

function wireToolObserver(adapter: RuntimeToolAdapter, observer: RuntimeObserver): void {
  const originalExecute = adapter.execute.bind(adapter);

  adapter.execute = async (toolRequest) => {
    const startedAt = Date.now();

    try {
      const result = await originalExecute(toolRequest);
      observer.emit({
        event: 'tool.called',
        runId: toolRequest.trace.runId,
        duration: Date.now() - startedAt,
        payload: {
          toolId: toolRequest.call.name,
          success: result.success,
        },
      });
      return result;
    } catch (error) {
      observer.emit({
        event: 'tool.called',
        runId: toolRequest.trace.runId,
        duration: Date.now() - startedAt,
        payload: {
          toolId: toolRequest.call.name,
          success: false,
          message: error instanceof Error ? error.message : 'tool execution failed',
        },
      });
      throw error;
    }
  };
}

function wireMemoryObserver(adapter: RuntimeMemoryAdapter, observer: RuntimeObserver): void {
  const originalRead = adapter.read.bind(adapter);
  const originalWrite = adapter.write.bind(adapter);

  adapter.read = (request) => {
    const startedAt = Date.now();
    const result = originalRead(request);
    observer.emit({
      event: 'memory.read',
      runId: request.trace.runId,
      duration: Date.now() - startedAt,
      payload: {
        organizationId: request.scope.organizationId,
        employeeId: request.employeeId,
        entryCount: result.entryCount,
      },
    });
    return result;
  };

  adapter.write = (memory) => {
    const startedAt = Date.now();
    const result = originalWrite(memory);
    observer.emit({
      event: 'memory.write',
      duration: Date.now() - startedAt,
      payload: {
        organizationId: result.organizationId,
        employeeId: result.employeeId,
        memoryId: result.id,
        kind: result.kind,
      },
    });
    return result;
  };
}

function wirePromptObserver(adapter: RuntimePromptAdapter, observer: RuntimeObserver): void {
  const originalCompile = adapter.compile.bind(adapter);

  adapter.compile = (input) => {
    const startedAt = Date.now();
    const result = originalCompile(input);
    observer.emit({
      event: 'prompt.compiled',
      duration: Date.now() - startedAt,
      payload: {
        messageCount: result.messages.length,
        model: result.model ?? null,
      },
    });
    return result;
  };
}

function wirePipelineObserver(adapter: RuntimePipelineAdapter, observer: RuntimeObserver): void {
  const originalExecute = adapter.execute.bind(adapter);

  adapter.execute = async (execution) => {
    const runId = resolveRunId(execution);
    const startedAt = Date.now();

    observer.emit({
      event: 'pipeline.started',
      runId: runId ?? undefined,
      payload: {
        employeeId: execution.employeeId,
        action: execution.input.action,
      },
    });

    try {
      const result = await originalExecute(execution);
      observer.emit({
        event: 'pipeline.finished',
        runId: result.trace.runId,
        duration: Date.now() - startedAt,
        payload: {
          status: result.status,
          employeeId: execution.employeeId,
        },
      });
      return result;
    } catch (error) {
      observer.emit({
        event: 'pipeline.finished',
        runId: runId ?? undefined,
        duration: Date.now() - startedAt,
        payload: {
          status: 'failed',
          employeeId: execution.employeeId,
          message: error instanceof Error ? error.message : 'pipeline execution failed',
        },
      });
      throw error;
    }
  };
}

function wireRuntimeObservers(input: {
  observer: RuntimeObserver;
  gatewayAdapter: RuntimeGatewayAdapter;
  toolAdapter: RuntimeToolAdapter;
  memoryAdapter: RuntimeMemoryAdapter;
  promptAdapter: RuntimePromptAdapter;
  pipelineAdapter: RuntimePipelineAdapter;
}): void {
  wireGatewayObserver(input.gatewayAdapter, input.observer);
  wireToolObserver(input.toolAdapter, input.observer);
  wireMemoryObserver(input.memoryAdapter, input.observer);
  wirePromptObserver(input.promptAdapter, input.observer);
  wirePipelineObserver(input.pipelineAdapter, input.observer);
}

function emitRuntimeObserverEvent(
  observer: RuntimeObserver,
  input: RuntimeObserverEmitInput,
): void {
  try {
    observer.emit(input);
  } catch {
    // Observer failures must not affect runtime execution.
  }
}

/**
 * Bridge between legacy agent runtime entry and orchestration facade.
 * Public operations are routed through RuntimeApi.
 */
export class RuntimeBridge {
  private mode: RuntimeBridgeMode = 'idle';
  private lastAgentResult: AgentResult | null = null;
  private runtimeValidator: RuntimeValidator | null = null;
  private runtimeApi: RuntimeApi | null = null;

  constructor(
    private readonly facade: OrchestratorRuntime,
    private readonly provider: RuntimeBridgeProvider,
    private readonly instanceId: string,
    private readonly legacyExecute: (execution: AgentExecution) => Promise<AgentResult>,
    private readonly orchestrationOnly: boolean,
    private readonly gatewayAdapter: RuntimeGatewayAdapter,
    private readonly toolAdapter: RuntimeToolAdapter,
    private readonly promptAdapter: RuntimePromptAdapter,
    private readonly memoryAdapter: RuntimeMemoryAdapter,
    private readonly contextAdapter: RuntimeContextAdapter,
    private readonly pipelineAdapter: RuntimePipelineAdapter,
    private readonly execution: RuntimeExecution,
    private readonly observer: RuntimeObserver,
    private readonly knowledgeAdapter: RuntimeKnowledgeAdapter,
    private readonly knowledgeContext: RuntimeKnowledgeContext,
    private readonly memoryServiceAdapter: RuntimeMemoryServiceAdapter,
    private readonly memoryContext: RuntimeMemoryContext,
    validator?: RuntimeValidator,
    api?: RuntimeApi,
  ) {
    this.runtimeValidator = validator ?? null;
    this.runtimeApi = api ?? null;
  }

  async executeAgent(
    execution: AgentExecution,
    options?: RuntimeBridgeExecuteAgentOptions,
  ): Promise<AgentResult> {
    return this.getApi().execute({
      execution,
      useFullExecution: options?.useFullExecution,
      useLegacyPipeline: options?.useLegacyPipeline,
    });
  }

  async runAgent(
    execution: AgentExecution,
    options?: RuntimeBridgeExecuteAgentOptions,
  ): Promise<AgentResult> {
    const validation = this.pipelineAdapter.validate(execution);
    if (!validation.valid) {
      throw new RuntimeBridgeValidationError(validation.errors.join('; '));
    }

    this.mode = 'agent';
    const runId = resolveRunId(execution);
    const startedAt = Date.now();
    emitRuntimeObserverEvent(this.observer, {
      event: 'runtime.started',
      runId: runId ?? undefined,
      payload: {
        employeeId: execution.employeeId,
        action: execution.input.action,
        useFullExecution: options?.useFullExecution ?? false,
        useLegacyPipeline: options?.useLegacyPipeline ?? !this.orchestrationOnly,
      },
    });

    try {
      if (options?.useFullExecution) {
        const result = await this.execution.run({ execution });
        this.lastAgentResult = result;
        this.persist();
        emitRuntimeObserverEvent(this.observer, {
          event: result.status === 'failed' ? 'runtime.failed' : 'runtime.finished',
          runId: result.trace.runId,
          duration: Date.now() - startedAt,
          payload: {
            status: result.status,
            errorStage: result.error?.stage ?? null,
          },
        });
        return result;
      }

      const useLegacy = options?.useLegacyPipeline ?? !this.orchestrationOnly;

      const result = useLegacy
        ? await this.legacyExecute(execution)
        : await this.executeAgentOrchestration(execution);

      this.lastAgentResult = result;
      this.persist();
      emitRuntimeObserverEvent(this.observer, {
        event: result.status === 'failed' ? 'runtime.failed' : 'runtime.finished',
        runId: result.trace.runId,
        duration: Date.now() - startedAt,
        payload: {
          status: result.status,
          errorStage: result.error?.stage ?? null,
        },
      });

      return result;
    } catch (error) {
      emitRuntimeObserverEvent(this.observer, {
        event: 'runtime.failed',
        runId: runId ?? undefined,
        duration: Date.now() - startedAt,
        payload: {
          message: error instanceof Error ? error.message : 'runtime execution failed',
        },
      });
      throw error;
    }
  }

  executeRoadmap(input: RuntimeBridgeExecuteRoadmapInput): RuntimeBridgeExecuteRoadmapResult {
    this.mode = 'roadmap';
    const startedAt = Date.now();
    emitRuntimeObserverEvent(this.observer, {
      event: 'roadmap.started',
      runId: input.runtimeContext.runId,
      payload: {
        roadmapId: input.roadmap.id,
        sprintCount: input.roadmap.sprints.length,
      },
    });

    const result = this.facade.executeRoadmap(input);
    this.persist();

    emitRuntimeObserverEvent(this.observer, {
      event: 'roadmap.finished',
      runId: input.runtimeContext.runId,
      duration: Date.now() - startedAt,
      payload: {
        roadmapId: result.roadmapId,
        sessionStatus: result.sessionStatus,
        sprintsExecuted: result.sprintsExecuted,
        stopped: result.stopped,
      },
    });

    return result;
  }

  executeSprint(input: RuntimeBridgeExecuteSprintInput): RuntimeBridgeExecuteSprintResult {
    this.mode = 'sprint';
    const startedAt = Date.now();
    emitRuntimeObserverEvent(this.observer, {
      event: 'sprint.started',
      runId: input.runtimeContext.runId,
      payload: {
        sprintId: input.sprint.id,
        sprintCode: input.sprint.code,
      },
    });

    const result = this.facade.executeSprint(input);
    this.persist();

    emitRuntimeObserverEvent(this.observer, {
      event: 'sprint.finished',
      runId: input.runtimeContext.runId,
      duration: Date.now() - startedAt,
      payload: {
        sprintId: result.sprintId,
        phase: result.phase,
      },
    });

    return result;
  }

  status(): RuntimeBridgeStatusView {
    const apiStatus = this.getApi().status();

    return {
      mode: apiStatus.bridgeMode as RuntimeBridgeMode,
      agentStatus: apiStatus.agentStatus,
      facadeStatus: this.facade.status(),
    };
  }

  readStatus(): RuntimeBridgeStatusView {
    return {
      mode: this.mode,
      agentStatus: this.lastAgentResult?.status ?? null,
      facadeStatus: this.facade.status(),
    };
  }

  report(): RuntimeBridgeReport {
    const apiReport = this.getApi().report();

    return buildRuntimeBridgeReport({
      mode: apiReport.bridgeMode as RuntimeBridgeMode,
      agentResult: this.lastAgentResult,
      facadeReport: this.facade.report(),
    });
  }

  readReport(): RuntimeBridgeReport {
    return buildRuntimeBridgeReport({
      mode: this.mode,
      agentResult: this.lastAgentResult,
      facadeReport: this.facade.report(),
    });
  }

  serialize(): SerializedRuntimeBridgeSnapshot {
    return serializeRuntimeBridgeSnapshot({
      mode: this.mode,
      agentResult: this.lastAgentResult,
      facade: this.facade.serialize(),
      updatedAt: new Date().toISOString(),
    });
  }

  readSnapshot(): SerializedRuntimeBridgeSnapshot {
    return this.serialize();
  }

  reset(): void {
    this.getApi().reset();
  }

  resetRuntime(): void {
    this.mode = 'idle';
    this.lastAgentResult = null;
    this.facade.reset();
    this.execution.reset();
    this.runtimeValidator?.reset();
    this.provider.reset?.();
    this.observer.reset();
    this.knowledgeAdapter.reset();
    this.knowledgeContext.reset();
    this.memoryServiceAdapter.reset();
    this.memoryContext.reset();
  }

  supportsFullExecution(): boolean {
    return true;
  }

  supportsLegacyPipeline(): boolean {
    return true;
  }

  supportsOrchestration(): boolean {
    return true;
  }

  getApi(): RuntimeApi {
    if (!this.runtimeApi) {
      this.runtimeApi = createRuntimeApiFromBridge(this);
    }

    return this.runtimeApi;
  }

  getFacade(): OrchestratorRuntime {
    return this.facade;
  }

  getGatewayAdapter(): RuntimeGatewayAdapter {
    return this.gatewayAdapter;
  }

  getToolAdapter(): RuntimeToolAdapter {
    return this.toolAdapter;
  }

  getPromptAdapter(): RuntimePromptAdapter {
    return this.promptAdapter;
  }

  getMemoryAdapter(): RuntimeMemoryAdapter {
    return this.memoryAdapter;
  }

  getContextAdapter(): RuntimeContextAdapter {
    return this.contextAdapter;
  }

  getPipelineAdapter(): RuntimePipelineAdapter {
    return this.pipelineAdapter;
  }

  getExecution(): RuntimeExecution {
    return this.execution;
  }

  getValidator(): RuntimeValidator {
    if (!this.runtimeValidator) {
      this.runtimeValidator = createRuntimeValidator({ bridge: this });
    }

    return this.runtimeValidator;
  }

  getObserver(): RuntimeObserver {
    return this.observer;
  }

  getKnowledgeAdapter(): RuntimeKnowledgeAdapter {
    return this.knowledgeAdapter;
  }

  getKnowledgeContext(): RuntimeKnowledgeContext {
    return this.knowledgeContext;
  }

  getMemoryServiceAdapter(): RuntimeMemoryServiceAdapter {
    return this.memoryServiceAdapter;
  }

  getMemoryContext(): RuntimeMemoryContext {
    return this.memoryContext;
  }

  private async executeAgentOrchestration(execution: AgentExecution): Promise<AgentResult> {
    const trace = this.pipelineAdapter.resolveTrace(execution);
    const context = toRuntimeExecutionContext(execution, trace);
    const runner = this.facade.getRunner();

    runner.reset();
    runner.start(context);
    const runResult = runner.run();

    return buildOrchestrationAgentResult(trace, runResult, new Date().toISOString());
  }

  private persist(): void {
    const record: RuntimeBridgeRecord = {
      mode: this.mode,
      lastAgentResult: this.lastAgentResult,
      updatedAt: new Date().toISOString(),
    };

    const existing = this.provider.get(this.instanceId);

    if (existing) {
      this.provider.update(this.instanceId, record);
    } else {
      this.provider.save(this.instanceId, record);
    }
  }
}

export function createRuntimeBridge(options?: RuntimeBridgeOptions): RuntimeBridge {
  const instanceId = options?.instanceId ?? DEFAULT_RUNTIME_BRIDGE_INSTANCE_ID;
  validateBridgeInstanceId(instanceId);

  const facade = options?.facade ?? createOrchestratorRuntime(options?.facadeOptions);
  const provider = options?.provider ?? defaultBridgeProvider;
  const orchestrationOnly = options?.orchestrationOnly ?? true;
  const gatewayAdapter = options?.gatewayAdapter ?? createRuntimeGatewayAdapter();
  const toolAdapter = options?.toolAdapter ?? createRuntimeToolAdapter();
  const promptAdapter = options?.promptAdapter ?? createRuntimePromptAdapter();
  const memoryAdapter = options?.memoryAdapter ?? createRuntimeMemoryAdapter();
  const knowledgeAdapter =
    options?.knowledgeAdapter ??
    createRuntimeKnowledgeAdapter({ instanceId: `${instanceId}-knowledge` });
  const knowledgeContext =
    options?.knowledgeContext ??
    createRuntimeKnowledgeContext({
      instanceId: `${instanceId}-knowledge-context`,
      knowledgeAdapter,
      enabled: options?.knowledgeInjectionEnabled ?? false,
    });
  const memoryServiceAdapter =
    options?.memoryServiceAdapter ??
    createRuntimeMemoryServiceAdapter({ instanceId: `${instanceId}-memory-service` });
  const memoryContext =
    options?.memoryContext ??
    createRuntimeMemoryContext({
      instanceId: `${instanceId}-memory-context`,
      memoryServiceAdapter,
      enabled: options?.memoryInjectionEnabled ?? false,
    });
  const contextAdapter =
    options?.contextAdapter ??
    createRuntimeContextAdapter({
      knowledgeContext,
      knowledgeInjectionEnabled: options?.knowledgeInjectionEnabled ?? false,
      memoryContext,
      memoryInjectionEnabled: options?.memoryInjectionEnabled ?? false,
    });
  const pipelineAdapter = options?.pipelineAdapter ?? createRuntimePipelineAdapter();
  const observer =
    options?.observer ?? createRuntimeObserver({ instanceId: `${instanceId}-observer` });

  wireRuntimeObservers({
    observer,
    gatewayAdapter,
    toolAdapter,
    memoryAdapter,
    promptAdapter,
    pipelineAdapter,
  });

  const legacyExecute =
    options?.legacyExecute ?? ((execution: AgentExecution) => pipelineAdapter.execute(execution));
  const execution =
    options?.execution ??
    createRuntimeExecution({
      adapters: {
        context: contextAdapter,
        memory: memoryAdapter,
        prompt: promptAdapter,
        pipeline: pipelineAdapter,
        tool: toolAdapter,
        gateway: gatewayAdapter,
      },
    });

  const bridge = new RuntimeBridge(
    facade,
    provider,
    instanceId,
    legacyExecute,
    orchestrationOnly,
    gatewayAdapter,
    toolAdapter,
    promptAdapter,
    memoryAdapter,
    contextAdapter,
    pipelineAdapter,
    execution,
    observer,
    knowledgeAdapter,
    knowledgeContext,
    memoryServiceAdapter,
    memoryContext,
    options?.validator,
    options?.api,
  );

  if (!options?.api) {
    bridge.getApi();
  }

  return bridge;
}

/** Default dev/test singleton. Do not use for concurrent production executions. */
export const runtimeBridge = createRuntimeBridge();

export {
  InMemoryRuntimeBridgeProvider as MockRuntimeBridgeProvider,
  defaultBridgeProvider as mockRuntimeBridgeProvider,
};
