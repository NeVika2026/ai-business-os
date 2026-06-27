export class RuntimeKnowledgeAdapterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'RuntimeKnowledgeAdapterError';
  }
}

export class RuntimeKnowledgeValidationError extends RuntimeKnowledgeAdapterError {
  constructor(message: string) {
    super(message, 'RUNTIME_KNOWLEDGE_VALIDATION_ERROR');
    this.name = 'RuntimeKnowledgeValidationError';
  }
}

export class RuntimeKnowledgeNotFoundError extends RuntimeKnowledgeAdapterError {
  constructor(message: string) {
    super(message, 'RUNTIME_KNOWLEDGE_NOT_FOUND');
    this.name = 'RuntimeKnowledgeNotFoundError';
  }
}

export class RuntimeKnowledgeOperationError extends RuntimeKnowledgeAdapterError {
  constructor(message: string) {
    super(message, 'RUNTIME_KNOWLEDGE_OPERATION_ERROR');
    this.name = 'RuntimeKnowledgeOperationError';
  }
}
