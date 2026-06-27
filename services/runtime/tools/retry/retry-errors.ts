export class RetryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

export class RetryExhaustedError extends RetryError {
  constructor(
    message: string,
    public readonly attempts: number,
  ) {
    super(message, 'RETRY_EXHAUSTED', false);
    this.name = 'RetryExhaustedError';
  }
}

export class NonRetryableError extends RetryError {
  constructor(message: string, code: string) {
    super(message, code, false);
    this.name = 'NonRetryableError';
  }
}
