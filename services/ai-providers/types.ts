import type { ProviderCode } from '@/services/runtime/gateway/types';
import type { GatewayRequest, GatewayResponse } from '@/types/runtime/dto';

export interface AiProviderCapabilities {
  chat: boolean;
  streaming: boolean;
  toolCalls: boolean;
  cancellation: boolean;
  health: boolean;
}

export interface AiProviderHealthResult {
  ok: boolean;
  latencyMs: number;
  message?: string;
}

export interface UnifiedAiProvider {
  readonly code: ProviderCode;
  capabilities(): AiProviderCapabilities;
  chat(request: GatewayRequest): Promise<GatewayResponse>;
  stream(
    request: GatewayRequest,
  ): AsyncGenerator<import('@/services/runtime/gateway/types').StreamChunk>;
  health(): Promise<AiProviderHealthResult>;
  cancel(_runId: string): Promise<void>;
}
