export class MemoryImportanceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MemoryImportanceValidationError';
  }
}

export class MemoryImportanceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MemoryImportanceNotFoundError';
  }
}
