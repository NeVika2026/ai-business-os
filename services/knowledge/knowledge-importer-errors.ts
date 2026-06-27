export class KnowledgeImporterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'KnowledgeImporterError';
  }
}

export class KnowledgeImporterValidationError extends KnowledgeImporterError {
  constructor(message: string) {
    super(message, 'KNOWLEDGE_IMPORTER_VALIDATION_ERROR');
    this.name = 'KnowledgeImporterValidationError';
  }
}

export class KnowledgeImporterNotFoundError extends KnowledgeImporterError {
  constructor(message: string) {
    super(message, 'KNOWLEDGE_IMPORTER_NOT_FOUND');
    this.name = 'KnowledgeImporterNotFoundError';
  }
}

export class KnowledgeImporterFilesystemError extends KnowledgeImporterError {
  constructor(message: string) {
    super(message, 'KNOWLEDGE_IMPORTER_FILESYSTEM_ERROR');
    this.name = 'KnowledgeImporterFilesystemError';
  }
}
