export class RuntimePipelineAdapterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'RuntimePipelineAdapterError';
  }
}

export class RuntimePipelineValidationError extends RuntimePipelineAdapterError {
  constructor(message: string) {
    super(message, 'RUNTIME_PIPELINE_VALIDATION_ERROR');
    this.name = 'RuntimePipelineValidationError';
  }
}

export class RuntimePipelineExecutionError extends RuntimePipelineAdapterError {
  constructor(message: string) {
    super(message, 'RUNTIME_PIPELINE_EXECUTION_ERROR');
    this.name = 'RuntimePipelineExecutionError';
  }
}
