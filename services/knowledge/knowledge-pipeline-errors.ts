export class KnowledgePipelineError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'KnowledgePipelineError';
  }
}

export class KnowledgePipelineValidationError extends KnowledgePipelineError {
  constructor(message: string) {
    super(message, 'KNOWLEDGE_PIPELINE_VALIDATION_ERROR');
    this.name = 'KnowledgePipelineValidationError';
  }
}

export class KnowledgePipelineIngestError extends KnowledgePipelineError {
  constructor(message: string) {
    super(message, 'KNOWLEDGE_PIPELINE_INGEST_ERROR');
    this.name = 'KnowledgePipelineIngestError';
  }
}

export class KnowledgePipelineNotFoundError extends KnowledgePipelineError {
  constructor(message: string) {
    super(message, 'KNOWLEDGE_PIPELINE_NOT_FOUND');
    this.name = 'KnowledgePipelineNotFoundError';
  }
}
