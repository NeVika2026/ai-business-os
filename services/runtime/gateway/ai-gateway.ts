import { completeWithModelRouter, streamWithModelRouter } from '@/lib/ai/model-router';
import {
  applyGatewayMemoryInjection,
  captureGatewayMemoryFromResponse,
} from '@/lib/memory/gateway-memory';
import { isGatewayMockMode } from '@/services/runtime/gateway/adapter-factory';
import { cancelStream } from '@/services/runtime/gateway/stream-cancellation';
import { checkGatewayRateLimit } from '@/services/runtime/gateway/gateway-rate-limiter';
import { resolveProviderCredentials } from '@/services/runtime/gateway/credential-resolver';
import { executeWithGatewayRetry } from '@/services/runtime/gateway/gateway-retry';
import { hasModel } from '@/services/runtime/gateway/capabilities';
import {
  InvalidGatewayRequestError,
  ModelNotSupportedError,
  ProviderUnavailableError,
} from '@/services/runtime/gateway/errors';
import { getAdapter } from '@/services/runtime/gateway/registry';
import { ProviderAuthError } from '@/services/runtime/gateway/provider-errors';
import { costTracker } from '@/services/runtime/observability/cost/cost-tracker';
import { metrics } from '@/services/runtime/observability/metrics/metrics-manager';
import type {
  GatewayResponse,
  NormalizedProviderRequest,
  ProviderCode,
  StreamChunk,
} from '@/services/runtime/gateway/types';
import type { GatewayRequest as GatewayRequestDto } from '@/types/runtime/dto';

function validateRequest(request: GatewayRequestDto): void {
  if (!request.scope?.organizationId) {
    throw new InvalidGatewayRequestError('scope.organizationId is required');
  }

  if (!request.trace?.runId) {
    throw new InvalidGatewayRequestError('trace.runId is required');
  }

  if (!request.providerCode?.trim()) {
    throw new InvalidGatewayRequestError('providerCode is required');
  }

  if (!request.modelCode?.trim()) {
    throw new InvalidGatewayRequestError('modelCode is required');
  }

  if (!Array.isArray(request.messages) || request.messages.length === 0) {
    throw new InvalidGatewayRequestError('messages must be a non-empty array');
  }

  if (request.parameters.maxTokens <= 0) {
    throw new InvalidGatewayRequestError('parameters.maxTokens must be greater than 0');
  }
}

function toNormalizedRequest(request: GatewayRequestDto): NormalizedProviderRequest {
  const providerCode = request.providerCode as ProviderCode;

  if (isGatewayMockMode()) {
    return {
      model: request.modelCode,
      messages: request.messages,
      tools: request.tools,
      temperature: request.parameters.temperature,
      maxTokens: request.parameters.maxTokens,
      topP: request.parameters.topP,
      timeoutMs: request.timeoutMs,
      credentials: {},
      runId: request.trace.runId,
    };
  }

  let credentials;

  try {
    credentials = resolveProviderCredentials(providerCode, request.scope.organizationId);
  } catch (error) {
    if (error instanceof ProviderAuthError) {
      throw new ProviderUnavailableError(providerCode, error.message);
    }
    throw error;
  }

  return {
    model: request.modelCode,
    messages: request.messages,
    tools: request.tools,
    temperature: request.parameters.temperature,
    maxTokens: request.parameters.maxTokens,
    topP: request.parameters.topP,
    timeoutMs: request.timeoutMs,
    credentials,
    runId: request.trace.runId,
  };
}

