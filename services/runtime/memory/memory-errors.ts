export class MemoryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'MemoryError';
  }
}

export class MemoryValidationError extends MemoryError {
  constructor(message: string) {
    super(message, 'MEMORY_VALIDATION_ERROR');
    this.name = 'MemoryValidationError';
  }
}

export class MemoryNotLoadedError extends MemoryError {
  constructor(
    message = 'Memory Manager must be loaded before retrieve, store, prune, or serialize',
  ) {
    super(message, 'MEMORY_NOT_LOADED');
    this.name = 'MemoryNotLoadedError';
  }
}

export class MemoryScopeMismatchError extends MemoryError {
  constructor(message: string) {
    super(message, 'MEMORY_SCOPE_MISMATCH');
    this.name = 'MemoryScopeMismatchError';
  }
}

export class MemoryDisabledError extends MemoryError {
  constructor(message = 'Memory is disabled for this employee') {
    super(message, 'MEMORY_DISABLED');
    this.name = 'MemoryDisabledError';
  }
}
