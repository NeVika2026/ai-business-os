import { isRetryableProviderError } from '@/services/runtime/gateway/provider-errors';

export interface GatewayRetryPolicy {
  maxAttempts: number;
  backoffMs: number[];
}

export const DEFAULT_GATEWAY_RETRY_POLICY: GatewayRetryPolicy = {
  maxAttempts: 3,
  backoffMs: [500, 1000, 2000],
};

export async function executeWithGatewayRetry<T>(
  operation: () => Promise<T>,
  policy: GatewayRetryPolicy = DEFAULT_GATEWAY_RETRY_POLICY,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= policy.maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= policy.maxAttempts || !isRetryableProviderError(error)) {
        throw error;
      }

      const delayMs = policy.backoffMs[Math.min(attempt - 1, policy.backoffMs.length - 1)] ?? 500;
      await sleep(delayMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('gateway retry failed');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
