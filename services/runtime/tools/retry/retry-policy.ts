import {
  NonRetryableError,
  RetryExhaustedError,
} from '@/services/runtime/tools/retry/retry-errors';
import type { RetryConfig } from '@/services/runtime/tools/retry/retry-types';
import {
  DEFAULT_RETRY_CONFIG,
  MAX_RETRY_DELAY_MS,
} from '@/services/runtime/tools/retry/retry-types';
import type { ToolRetryPolicy } from '@/services/runtime/tools/tool-types';

const NON_RETRYABLE_CODES = new Set([
  'TOOL_VALIDATION_ERROR',
  'TOOL_NOT_FOUND',
  'TOOL_PERMISSION_DENIED',
  'TOOL_APPROVAL_REQUIRED',
  'VALIDATION_SCHEMA',
  'PERMISSION_DENIED',
  'APPROVAL_REQUIRED',
]);

function sleep(ms: number): Promise<void> {
  const boundedMs = Math.min(Math.max(ms, 0), MAX_RETRY_DELAY_MS);
  return new Promise((resolve) => {
    setTimeout(resolve, boundedMs);
  });
}

export function extractErrorCode(error: unknown): string {
  if (error instanceof Error && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }

  return 'EXECUTION_FAILED';
}

export function isRetryableError(code: string, config: RetryConfig): boolean {
  if (NON_RETRYABLE_CODES.has(code)) {
    return false;
  }

  return config.retryableErrors.includes(code);
}

export function computeRetryDelay(attempt: number, config: RetryConfig): number {
  if (config.backoff === 'none' || config.delayMs <= 0) {
    return 0;
  }

  if (config.backoff === 'linear') {
    return Math.min(config.delayMs * attempt, MAX_RETRY_DELAY_MS);
  }

  return Math.min(config.delayMs * 2 ** (attempt - 1), MAX_RETRY_DELAY_MS);
}

export function toRetryConfig(policy?: ToolRetryPolicy): RetryConfig {
  if (!policy) {
    return DEFAULT_RETRY_CONFIG;
  }

  const delayMs = policy.backoffMs[0] ?? 0;
  let backoff: RetryConfig['backoff'] = 'none';

  if (policy.backoffMs.length > 1) {
    const [first, second] = policy.backoffMs;
    backoff = second >= first * 2 ? 'exponential' : 'linear';
  } else if (delayMs > 0) {
    backoff = 'linear';
  }

  return {
    maxAttempts: Math.max(policy.maxAttempts, 1),
    delayMs,
    backoff,
    retryableErrors:
      policy.retryableErrors.length > 0
        ? policy.retryableErrors
        : DEFAULT_RETRY_CONFIG.retryableErrors,
  };
}

export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<{ value: T; attempts: number }> {
  let lastError: unknown;
  let lastCode = 'EXECUTION_FAILED';

  for (let attempt = 1; attempt <= config.maxAttempts; attempt += 1) {
    try {
      const value = await operation();
      return { value, attempts: attempt };
    } catch (error) {
      lastError = error;
      lastCode = extractErrorCode(error);

      if (!isRetryableError(lastCode, config) || attempt >= config.maxAttempts) {
        break;
      }

      const delay = computeRetryDelay(attempt, config);
      if (delay > 0) {
        await sleep(delay);
      }
    }
  }

  if (isRetryableError(lastCode, config)) {
    throw new RetryExhaustedError(
      lastError instanceof Error ? lastError.message : 'Retry attempts exhausted',
      config.maxAttempts,
    );
  }

  throw new NonRetryableError(
    lastError instanceof Error ? lastError.message : 'Tool execution failed',
    lastCode,
  );
}
