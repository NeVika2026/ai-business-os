export class MemoryEngineError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'MemoryEngineError';
  }
}

export class MemoryValidationError extends MemoryEngineError {
  constructor(message: string) {
    super(message, 'MEMORY_VALIDATION_ERROR');
    this.name = 'MemoryValidationError';
  }
}

export class MemoryNotFoundError extends MemoryEngineError {
  constructor(message: string) {
    super(message, 'MEMORY_NOT_FOUND');
    this.name = 'MemoryNotFoundError';
  }
}

export class MemoryConflictError extends MemoryEngineError {
  constructor(message: string) {
    super(message, 'MEMORY_CONFLICT');
    this.name = 'MemoryConflictError';
  }
}
