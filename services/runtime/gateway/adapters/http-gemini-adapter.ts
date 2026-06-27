import { getModelCapabilities } from '@/services/runtime/gateway/capabilities';
import { assertHttpSuccess, fetchWithTimeout } from '@/services/runtime/gateway/http-client';
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
    const result = await this.complete(request);
    yield { contentDelta: result.content ?? '', finishReason: result.finishReason, done: true };
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
