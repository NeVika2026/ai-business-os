export class RuntimeToolAdapterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'RuntimeToolAdapterError';
  }
}

export class RuntimeToolValidationError extends RuntimeToolAdapterError {
  constructor(message: string) {
    super(message, 'RUNTIME_TOOL_VALIDATION_ERROR');
    this.name = 'RuntimeToolValidationError';
  }
}

export class RuntimeToolRequestError extends RuntimeToolAdapterError {
  constructor(message: string) {
    super(message, 'RUNTIME_TOOL_REQUEST_ERROR');
    this.name = 'RuntimeToolRequestError';
  }
}
