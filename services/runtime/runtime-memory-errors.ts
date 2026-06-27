export class RuntimeMemoryAdapterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'RuntimeMemoryAdapterError';
  }
}

export class RuntimeMemoryValidationError extends RuntimeMemoryAdapterError {
  constructor(message: string) {
    super(message, 'RUNTIME_MEMORY_VALIDATION_ERROR');
    this.name = 'RuntimeMemoryValidationError';
  }
}

export class RuntimeMemoryRequestError extends RuntimeMemoryAdapterError {
  constructor(message: string) {
    super(message, 'RUNTIME_MEMORY_REQUEST_ERROR');
    this.name = 'RuntimeMemoryRequestError';
  }
}

export class RuntimeMemoryNotLoadedError extends RuntimeMemoryAdapterError {
  constructor(
    message = 'Memory context must be loaded before write, search, delete, or serialize',
  ) {
    super(message, 'RUNTIME_MEMORY_NOT_LOADED');
    this.name = 'RuntimeMemoryNotLoadedError';
  }
}

export class RuntimeMemoryOperationError extends RuntimeMemoryAdapterError {
  constructor(message: string) {
    super(message, 'RUNTIME_MEMORY_OPERATION_ERROR');
    this.name = 'RuntimeMemoryOperationError';
  }
}
