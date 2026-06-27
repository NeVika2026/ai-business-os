import { getModelCapabilities } from '@/services/runtime/gateway/capabilities';
import type {
  ModelCapabilities,
  NormalizedProviderRequest,
  NormalizedProviderResponse,
  ProviderAdapter,
  ProviderCode,
  ProviderHealthResult,
  StreamChunk,
} from '@/services/runtime/gateway/types';

function estimateInputTokens(messages: NormalizedProviderRequest['messages']): number {
  const chars = messages.reduce((sum, message) => sum + message.content.length, 0);
  return Math.max(1, Math.ceil(chars / 4));
}

export abstract class MockProviderAdapter implements ProviderAdapter {
  abstract readonly code: ProviderCode;

  async complete(request: NormalizedProviderRequest): Promise<NormalizedProviderResponse> {
    const startedAt = Date.now();
    const inputTokens = estimateInputTokens(request.messages);
    const outputTokens = 42;
    const lastUserMessage = [...request.messages]
      .reverse()
      .find((message) => message.role === 'user');

    const content = `[mock:${this.code}] Response for model ${request.model}${
      lastUserMessage ? `: ${lastUserMessage.content.slice(0, 120)}` : ''
    }`;

    return {
      content,
      toolCalls: [],
      usage: {
        inputTokens,
        outputTokens,
      },
      finishReason: 'stop',
      providerRequestId: `mock_${this.code}_${Date.now()}`,
      latencyMs: Date.now() - startedAt,
      raw: { mock: true, provider: this.code },
    };
  }

  async *stream(request: NormalizedProviderRequest): AsyncGenerator<StreamChunk> {
    const response = await this.complete(request);
    const content = response.content ?? '';

    if (content.length === 0) {
      yield { contentDelta: '', finishReason: 'stop', done: true };
      return;
    }

    const midpoint = Math.ceil(content.length / 2);
    yield { contentDelta: content.slice(0, midpoint), done: false };
    yield { contentDelta: content.slice(midpoint), finishReason: 'stop', done: true };
  }

  async health(): Promise<ProviderHealthResult> {
    return {
      ok: true,
      latencyMs: 1,
      providerCode: this.code,
      message: 'mock adapter healthy',
    };
  }

  capabilities(model: string): ModelCapabilities | null {
    return getModelCapabilities(this.code, model);
  }
}

export type { ProviderAdapter };
