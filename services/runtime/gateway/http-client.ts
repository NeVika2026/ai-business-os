import { ProviderError } from '@/services/runtime/gateway/provider-errors';
import { ProviderTimeoutError } from '@/services/runtime/gateway/provider-errors';
import type { ProviderCode } from '@/services/runtime/gateway/types';

export interface HttpClientResponse {
  ok: boolean;
  status: number;
  statusText: string;
  text: string;
  json: unknown;
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  providerCode: ProviderCode,
): Promise<HttpClientResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    const text = await response.text();
    let json: unknown = null;

    try {
      json = text.length > 0 ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      text,
      json,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ProviderTimeoutError(providerCode, timeoutMs);
    }

    throw new ProviderError(
      error instanceof Error ? error.message : 'provider request failed',
      'ProviderNetworkError',
      providerCode,
      true,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function assertHttpSuccess(response: HttpClientResponse, providerCode: ProviderCode): void {
  if (response.ok) {
    return;
  }

  const message =
    typeof response.json === 'object' &&
    response.json !== null &&
    'error' in response.json &&
    typeof (response.json as { error?: { message?: string } }).error?.message === 'string'
      ? String((response.json as { error?: { message?: string } }).error?.message)
      : response.text || response.statusText;

  const retryable = response.status === 429 || response.status >= 500;
  if (response.status === 429) {
    throw new ProviderError(message, 'ProviderRateLimitError', providerCode, true, response.status);
  }

  throw new ProviderError(message, 'ProviderHttpError', providerCode, retryable, response.status);
}
