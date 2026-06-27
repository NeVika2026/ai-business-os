export class RuntimeFacadeError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'RuntimeFacadeError';
  }
}

export class RuntimeFacadeValidationError extends RuntimeFacadeError {
  constructor(message: string) {
    super(message, 'RUNTIME_FACADE_VALIDATION_ERROR');
    this.name = 'RuntimeFacadeValidationError';
  }
}

export class RuntimeFacadeInvalidStateError extends RuntimeFacadeError {
  constructor(message: string) {
    super(message, 'RUNTIME_FACADE_INVALID_STATE');
    this.name = 'RuntimeFacadeInvalidStateError';
  }
}
