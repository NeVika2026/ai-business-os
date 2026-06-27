export class AITaskExecutorAdapterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AITaskExecutorAdapterError';
  }
}

export class AITaskExecutorAdapterValidationError extends AITaskExecutorAdapterError {
  constructor(message: string) {
    super(message);
    this.name = 'AITaskExecutorAdapterValidationError';
  }
}

export class AITaskExecutorAdapterExecutionError extends AITaskExecutorAdapterError {
  constructor(message: string) {
    super(message);
    this.name = 'AITaskExecutorAdapterExecutionError';
  }
}

export class AITaskExecutorAdapterInvalidStateError extends AITaskExecutorAdapterError {
  constructor(message: string) {
    super(message);
    this.name = 'AITaskExecutorAdapterInvalidStateError';
  }
}
