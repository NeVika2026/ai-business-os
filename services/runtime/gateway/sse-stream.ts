import { ProviderError } from '@/services/runtime/gateway/provider-errors';
import { ProviderTimeoutError } from '@/services/runtime/gateway/provider-errors';
import type { ProviderCode, StreamChunk } from '@/services/runtime/gateway/types';

export interface SseStreamOptions {
  timeoutMs: number;
  providerCode: ProviderCode;
  signal?: AbortSignal;
  onLine?: (line: string) => StreamChunk | null;
}

export async function* readSseStream(
  response: Response,
  options: SseStreamOptions,
): AsyncGenerator<StreamChunk> {
  if (!response.body) {
    throw new ProviderError(
      'empty stream body',
      'ProviderStreamError',
      options.providerCode,
      false,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const startedAt = Date.now();

  try {
    while (true) {
      if (options.signal?.aborted) {
        throw new ProviderError(
          'stream cancelled',
          'ProviderStreamCancelled',
          options.providerCode,
          false,
        );
      }

      if (Date.now() - startedAt > options.timeoutMs) {
        throw new ProviderTimeoutError(options.providerCode, options.timeoutMs);
      }

      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith(':')) {
          continue;
        }

        const chunk = options.onLine?.(line);
        if (chunk) {
          yield chunk;
          if (chunk.done) {
            return;
          }
        }
      }
    }

    yield { contentDelta: '', finishReason: 'stop', done: true };
  } finally {
    reader.releaseLock();
  }
}

export async function fetchStreamingResponse(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  providerCode: ProviderCode,
  signal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const abortListener = () => controller.abort();

  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeout);
      throw new ProviderError('stream cancelled', 'ProviderStreamCancelled', providerCode, false);
    }
    signal.addEventListener('abort', abortListener, { once: true });
  }

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new ProviderError(
        text || response.statusText,
        'ProviderHttpError',
        providerCode,
        response.status === 429 || response.status >= 500,
        response.status,
      );
    }

    return response;
  } catch (error) {
    if (error instanceof ProviderError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      if (signal?.aborted) {
        throw new ProviderError('stream cancelled', 'ProviderStreamCancelled', providerCode, false);
      }
      throw new ProviderTimeoutError(providerCode, timeoutMs);
    }

    throw new ProviderError(
      error instanceof Error ? error.message : 'stream request failed',
      'ProviderNetworkError',
      providerCode,
      true,
    );
  } finally {
    clearTimeout(timeout);
    if (signal) {
      signal.removeEventListener('abort', abortListener);
    }
  }
}

export function parseOpenAiSseLine(line: string): StreamChunk | null {
  if (!line.startsWith('data:')) {
    return null;
  }

  const payload = line.slice(5).trim();
  if (payload === '[DONE]') {
    return { contentDelta: '', finishReason: 'stop', done: true };
  }

  try {
    const json = JSON.parse(payload) as {
      choices?: Array<{
        delta?: { content?: string };
        finish_reason?: string | null;
      }>;
    };
    const choice = json.choices?.[0];
    const contentDelta = choice?.delta?.content ?? '';
    const finishReason = choice?.finish_reason ?? undefined;
    const done = finishReason != null && finishReason.length > 0;

    if (!contentDelta && !done) {
      return null;
    }

    return { contentDelta, finishReason, done };
  } catch {
    return null;
  }
}

export function parseAnthropicSseLine(line: string): StreamChunk | null {
  if (!line.startsWith('data:')) {
    return null;
  }

  try {
    const json = JSON.parse(line.slice(5).trim()) as {
      type?: string;
      delta?: { type?: string; text?: string };
      message?: { stop_reason?: string };
    };

    if (json.type === 'content_block_delta' && json.delta?.text) {
      return { contentDelta: json.delta.text, done: false };
    }

    if (json.type === 'message_stop') {
      return { contentDelta: '', finishReason: 'stop', done: true };
    }

    return null;
  } catch {
    return null;
  }
}

export function parseNdjsonLine(line: string): StreamChunk | null {
  if (!line.trim()) {
    return null;
  }

  try {
    const json = JSON.parse(line) as {
      message?: { content?: string };
      done?: boolean;
    };

    const contentDelta = json.message?.content ?? '';
    if (!contentDelta && !json.done) {
      return null;
    }

    return {
      contentDelta,
      finishReason: json.done ? 'stop' : undefined,
      done: Boolean(json.done),
    };
  } catch {
    return null;
  }
}
