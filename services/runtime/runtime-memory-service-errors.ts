export class RuntimeMemoryServiceAdapterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'RuntimeMemoryServiceAdapterError';
  }
}

export class RuntimeMemoryServiceValidationError extends RuntimeMemoryServiceAdapterError {
  constructor(message: string) {
    super(message, 'RUNTIME_MEMORY_SERVICE_VALIDATION_ERROR');
    this.name = 'RuntimeMemoryServiceValidationError';
  }
}

export class RuntimeMemoryServiceOperationError extends RuntimeMemoryServiceAdapterError {
  constructor(message: string) {
    super(message, 'RUNTIME_MEMORY_SERVICE_OPERATION_ERROR');
    this.name = 'RuntimeMemoryServiceOperationError';
  }
}
