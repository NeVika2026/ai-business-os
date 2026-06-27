import { aiGateway } from '@/services/runtime/gateway/ai-gateway';
import { hasModel } from '@/services/runtime/gateway/capabilities';
import { getCapabilitiesRegistry } from '@/services/runtime/gateway/capabilities';
import {
  InvalidGatewayRequestError,
  ModelNotSupportedError,
  ProviderUnavailableError,
} from '@/services/runtime/gateway/errors';
import { checkAllProvidersHealth } from '@/services/runtime/gateway/health';
import { getAdapter } from '@/services/runtime/gateway/registry';
import { isGatewayMockMode } from '@/services/runtime/gateway/adapter-factory';
import { resolveProviderCredentials } from '@/services/runtime/gateway/credential-resolver';
import type {
  NormalizedProviderRequest,
  ProviderCode,
  StreamChunk,
} from '@/services/runtime/gateway/types';
import {
  RuntimeGatewayNotSupportedError,
  RuntimeGatewayValidationError,
} from '@/services/runtime/runtime-gateway-errors';
import { serializeRuntimeGatewaySnapshot } from '@/services/runtime/runtime-gateway-serializer';
import type {
  RuntimeGatewayAdapterOptions,
  RuntimeGatewayCompleteRequest,
  RuntimeGatewayCompleteResponse,
  RuntimeGatewayDependencies,
  RuntimeGatewayEmbeddingsRequest,
  RuntimeGatewayEmbeddingsResponse,
  RuntimeGatewayHealthResponse,
  RuntimeGatewayModelsResponse,
  RuntimeGatewaySnapshot,
  RuntimeGatewayStreamChunk,
  RuntimeGatewayStreamRequest,
  SerializedRuntimeGatewaySnapshot,
} from '@/services/runtime/runtime-gateway-types';
import { buildRuntimeModelId } from '@/services/runtime/runtime-gateway-types';
import type { GatewayRequest } from '@/types/runtime/dto';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateGatewayRequest(request: GatewayRequest): void {
  if (!request || typeof request !== 'object') {
    throw new RuntimeGatewayValidationError('request must be an object');
  }

  if (!isNonEmptyString(request.scope?.organizationId)) {
    throw new RuntimeGatewayValidationError('scope.organizationId is required');
  }

  if (!isNonEmptyString(request.trace?.runId)) {
    throw new RuntimeGatewayValidationError('trace.runId is required');
  }

  if (!isNonEmptyString(request.providerCode)) {
    throw new RuntimeGatewayValidationError('providerCode is required');
  }

  if (!isNonEmptyString(request.modelCode)) {
    throw new RuntimeGatewayValidationError('modelCode is required');
  }

  if (!Array.isArray(request.messages) || request.messages.length === 0) {
    throw new RuntimeGatewayValidationError('messages must be a non-empty array');
  }

  if (request.parameters.maxTokens <= 0) {
    throw new RuntimeGatewayValidationError('parameters.maxTokens must be greater than 0');
  }
}

function normalizeGatewayRequest(request: GatewayRequest): NormalizedProviderRequest {
  const credentials = isGatewayMockMode()
    ? {}
    : resolveProviderCredentials(
        request.providerCode as ProviderCode,
        request.scope.organizationId,
      );

  return {
    model: request.modelCode,
    messages: request.messages,
    tools: request.tools,
    temperature: request.parameters.temperature,
    maxTokens: request.parameters.maxTokens,
    topP: request.parameters.topP,
    timeoutMs: request.timeoutMs,
    credentials,
  };
}

function createDefaultDependencies(): RuntimeGatewayDependencies {
  return {
    complete: (request) => aiGateway.complete(request),
    checkAllHealth: () => checkAllProvidersHealth(),
    getCapabilitiesRegistry: () => getCapabilitiesRegistry(),
    getAdapter: (providerCode) => getAdapter(providerCode),
    hasModel: (providerCode, modelCode) => hasModel(providerCode, modelCode),
    normalizeRequest: normalizeGatewayRequest,
  };
}

function mapGatewayError(error: unknown): never {
  if (
    error instanceof InvalidGatewayRequestError ||
    error instanceof ModelNotSupportedError ||
    error instanceof ProviderUnavailableError
  ) {
    throw error;
  }

  if (
    error instanceof RuntimeGatewayValidationError ||
    error instanceof RuntimeGatewayNotSupportedError
  ) {
    throw error;
  }

  if (error instanceof Error) {
    throw error;
  }

  throw new Error('Runtime gateway adapter failed unexpectedly');
}

function toStreamChunk(chunk: StreamChunk): RuntimeGatewayStreamChunk {
  return {
    contentDelta: chunk.contentDelta,
    finishReason: chunk.finishReason ?? null,
    done: chunk.done,
  };
}

/**
 * Runtime-facing gateway adapter. Delegates to existing Gateway modules only.
 * Runtime code must depend on this adapter — not on provider adapters or registry.
 */
