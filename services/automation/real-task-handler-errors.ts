export class RealTaskHandlerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RealTaskHandlerError';
  }
}

export class RealTaskHandlerValidationError extends RealTaskHandlerError {
  constructor(message: string) {
    super(message);
    this.name = 'RealTaskHandlerValidationError';
  }
}

export class RealTaskHandlerExecutionError extends RealTaskHandlerError {
  constructor(message: string) {
    super(message);
    this.name = 'RealTaskHandlerExecutionError';
  }
}

export class RealTaskHandlerRollbackError extends RealTaskHandlerError {
  constructor(message: string) {
    super(message);
    this.name = 'RealTaskHandlerRollbackError';
  }
}