function toGatewayResponse(
  request: GatewayRequestDto,
  adapterResponse: Awaited<ReturnType<ReturnType<typeof getAdapter>['complete']>>,
): GatewayResponse {
  return {
    trace: request.trace,
    providerCode: request.providerCode,
    modelCode: request.modelCode,
    content: adapterResponse.content,
    toolCalls: adapterResponse.toolCalls.map((toolCall) => ({
      id: toolCall.id,
      name: toolCall.name,
      arguments: toolCall.arguments,
      audit: {
        runId: request.trace.runId,
        employeeId: request.scope.userId ?? request.trace.runId,
        organizationId: request.scope.organizationId,
        requestedAt: new Date().toISOString(),
      },
    })),
    usage: {
      inputTokens: adapterResponse.usage.inputTokens,
      outputTokens: adapterResponse.usage.outputTokens,
      totalTokens: adapterResponse.usage.inputTokens + adapterResponse.usage.outputTokens,
    },
    latencyMs: adapterResponse.latencyMs,
    finishReason: adapterResponse.finishReason,
    providerRequestId: adapterResponse.providerRequestId,
  };
}

async function executeCompleteOnce(request: GatewayRequestDto): Promise<GatewayResponse> {
  validateRequest(request);
  checkGatewayRateLimit(request.providerCode as ProviderCode, request.scope.organizationId);

  if (!hasModel(request.providerCode, request.modelCode)) {
    throw new ModelNotSupportedError(request.providerCode, request.modelCode);
  }

  const adapter = getAdapter(request.providerCode);
  const health = await adapter.health();

  if (!health.ok) {
    throw new ProviderUnavailableError(request.providerCode, health.message);
  }

  const normalizedRequest = toNormalizedRequest(request);
  const retryPolicy = request.retryPolicy ?? {
    maxAttempts: 3,
    backoffMs: [500, 1000, 2000],
  };

  const startedAt = Date.now();
  const adapterResponse = await executeWithGatewayRetry(
    () => adapter.complete(normalizedRequest),
    retryPolicy,
  );

  const response = toGatewayResponse(request, adapterResponse);
  const latencyMs = Date.now() - startedAt;

  try {
    metrics.recordLLM({
      organizationId: request.scope.organizationId,
      employeeId: request.scope.userId ?? request.trace.runId,
      traceId: request.trace.traceId,
      runId: request.trace.runId,
      provider: request.providerCode,
      model: request.modelCode,
      latency: latencyMs,
      llmCalls: 1,
    });

    costTracker.record({
      organizationId: request.scope.organizationId,
      employeeId: request.scope.userId ?? request.trace.runId,
      traceId: request.trace.traceId,
      runId: request.trace.runId,
      providerCode: request.providerCode,
      modelCode: request.modelCode,
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
    });
  } catch {
    // Observability must not block gateway responses.
  }

  return response;
}

export async function complete(request: GatewayRequestDto): Promise<GatewayResponse> {
  const requestWithMemory = applyGatewayMemoryInjection(request);
  const response = await completeWithModelRouter(requestWithMemory, executeCompleteOnce);

  try {
    captureGatewayMemoryFromResponse(requestWithMemory, response);
  } catch {
    // Operational memory must not block gateway responses.
  }

  return response;
}

async function* executeStreamOnce(request: GatewayRequestDto): AsyncGenerator<StreamChunk> {
  validateRequest(request);
  checkGatewayRateLimit(request.providerCode as ProviderCode, request.scope.organizationId);

  if (!hasModel(request.providerCode, request.modelCode)) {
    throw new ModelNotSupportedError(request.providerCode, request.modelCode);
  }

  const adapter = getAdapter(request.providerCode);
  const health = await adapter.health();

  if (!health.ok) {
    throw new ProviderUnavailableError(request.providerCode, health.message);
  }

  const normalizedRequest = toNormalizedRequest(request);
  yield* adapter.stream(normalizedRequest);
}

export async function* stream(request: GatewayRequestDto): AsyncGenerator<StreamChunk> {
  const requestWithMemory = applyGatewayMemoryInjection(request);
  yield* streamWithModelRouter(requestWithMemory, executeStreamOnce);
}

export const aiGateway = {
  complete,
  stream,
  cancelStream: (runId: string) => cancelStream(runId),
};
