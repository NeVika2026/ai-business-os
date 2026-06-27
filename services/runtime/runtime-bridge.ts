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

/**
 * Bridge between legacy agent runtime entry and orchestration facade.
 * Default agent path is orchestration-only (no Gateway, Tool Executor, or Memory writes).
 */
export class RuntimeBridge {
  private mode: RuntimeBridgeMode = 'idle';
  private lastAgentResult: AgentResult | null = null;

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
  ) {}

  async executeAgent(
    execution: AgentExecution,
    options?: RuntimeBridgeExecuteAgentOptions,
  ): Promise<AgentResult> {
    const validation = this.pipelineAdapter.validate(execution);
    if (!validation.valid) {
      throw new RuntimeBridgeValidationError(validation.errors.join('; '));
    }

    this.mode = 'agent';
    const useLegacy = options?.useLegacyPipeline ?? !this.orchestrationOnly;

    const result = useLegacy
      ? await this.legacyExecute(execution)
      : await this.executeAgentOrchestration(execution);

    this.lastAgentResult = result;
    this.persist();

    return result;
  }

  executeRoadmap(input: RuntimeBridgeExecuteRoadmapInput): RuntimeBridgeExecuteRoadmapResult {
    this.mode = 'roadmap';
    const result = this.facade.executeRoadmap(input);
    this.persist();
    return result;
  }

  executeSprint(input: RuntimeBridgeExecuteSprintInput): RuntimeBridgeExecuteSprintResult {
    this.mode = 'sprint';
    const result = this.facade.executeSprint(input);
    this.persist();
    return result;
  }

  status(): RuntimeBridgeStatusView {
    return {
      mode: this.mode,
      agentStatus: this.lastAgentResult?.status ?? null,
      facadeStatus: this.facade.status(),
    };
  }

  report(): RuntimeBridgeReport {
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

  reset(): void {
    this.mode = 'idle';
    this.lastAgentResult = null;
    this.facade.reset();
    this.gatewayAdapter.reset();
    this.toolAdapter.reset();
    this.promptAdapter.reset();
    this.memoryAdapter.reset();
    this.contextAdapter.reset();
    this.pipelineAdapter.reset();
    this.provider.reset?.();
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
  const contextAdapter = options?.contextAdapter ?? createRuntimeContextAdapter();
  const pipelineAdapter = options?.pipelineAdapter ?? createRuntimePipelineAdapter();
  const legacyExecute =
    options?.legacyExecute ?? ((execution: AgentExecution) => pipelineAdapter.execute(execution));

  return new RuntimeBridge(
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
  );
}

/** Default dev/test singleton. Do not use for concurrent production executions. */
export const runtimeBridge = createRuntimeBridge();

export {
  InMemoryRuntimeBridgeProvider as MockRuntimeBridgeProvider,
  defaultBridgeProvider as mockRuntimeBridgeProvider,
};
