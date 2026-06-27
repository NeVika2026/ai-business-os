export class KnowledgeIngestServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'KnowledgeIngestServiceError';
  }
}

export class KnowledgeIngestServiceValidationError extends KnowledgeIngestServiceError {
  constructor(message: string) {
    super(message, 'KNOWLEDGE_INGEST_SERVICE_VALIDATION_ERROR');
    this.name = 'KnowledgeIngestServiceValidationError';
  }
}

export class KnowledgeIngestServiceFilesystemError extends KnowledgeIngestServiceError {
  constructor(message: string) {
    super(message, 'KNOWLEDGE_INGEST_SERVICE_FILESYSTEM_ERROR');
    this.name = 'KnowledgeIngestServiceFilesystemError';
  }
}
