export class KnowledgeVaultLoaderError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'KnowledgeVaultLoaderError';
  }
}

export class KnowledgeVaultLoaderValidationError extends KnowledgeVaultLoaderError {
  constructor(message: string) {
    super(message, 'KNOWLEDGE_VAULT_LOADER_VALIDATION_ERROR');
    this.name = 'KnowledgeVaultLoaderValidationError';
  }
}

export class KnowledgeVaultLoaderFilesystemError extends KnowledgeVaultLoaderError {
  constructor(message: string) {
    super(message, 'KNOWLEDGE_VAULT_LOADER_FILESYSTEM_ERROR');
    this.name = 'KnowledgeVaultLoaderFilesystemError';
  }
}

export class KnowledgeVaultLoaderWatchError extends KnowledgeVaultLoaderError {
  constructor(message: string) {
    super(message, 'KNOWLEDGE_VAULT_LOADER_WATCH_ERROR');
    this.name = 'KnowledgeVaultLoaderWatchError';
  }
}
