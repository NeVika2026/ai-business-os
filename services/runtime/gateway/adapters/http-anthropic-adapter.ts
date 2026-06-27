import { getModelCapabilities } from '@/services/runtime/gateway/capabilities';
import { assertHttpSuccess, fetchWithTimeout } from '@/services/runtime/gateway/http-client';
import {
  fetchStreamingResponse,
  parseAnthropicSseLine,
  readSseStream,
} from '@/services/runtime/gateway/sse-stream';
import {
  clearStreamCancellation,
  registerStreamCancellation,
} from '@/services/runtime/gateway/stream-cancellation';
import { ProviderAuthError } from '@/services/runtime/gateway/provider-errors';
import type {
  ModelCapabilities,
  NormalizedProviderRequest,
  NormalizedProviderResponse,
  ProviderAdapter,
  ProviderHealthResult,
  StreamChunk,
} from '@/services/runtime/gateway/types';

export class HttpAnthropicAdapter implements ProviderAdapter {
  readonly code = 'anthropic' as const;

  async complete(request: NormalizedProviderRequest): Promise<NormalizedProviderResponse> {
    const startedAt = Date.now();
    const baseUrl = request.credentials.baseUrl?.replace(/\/$/, '');
    const apiKey = request.credentials.apiKey;

    if (!baseUrl || !apiKey) {
      throw new ProviderAuthError(this.code, 'ANTHROPIC credentials are required');
    }

    const systemMessage = request.messages.find((message) => message.role === 'system')?.content;
    const messages = request.messages
      .filter((message) => message.role !== 'system')
      .map((message) => ({
        role: message.role === 'assistant' ? 'assistant' : 'user',
        content: message.content,
      }));

    const response = await fetchWithTimeout(
      `${baseUrl}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: request.model,
          max_tokens: request.maxTokens,
          temperature: request.temperature,
          system: systemMessage,
          messages,
        }),
      },
      request.timeoutMs,
      this.code,
    );

    assertHttpSuccess(response, this.code);
    const payload = response.json as {
      id?: string;
      content?: Array<{ type?: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
      stop_reason?: string;
    };

    const content = payload.content?.map((part) => part.text ?? '').join('') ?? null;

    return {
      content,
      toolCalls: [],
      usage: {
        inputTokens: payload.usage?.input_tokens ?? 0,
        outputTokens: payload.usage?.output_tokens ?? 0,
      },
      finishReason: payload.stop_reason ?? 'stop',
      providerRequestId: payload.id,
      latencyMs: Date.now() - startedAt,
      raw: response.json,
    };
  }

  async *stream(request: NormalizedProviderRequest): AsyncGenerator<StreamChunk> {
    const baseUrl = request.credentials.baseUrl?.replace(/\/$/, '');
    const apiKey = request.credentials.apiKey;

    if (!baseUrl || !apiKey) {
      throw new ProviderAuthError(this.code, 'ANTHROPIC credentials are required');
    }

    const systemMessage = request.messages.find((message) => message.role === 'system')?.content;
    const messages = request.messages
      .filter((message) => message.role !== 'system')
      .map((message) => ({
        role: message.role === 'assistant' ? 'assistant' : 'user',
        content: message.content,
      }));

    const signal = request.runId ? registerStreamCancellation(request.runId) : request.signal;

    try {
      const response = await fetchStreamingResponse(
        `${baseUrl}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: request.model,
            max_tokens: request.maxTokens,
            temperature: request.temperature,
            system: systemMessage,
            messages,
            stream: true,
          }),
        },
        request.timeoutMs,
        this.code,
        signal,
      );

      yield* readSseStream(response, {
        timeoutMs: request.timeoutMs,
        providerCode: this.code,
        signal,
        onLine: parseAnthropicSseLine,
      });
    } finally {
      if (request.runId) {
        clearStreamCancellation(request.runId);
      }
    }
  }

  async health(): Promise<ProviderHealthResult> {
    return {
      ok: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
      latencyMs: 1,
      providerCode: this.code,
      message: process.env.ANTHROPIC_API_KEY?.trim()
        ? 'anthropic credentials configured'
        : 'missing ANTHROPIC_API_KEY',
    };
  }

  capabilities(model: string): ModelCapabilities | null {
    return getModelCapabilities(this.code, model);
  }
}
