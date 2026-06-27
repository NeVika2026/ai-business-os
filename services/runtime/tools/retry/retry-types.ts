export type BackoffStrategy = 'none' | 'linear' | 'exponential';

export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoff: BackoffStrategy;
  retryableErrors: string[];
}

export interface RetryAttemptResult<T> {
  value?: T;
  error?: unknown;
  attempts: number;
  lastErrorCode?: string;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 1,
  delayMs: 0,
  backoff: 'none',
  retryableErrors: ['EXECUTION_TIMEOUT', 'EXECUTION_NETWORK', 'RATE_LIMITED', 'EXTERNAL_503'],
};

export const MAX_RETRY_DELAY_MS = 10;
