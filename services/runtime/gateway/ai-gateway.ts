import type { GatewayRequest as GatewayRequestDto } from '@/types/runtime/dto';
import { hasModel } from '@/services/runtime/gateway/capabilities';
import {
  InvalidGatewayRequestError,
  ModelNotSupportedError,
  ProviderUnavailableError,
} from '@/services/runtime/gateway/errors';
import { getAdapter } from '@/services/runtime/gateway/registry';
import type {
  GatewayResponse,
  NormalizedProviderRequest,
  ProviderCredentials,
  ProviderCode,
} from '@/services/runtime/gateway/types';

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

function resolveCredentials(providerCode: ProviderCode): ProviderCredentials {
  void providerCode;
  return {};
}

function toNormalizedRequest(request: GatewayRequestDto): NormalizedProviderRequest {
  return {
    model: request.modelCode,
    messages: request.messages,
    tools: request.tools,
    temperature: request.parameters.temperature,
    maxTokens: request.parameters.maxTokens,
    topP: request.parameters.topP,
    timeoutMs: request.timeoutMs,
    credentials: resolveCredentials(request.providerCode as ProviderCode),
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

export async function complete(request: GatewayRequestDto): Promise<GatewayResponse> {
  validateRequest(request);

  if (!hasModel(request.providerCode, request.modelCode)) {
    throw new ModelNotSupportedError(request.providerCode, request.modelCode);
  }

  const adapter = getAdapter(request.providerCode);
  const health = await adapter.health();

  if (!health.ok) {
    throw new ProviderUnavailableError(request.providerCode, health.message);
  }

  const normalizedRequest = toNormalizedRequest(request);
  const adapterResponse = await adapter.complete(normalizedRequest);

  return toGatewayResponse(request, adapterResponse);
}

export const aiGateway = {
  complete,
};
