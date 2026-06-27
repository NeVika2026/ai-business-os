export class KnowledgeIndexError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'KnowledgeIndexError';
  }
}

export class KnowledgeIndexValidationError extends KnowledgeIndexError {
  constructor(message: string) {
    super(message, 'KNOWLEDGE_INDEX_VALIDATION_ERROR');
    this.name = 'KnowledgeIndexValidationError';
  }
}

export class KnowledgeIndexNotFoundError extends KnowledgeIndexError {
  constructor(message: string) {
    super(message, 'KNOWLEDGE_INDEX_NOT_FOUND');
    this.name = 'KnowledgeIndexNotFoundError';
  }
}
