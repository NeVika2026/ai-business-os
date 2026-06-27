export class RuntimePromptAdapterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'RuntimePromptAdapterError';
  }
}

export class RuntimePromptValidationError extends RuntimePromptAdapterError {
  constructor(message: string) {
    super(message, 'RUNTIME_PROMPT_VALIDATION_ERROR');
    this.name = 'RuntimePromptValidationError';
  }
}

export class RuntimePromptCompileError extends RuntimePromptAdapterError {
  constructor(message: string) {
    super(message, 'RUNTIME_PROMPT_COMPILE_ERROR');
    this.name = 'RuntimePromptCompileError';
  }
}
