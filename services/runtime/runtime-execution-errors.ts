export class RuntimeExecutionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'RuntimeExecutionError';
  }
}

export class RuntimeExecutionValidationError extends RuntimeExecutionError {
  constructor(message: string) {
    super(message, 'RUNTIME_EXECUTION_VALIDATION_ERROR');
    this.name = 'RuntimeExecutionValidationError';
  }
}

export class RuntimeExecutionStageError extends RuntimeExecutionError {
  constructor(
    message: string,
    public readonly stage: string,
  ) {
    super(message, 'RUNTIME_EXECUTION_STAGE_ERROR');
    this.name = 'RuntimeExecutionStageError';
  }
}
