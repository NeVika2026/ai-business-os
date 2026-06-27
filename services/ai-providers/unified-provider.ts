import { aiGateway } from '@/services/runtime/gateway/ai-gateway';
import { getAdapter } from '@/services/runtime/gateway/registry';
import { getModelCapabilities } from '@/services/runtime/gateway/capabilities';
import type { ProviderCode } from '@/services/runtime/gateway/types';
import type { GatewayRequest } from '@/types/runtime/dto';

import type { AiProviderCapabilities, AiProviderHealthResult, UnifiedAiProvider } from './types';

const cancelledRuns = new Set<string>();

export class GatewayUnifiedAiProvider implements UnifiedAiProvider {
  constructor(readonly code: ProviderCode) {}

  capabilities(): AiProviderCapabilities {
    const registry = getModelCapabilities(this.code, 'default');
    return {
      chat: true,
      streaming: registry?.supportsStreaming ?? true,
      toolCalls: registry?.supportsTools ?? false,
      cancellation: true,
      health: true,
    };
  }

  async chat(request: GatewayRequest) {
    if (cancelledRuns.has(request.trace.runId)) {
      throw new Error(`run cancelled: ${request.trace.runId}`);
    }

    return aiGateway.complete({ ...request, providerCode: this.code });
  }

  async *stream(request: GatewayRequest) {
    if (cancelledRuns.has(request.trace.runId)) {
      throw new Error(`run cancelled: ${request.trace.runId}`);
    }

    yield* aiGateway.stream({ ...request, providerCode: this.code });
  }

  async health(): Promise<AiProviderHealthResult> {
    const result = await getAdapter(this.code).health();
    return {
      ok: result.ok,
      latencyMs: result.latencyMs,
      message: result.message,
    };
  }

  async cancel(runId: string): Promise<void> {
    cancelledRuns.add(runId);
  }
}

export function createUnifiedAiProvider(code: ProviderCode): UnifiedAiProvider {
  return new GatewayUnifiedAiProvider(code);
}

export function createAllUnifiedAiProviders(): Record<ProviderCode, UnifiedAiProvider> {
  return {
    openai: createUnifiedAiProvider('openai'),
    anthropic: createUnifiedAiProvider('anthropic'),
    gemini: createUnifiedAiProvider('gemini'),
    groq: createUnifiedAiProvider('groq'),
    openrouter: createUnifiedAiProvider('openrouter'),
    ollama: createUnifiedAiProvider('ollama'),
  };
}

export function resetUnifiedAiProviderState(): void {
  cancelledRuns.clear();
}
