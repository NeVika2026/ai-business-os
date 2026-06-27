export class MemoryExtractorError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'MemoryExtractorError';
  }
}

export class MemoryExtractorValidationError extends MemoryExtractorError {
  constructor(message: string) {
    super(message, 'MEMORY_EXTRACTOR_VALIDATION_ERROR');
    this.name = 'MemoryExtractorValidationError';
  }
}
