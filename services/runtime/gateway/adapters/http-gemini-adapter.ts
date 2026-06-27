import { getModelCapabilities } from '@/services/runtime/gateway/capabilities';
import { assertHttpSuccess, fetchWithTimeout } from '@/services/runtime/gateway/http-client';
import { fetchStreamingResponse, readSseStream } from '@/services/runtime/gateway/sse-stream';
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

function buildGeminiContents(messages: NormalizedProviderRequest['messages']) {
  return messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }));
}

export class HttpGeminiAdapter implements ProviderAdapter {
  readonly code = 'gemini' as const;

  async complete(request: NormalizedProviderRequest): Promise<NormalizedProviderResponse> {
    const startedAt = Date.now();
    const baseUrl = request.credentials.baseUrl?.replace(/\/$/, '');
    const apiKey = request.credentials.apiKey;

    if (!baseUrl || !apiKey) {
      throw new ProviderAuthError(this.code, 'GOOGLE_AI_API_KEY and base URL are required');
    }

    const response = await fetchWithTimeout(
      `${baseUrl}/models/${encodeURIComponent(request.model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: buildGeminiContents(request.messages),
          generationConfig: {
            temperature: request.temperature,
            maxOutputTokens: request.maxTokens,
            topP: request.topP,
          },
        }),
      },
      request.timeoutMs,
      this.code,
    );

    assertHttpSuccess(response, this.code);

    const payload = response.json as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
      }>;
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
      };
    };

    const candidate = payload.candidates?.[0];
    const text = candidate?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';

    return {
      content: text,
      toolCalls: [],
      usage: {
        inputTokens: payload.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: payload.usageMetadata?.candidatesTokenCount ?? 0,
      },
      finishReason: candidate?.finishReason?.toLowerCase() ?? 'stop',
      providerRequestId: undefined,
      latencyMs: Date.now() - startedAt,
      raw: response.json,
    };
  }

  async *stream(request: NormalizedProviderRequest): AsyncGenerator<StreamChunk> {
    const baseUrl = request.credentials.baseUrl?.replace(/\/$/, '');
    const apiKey = request.credentials.apiKey;

    if (!baseUrl || !apiKey) {
      throw new ProviderAuthError(this.code, 'GOOGLE_AI_API_KEY and base URL are required');
    }

    const signal = request.runId ? registerStreamCancellation(request.runId) : request.signal;

    try {
      const response = await fetchStreamingResponse(
        `${baseUrl}/models/${encodeURIComponent(request.model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: buildGeminiContents(request.messages),
            generationConfig: {
              temperature: request.temperature,
              maxOutputTokens: request.maxTokens,
              topP: request.topP,
            },
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
        onLine(line) {
          if (!line.startsWith('data:')) {
            return null;
          }

          try {
            const json = JSON.parse(line.slice(5).trim()) as {
              candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
            };
            const text =
              json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
            if (!text) {
              return null;
            }
            return { contentDelta: text, done: false };
          } catch {
            return null;
          }
        },
      });
    } finally {
      if (request.runId) {
        clearStreamCancellation(request.runId);
      }
    }
  }

  async health(): Promise<ProviderHealthResult> {
    const startedAt = Date.now();
    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
      providerCode: this.code,
      message: 'gemini http adapter ready',
    };
  }

  capabilities(model: string): ModelCapabilities | null {
    return getModelCapabilities(this.code, model);
  }
}
