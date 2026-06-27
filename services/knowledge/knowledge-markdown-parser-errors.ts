export class KnowledgeMarkdownParserError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'KnowledgeMarkdownParserError';
  }
}

export class KnowledgeMarkdownParserValidationError extends KnowledgeMarkdownParserError {
  constructor(message: string) {
    super(message, 'KNOWLEDGE_MARKDOWN_PARSER_VALIDATION_ERROR');
    this.name = 'KnowledgeMarkdownParserValidationError';
  }
}
