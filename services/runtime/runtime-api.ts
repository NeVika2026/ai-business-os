import { RuntimeApiConfigurationError } from '@/services/runtime/runtime-api-errors';
import {
  serializeRuntimeApiReport,
  serializeRuntimeApiSnapshot,
  serializeRuntimeApiStatus,
} from '@/services/runtime/runtime-api-serializer';
import type {
  AgentResult,
  RuntimeApiBridgeLike,
  RuntimeApiCapabilities,
  RuntimeApiDependencies,
  RuntimeApiExecuteRequest,
  RuntimeApiOptions,
  RuntimeApiReport,
  RuntimeApiSnapshot,
  RuntimeApiStatusView,
  RuntimeApiValidationView,
  SerializedRuntimeApiReport,
  SerializedRuntimeApiSnapshot,
  SerializedRuntimeApiStatus,
} from '@/services/runtime/runtime-api-types';
import { RUNTIME_API_VERSION } from '@/services/runtime/runtime-api-types';
import type { RuntimeBridge } from '@/services/runtime/runtime-bridge';

function buildEmptyReport(): RuntimeApiReport {
  return {
    version: RUNTIME_API_VERSION,
    bridgeMode: 'idle',
    agentStatus: null,
    nextRecommendedAction: null,
    executionRunId: null,
    executionStatus: null,
    validationValid: null,
    validationReadyCount: null,
    facadeMode: 'idle',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Stable public runtime API. Aggregates bridge, execution, validator, and facade.
 */
export class RuntimeApi {
  private lastReport: RuntimeApiReport = buildEmptyReport();
  private lastValidation: RuntimeApiValidationView = { valid: false, errors: [] };
  private lastValidationReadyCount: number | null = null;
  private snapshot: RuntimeApiSnapshot = {
    lastOperation: null,
    lastRunId: null,
    lastStatus: null,
    updatedAt: new Date().toISOString(),
  };

  constructor(private readonly dependencies: RuntimeApiDependencies) {}

  async execute(request: RuntimeApiExecuteRequest): Promise<AgentResult> {
    const result = await this.dependencies.bridge.runAgent(request.execution, {
      useFullExecution: request.useFullExecution,
      useLegacyPipeline: request.useLegacyPipeline,
    });

    this.lastReport = this.buildReport(result);
    this.touch('execute', result.trace.runId, result.status);
    return result;
  }

  validate(): RuntimeApiValidationView {
    const validationReport = this.dependencies.validator.validateRuntime();
    const serialized = this.dependencies.validator.report();

    this.lastValidation = {
      valid: validationReport.valid,
      errors: [...serialized.errors],
    };
    this.lastValidationReadyCount = validationReport.readyCount;

    this.lastReport = {
      ...this.buildReport(null),
      validationValid: validationReport.valid,
      validationReadyCount: validationReport.readyCount,
    };

    this.touch('validate', null, null);
    return this.lastValidation;
  }

  status(): SerializedRuntimeApiStatus {
    return serializeRuntimeApiStatus(this.readStatus());
  }

  report(): SerializedRuntimeApiReport {
    return serializeRuntimeApiReport(this.buildReport(null));
  }

  serialize(): SerializedRuntimeApiSnapshot {
    const bridgeStatus = this.dependencies.bridge.readStatus();
    const executionSnapshot = this.dependencies.execution.serialize();

    return serializeRuntimeApiSnapshot(this.snapshot, {
      version: RUNTIME_API_VERSION,
      bridgeMode: bridgeStatus.mode,
      agentStatus: bridgeStatus.agentStatus,
      executionRunId: executionSnapshot.lastRunId,
      executionStatus: executionSnapshot.lastStatus,
      validationValid: this.lastValidation.valid,
      facadeMode: bridgeStatus.facadeStatus.mode,
    });
  }

  reset(): void {
    this.dependencies.bridge.resetRuntime();
    this.dependencies.validator.reset();
    this.lastReport = buildEmptyReport();
    this.lastValidation = { valid: false, errors: [] };
    this.lastValidationReadyCount = null;
    this.snapshot = {
      lastOperation: null,
      lastRunId: null,
      lastStatus: null,
      updatedAt: new Date().toISOString(),
    };
  }

  version(): string {
    return RUNTIME_API_VERSION;
  }

  capabilities(): RuntimeApiCapabilities {
    return {
      version: RUNTIME_API_VERSION,
      fullExecution: this.dependencies.bridge.supportsFullExecution(),
      legacyPipeline: this.dependencies.bridge.supportsLegacyPipeline(),
      orchestration: this.dependencies.bridge.supportsOrchestration(),
      roadmap: true,
      sprint: true,
      validation: true,
      components: [
        'bridge',
        'execution',
        'validator',
        'facade',
        'context',
        'memory',
        'prompt',
        'pipeline',
        'tool',
        'gateway',
      ],
    };
  }

  getBridge(): RuntimeApiBridgeLike {
    return this.dependencies.bridge;
  }

  getExecution(): RuntimeApiDependencies['execution'] {
    return this.dependencies.execution;
  }

  getFacade(): RuntimeApiDependencies['facade'] {
    return this.dependencies.facade;
  }

  private readStatus(): RuntimeApiStatusView {
    const bridgeStatus = this.dependencies.bridge.readStatus();
    const executionSnapshot = this.dependencies.execution.serialize();
    const facadeStatus = bridgeStatus.facadeStatus;

    return {
      bridgeMode: bridgeStatus.mode,
      agentStatus: bridgeStatus.agentStatus,
      facadeMode: facadeStatus.mode,
      facadeCoordinatorStatus: facadeStatus.coordinatorStatus,
      executionRunId: executionSnapshot.lastRunId,
      executionStatus: executionSnapshot.lastStatus,
      validationValid: this.lastValidation.valid,
      updatedAt: new Date().toISOString(),
    };
  }

  private buildReport(agentResult: AgentResult | null): RuntimeApiReport {
    const bridgeReport = this.dependencies.bridge.readReport();
    const executionReport = this.dependencies.execution.report();

    return {
      version: RUNTIME_API_VERSION,
      bridgeMode: bridgeReport.mode,
      agentStatus: agentResult?.status ?? bridgeReport.agentResult?.status ?? null,
      nextRecommendedAction: bridgeReport.nextRecommendedAction,
      executionRunId: executionReport.runId,
      executionStatus: executionReport.status,
      validationValid: this.lastValidation.valid,
      validationReadyCount: this.lastValidationReadyCount,
      facadeMode: bridgeReport.facadeReport.mode,
      updatedAt: new Date().toISOString(),
    };
  }

  private touch(
    operation: RuntimeApiSnapshot['lastOperation'],
    runId: string | null,
    status: AgentResult['status'] | null,
  ): void {
    this.snapshot = {
      lastOperation: operation,
      lastRunId: runId,
      lastStatus: status,
      updatedAt: new Date().toISOString(),
    };
  }
}

export function createRuntimeApiFromBridge(bridge: RuntimeBridge): RuntimeApi {
  const bridgeLike: RuntimeApiBridgeLike = {
    runAgent: (execution, options) => bridge.runAgent(execution, options),
    readStatus: () => bridge.readStatus(),
    readReport: () => bridge.readReport(),
    readSnapshot: () => ({
      mode: bridge.readSnapshot().mode,
      updatedAt: bridge.readSnapshot().updatedAt,
    }),
    resetRuntime: () => bridge.resetRuntime(),
    getExecution: () => bridge.getExecution(),
    getValidator: () => bridge.getValidator(),
    getFacade: () => bridge.getFacade(),
    supportsFullExecution: () => bridge.supportsFullExecution(),
    supportsLegacyPipeline: () => bridge.supportsLegacyPipeline(),
    supportsOrchestration: () => bridge.supportsOrchestration(),
  };

  return new RuntimeApi({
    bridge: bridgeLike,
    execution: bridge.getExecution(),
    validator: bridge.getValidator(),
    facade: bridge.getFacade(),
  });
}

export function createRuntimeApi(options?: RuntimeApiOptions): RuntimeApi {
  if (options?.bridge) {
    return new RuntimeApi({
      bridge: options.bridge,
      execution: options.execution ?? options.bridge.getExecution(),
      validator: options.validator ?? options.bridge.getValidator(),
      facade: options.facade ?? options.bridge.getFacade(),
    });
  }

  throw new RuntimeApiConfigurationError(
    'bridge is required. Use createRuntimeBridge().getApi() or pass bridge in options.',
  );
}
