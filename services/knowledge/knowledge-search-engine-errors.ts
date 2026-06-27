export class KnowledgeSearchEngineError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'KnowledgeSearchEngineError';
  }
}

export class KnowledgeSearchEngineValidationError extends KnowledgeSearchEngineError {
  constructor(message: string) {
    super(message, 'KNOWLEDGE_SEARCH_ENGINE_VALIDATION_ERROR');
    this.name = 'KnowledgeSearchEngineValidationError';
  }
}

export class KnowledgeSearchEngineNotFoundError extends KnowledgeSearchEngineError {
  constructor(message: string) {
    super(message, 'KNOWLEDGE_SEARCH_ENGINE_NOT_FOUND');
    this.name = 'KnowledgeSearchEngineNotFoundError';
  }
}