export class RuntimeGatewayAdapter {
  private snapshot: RuntimeGatewaySnapshot = {
    lastOperation: null,
    lastRunId: null,
    lastModelId: null,
    updatedAt: new Date().toISOString(),
  };

  constructor(private readonly dependencies: RuntimeGatewayDependencies) {}

  async complete(request: RuntimeGatewayCompleteRequest): Promise<RuntimeGatewayCompleteResponse> {
    validateGatewayRequest(request);

    try {
      const response = await this.dependencies.complete(request);
      this.touch(
        'complete',
        request.trace.runId,
        buildRuntimeModelId(request.providerCode, request.modelCode),
      );
      return response;
    } catch (error) {
      mapGatewayError(error);
    }
  }

  async *stream(request: RuntimeGatewayStreamRequest): AsyncGenerator<RuntimeGatewayStreamChunk> {
    validateGatewayRequest(request);

    if (!this.dependencies.hasModel(request.providerCode, request.modelCode)) {
      throw new ModelNotSupportedError(request.providerCode, request.modelCode);
    }

    const adapter = this.dependencies.getAdapter(request.providerCode);
    const health = await adapter.health();

    if (!health.ok) {
      throw new ProviderUnavailableError(request.providerCode, health.message);
    }

    const normalizedRequest = this.dependencies.normalizeRequest(request);
    this.touch(
      'stream',
      request.trace.runId,
      buildRuntimeModelId(request.providerCode, request.modelCode),
    );

    try {
      for await (const chunk of adapter.stream(normalizedRequest)) {
        yield toStreamChunk(chunk);
      }
    } catch (error) {
      mapGatewayError(error);
    }
  }

  async embeddings(
    _request: RuntimeGatewayEmbeddingsRequest,
  ): Promise<RuntimeGatewayEmbeddingsResponse> {
    void _request;
    throw new RuntimeGatewayNotSupportedError('embeddings');
  }

  async models(): Promise<RuntimeGatewayModelsResponse> {
    const registry = this.dependencies.getCapabilitiesRegistry();
    const models: RuntimeGatewayModelsResponse['models'] = [];

    for (const [providerCode, providerModels] of Object.entries(registry)) {
      for (const [modelCode, capabilities] of Object.entries(providerModels)) {
        models.push({
          id: buildRuntimeModelId(providerCode, modelCode),
          modelCode,
          contextWindow: capabilities.contextWindow,
          supportsTools: capabilities.supportsTools,
          supportsVision: capabilities.supportsVision,
          supportsJson: capabilities.supportsJson,
          supportsStreaming: capabilities.supportsStreaming,
          supportsReasoning: capabilities.supportsReasoning,
        });
      }
    }

    this.touch('models', null, null);
    return { models };
  }

  async health(): Promise<RuntimeGatewayHealthResponse> {
    const entries = await this.dependencies.checkAllHealth();
    this.touch('health', null, null);

    return {
      ok: entries.every((entry) => entry.ok),
      entries: entries.map((entry) => ({
        id: entry.providerCode,
        ok: entry.ok,
        latencyMs: entry.latencyMs,
        message: entry.message ?? null,
      })),
    };
  }

  serialize(): SerializedRuntimeGatewaySnapshot {
    return serializeRuntimeGatewaySnapshot(this.snapshot);
  }

  reset(): void {
    this.snapshot = {
      lastOperation: null,
      lastRunId: null,
      lastModelId: null,
      updatedAt: new Date().toISOString(),
    };
  }

  private touch(
    operation: RuntimeGatewaySnapshot['lastOperation'],
    runId: string | null,
    modelId: string | null,
  ): void {
    this.snapshot = {
      lastOperation: operation,
      lastRunId: runId,
      lastModelId: modelId,
      updatedAt: new Date().toISOString(),
    };
  }
}

export function createRuntimeGatewayAdapter(
  options?: RuntimeGatewayAdapterOptions,
): RuntimeGatewayAdapter {
  const defaults = createDefaultDependencies();
  const dependencies: RuntimeGatewayDependencies = {
    complete: options?.dependencies?.complete ?? defaults.complete,
    checkAllHealth: options?.dependencies?.checkAllHealth ?? defaults.checkAllHealth,
    getCapabilitiesRegistry:
      options?.dependencies?.getCapabilitiesRegistry ?? defaults.getCapabilitiesRegistry,
    getAdapter: options?.dependencies?.getAdapter ?? defaults.getAdapter,
    hasModel: options?.dependencies?.hasModel ?? defaults.hasModel,
    normalizeRequest: options?.dependencies?.normalizeRequest ?? defaults.normalizeRequest,
  };

  return new RuntimeGatewayAdapter(dependencies);
}

/** Default dev/test singleton. Do not use for concurrent production gateway calls. */
export const runtimeGatewayAdapter = createRuntimeGatewayAdapter();
