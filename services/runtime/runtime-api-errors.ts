export class RuntimeApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'RuntimeApiError';
  }
}

export class RuntimeApiValidationError extends RuntimeApiError {
  constructor(message: string) {
    super(message, 'RUNTIME_API_VALIDATION_ERROR');
    this.name = 'RuntimeApiValidationError';
  }
}

export class RuntimeApiExecutionError extends RuntimeApiError {
  constructor(message: string) {
    super(message, 'RUNTIME_API_EXECUTION_ERROR');
    this.name = 'RuntimeApiExecutionError';
  }
}

export class RuntimeApiConfigurationError extends RuntimeApiError {
  constructor(message: string) {
    super(message, 'RUNTIME_API_CONFIGURATION_ERROR');
    this.name = 'RuntimeApiConfigurationError';
  }
}
