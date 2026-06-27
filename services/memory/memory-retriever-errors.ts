export class MemoryRetrieverValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MemoryRetrieverValidationError';
  }
}
