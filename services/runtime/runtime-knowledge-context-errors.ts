export class RuntimeKnowledgeContextError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'RuntimeKnowledgeContextError';
  }
}

export class RuntimeKnowledgeContextValidationError extends RuntimeKnowledgeContextError {
  constructor(message: string) {
    super(message, 'RUNTIME_KNOWLEDGE_CONTEXT_VALIDATION_ERROR');
    this.name = 'RuntimeKnowledgeContextValidationError';
  }
}
