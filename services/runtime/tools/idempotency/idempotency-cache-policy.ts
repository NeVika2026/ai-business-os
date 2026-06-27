import { isRetryableError } from '@/services/runtime/tools/retry/retry-policy';
import type { RetryConfig } from '@/services/runtime/tools/retry/retry-types';
import type { ToolResult } from '@/types/runtime/dto';

const TRANSIENT_EXHAUSTION_CODES = new Set(['RETRY_EXHAUSTED']);

export function shouldCacheToolResult(result: ToolResult, retryConfig: RetryConfig): boolean {
  if (result.success) {
    return true;
  }

  if (!result.error) {
    return false;
  }

  const { code } = result.error;

  if (isRetryableError(code, retryConfig)) {
    return false;
  }

  if (TRANSIENT_EXHAUSTION_CODES.has(code)) {
    return false;
  }

  return true;
}
