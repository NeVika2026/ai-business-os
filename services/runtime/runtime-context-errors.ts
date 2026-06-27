export class RuntimeContextAdapterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'RuntimeContextAdapterError';
  }
}

export class RuntimeContextValidationError extends RuntimeContextAdapterError {
  constructor(message: string) {
    super(message, 'RUNTIME_CONTEXT_VALIDATION_ERROR');
    this.name = 'RuntimeContextValidationError';
  }
}

export class RuntimeContextBuildError extends RuntimeContextAdapterError {
  constructor(message: string) {
    super(message, 'RUNTIME_CONTEXT_BUILD_ERROR');
    this.name = 'RuntimeContextBuildError';
  }
}
