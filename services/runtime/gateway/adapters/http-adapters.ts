import { getModelCapabilities } from '@/services/runtime/gateway/capabilities';
import { assertHttpSuccess, fetchWithTimeout } from '@/services/runtime/gateway/http-client';
import { ProviderAuthError } from '@/services/runtime/gateway/provider-errors';
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

function buildOpenAiMessages(request: NormalizedProviderRequest) {
  return request.messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

function parseOpenAiResponse(json: unknown, startedAt: number): NormalizedProviderResponse {
  const payload = json as {
    id?: string;
    choices?: Array<{
      message?: {
        content?: string | null;
        tool_calls?: Array<{
          id: string;
          function: { name: string; arguments: string };
        }>;
      };
      finish_reason?: string;
    }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const choice = payload.choices?.[0];
  const message = choice?.message;
  const toolCalls =
    message?.tool_calls?.map((call) => ({
      id: call.id,
      name: call.function.name,
      arguments: safeParseJson(call.function.arguments),
    })) ?? [];

  return {
    content: message?.content ?? null,
    toolCalls,
    usage: {
      inputTokens: payload.usage?.prompt_tokens ?? 0,
      outputTokens: payload.usage?.completion_tokens ?? 0,
    },
    finishReason: choice?.finish_reason ?? 'stop',
    providerRequestId: payload.id,
    latencyMs: Date.now() - startedAt,
    raw: json,
  };
}

function safeParseJson(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export class HttpOpenAiCompatibleAdapter implements ProviderAdapter {
  constructor(
    readonly code: ProviderCode,
    private readonly chatPath = '/chat/completions',
  ) {}

  async complete(request: NormalizedProviderRequest): Promise<NormalizedProviderResponse> {
    const startedAt = Date.now();
    const baseUrl = request.credentials.baseUrl?.replace(/\/$/, '');
    if (!baseUrl) {
      throw new ProviderAuthError(this.code, 'baseUrl is required');
    }

    const body = {
      model: request.model,
      messages: buildOpenAiMessages(request),
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      top_p: request.topP,
      tools: request.tools?.map((tool) => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      })),
      stream: false,
    };

    const response = await fetchWithTimeout(
      `${baseUrl}${this.chatPath}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(request.credentials.apiKey
            ? { Authorization: `Bearer ${request.credentials.apiKey}` }
            : {}),
          ...(request.credentials.extraHeaders ?? {}),
        },
        body: JSON.stringify(body),
      },
      request.timeoutMs,
      this.code,
    );

    assertHttpSuccess(response, this.code);
    return parseOpenAiResponse(response.json, startedAt);
  }

  async *stream(request: NormalizedProviderRequest): AsyncGenerator<StreamChunk> {
    const result = await this.complete(request);
    const content = result.content ?? '';
    if (content.length === 0) {
      yield { contentDelta: '', finishReason: result.finishReason, done: true };
      return;
    }

    const midpoint = Math.ceil(content.length / 2);
    yield { contentDelta: content.slice(0, midpoint), done: false };
    yield {
      contentDelta: content.slice(midpoint),
      finishReason: result.finishReason,
      done: true,
    };
  }

  async health(): Promise<ProviderHealthResult> {
    const startedAt = Date.now();
    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
      providerCode: this.code,
      message: 'http adapter ready',
    };
  }

  capabilities(model: string): ModelCapabilities | null {
    return getModelCapabilities(this.code, model);
  }
}

export class HttpOllamaAdapter implements ProviderAdapter {
  readonly code = 'ollama' as const;

  async complete(request: NormalizedProviderRequest): Promise<NormalizedProviderResponse> {
    const startedAt = Date.now();
    const baseUrl = request.credentials.baseUrl?.replace(/\/$/, '');
    if (!baseUrl) {
      throw new ProviderAuthError(this.code, 'OLLAMA_BASE_URL is required');
    }

    const response = await fetchWithTimeout(
      `${baseUrl}/api/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: request.model,
          messages: buildOpenAiMessages(request),
          stream: false,
          options: {
            temperature: request.temperature,
            num_predict: request.maxTokens,
          },
        }),
      },
      request.timeoutMs,
      this.code,
    );

    assertHttpSuccess(response, this.code);
    const payload = response.json as {
      message?: { content?: string };
      eval_count?: number;
    };

    const content = payload.message?.content ?? '';
    const inputTokens = estimateInputTokens(request.messages);
    const outputTokens = payload.eval_count ?? Math.max(1, Math.ceil(content.length / 4));

    return {
      content,
      toolCalls: [],
      usage: { inputTokens, outputTokens },
      finishReason: 'stop',
      providerRequestId: undefined,
      latencyMs: Date.now() - startedAt,
      raw: response.json,
    };
  }

  async *stream(request: NormalizedProviderRequest): AsyncGenerator<StreamChunk> {
    const result = await this.complete(request);
    yield { contentDelta: result.content ?? '', finishReason: 'stop', done: true };
  }

  async health(): Promise<ProviderHealthResult> {
    const startedAt = Date.now();
    const baseUrl = requestBaseUrl();
    try {
      const response = await fetchWithTimeout(
        `${baseUrl}/api/tags`,
        { method: 'GET' },
        5000,
        this.code,
      );
      return {
        ok: response.ok,
        latencyMs: Date.now() - startedAt,
        providerCode: this.code,
        message: response.ok ? 'ollama reachable' : response.statusText,
      };
    } catch (error) {
      return {
        ok: false,
        latencyMs: Date.now() - startedAt,
        providerCode: this.code,
        message: error instanceof Error ? error.message : 'ollama unavailable',
      };
    }
  }

  capabilities(model: string): ModelCapabilities | null {
    return getModelCapabilities(this.code, model);
  }
}

function requestBaseUrl(): string {
  return (process.env.OLLAMA_BASE_URL?.trim() || 'http://127.0.0.1:11434').replace(/\/$/, '');
}
