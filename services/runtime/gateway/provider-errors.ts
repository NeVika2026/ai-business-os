import { GatewayError } from '@/services/runtime/gateway/errors';
import type { ProviderCode } from '@/services/runtime/gateway/types';

export class ProviderError extends GatewayError {
  constructor(
    message: string,
    code: string,
    public readonly providerCode: ProviderCode,
    public readonly retryable: boolean,
    public readonly statusCode?: number,
  ) {
    super(message, code);
    this.name = 'ProviderError';
  }
}

export class ProviderAuthError extends ProviderError {
  constructor(providerCode: ProviderCode, message: string) {
    super(message, 'ProviderAuthError', providerCode, false, 401);
    this.name = 'ProviderAuthError';
  }
}

export class ProviderRateLimitError extends ProviderError {
  constructor(providerCode: ProviderCode, message = 'rate limit exceeded') {
    super(message, 'ProviderRateLimitError', providerCode, true, 429);
    this.name = 'ProviderRateLimitError';
  }
}

export class ProviderTimeoutError extends ProviderError {
  constructor(providerCode: ProviderCode, timeoutMs: number) {
    super(
      `provider request timed out after ${timeoutMs}ms`,
      'ProviderTimeoutError',
      providerCode,
      true,
    );
    this.name = 'ProviderTimeoutError';
  }
}

export function isRetryableProviderError(error: unknown): boolean {
  return error instanceof ProviderError && error.retryable;
}
