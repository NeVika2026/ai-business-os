export class RuntimeMemoryContextError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'RuntimeMemoryContextError';
  }
}

export class RuntimeMemoryContextValidationError extends RuntimeMemoryContextError {
  constructor(message: string) {
    super(message, 'RUNTIME_MEMORY_CONTEXT_VALIDATION_ERROR');
    this.name = 'RuntimeMemoryContextValidationError';
  }
}
