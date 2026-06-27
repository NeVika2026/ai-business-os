import { ProviderRateLimitError } from '@/services/runtime/gateway/provider-errors';
import type { ProviderCode } from '@/services/runtime/gateway/types';

interface RateLimitBucket {
  count: number;
  windowStartedAt: number;
}

const DEFAULT_REQUESTS_PER_MINUTE = 120;
const WINDOW_MS = 60_000;

const buckets = new Map<string, RateLimitBucket>();

export interface GatewayRateLimitOptions {
  requestsPerMinute?: number;
  windowMs?: number;
}

export function checkGatewayRateLimit(
  providerCode: ProviderCode,
  organizationId: string,
  options?: GatewayRateLimitOptions,
): void {
  const limit = options?.requestsPerMinute ?? DEFAULT_REQUESTS_PER_MINUTE;
  const windowMs = options?.windowMs ?? WINDOW_MS;
  const key = `${organizationId}:${providerCode}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStartedAt >= windowMs) {
    buckets.set(key, { count: 1, windowStartedAt: now });
    return;
  }

  if (bucket.count >= limit) {
    throw new ProviderRateLimitError(providerCode, `rate limit exceeded for ${organizationId}`);
  }

  bucket.count += 1;
}

export function resetGatewayRateLimits(): void {
  buckets.clear();
}
