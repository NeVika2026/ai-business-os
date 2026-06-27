export class MemoryServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'MemoryServiceError';
  }
}

export class MemoryServiceValidationError extends MemoryServiceError {
  constructor(message: string) {
    super(message, 'MEMORY_SERVICE_VALIDATION_ERROR');
    this.name = 'MemoryServiceValidationError';
  }
}

export class MemoryServiceProcessError extends MemoryServiceError {
  constructor(message: string) {
    super(message, 'MEMORY_SERVICE_PROCESS_ERROR');
    this.name = 'MemoryServiceProcessError';
  }
}
