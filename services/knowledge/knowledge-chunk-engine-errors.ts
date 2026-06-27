export class KnowledgeChunkEngineError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'KnowledgeChunkEngineError';
  }
}

export class KnowledgeChunkEngineValidationError extends KnowledgeChunkEngineError {
  constructor(message: string) {
    super(message, 'KNOWLEDGE_CHUNK_ENGINE_VALIDATION_ERROR');
    this.name = 'KnowledgeChunkEngineValidationError';
  }
}
