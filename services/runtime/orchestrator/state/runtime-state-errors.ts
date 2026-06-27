export class RuntimeStateError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'RuntimeStateError';
  }
}

export class RuntimeStateValidationError extends RuntimeStateError {
  constructor(message: string) {
    super(message, 'RUNTIME_STATE_VALIDATION_ERROR');
    this.name = 'RuntimeStateValidationError';
  }
}

export class InvalidRuntimeTransitionError extends RuntimeStateError {
  constructor(from: string, to: string) {
    super(`Invalid runtime transition: ${from} → ${to}`, 'INVALID_RUNTIME_TRANSITION');
    this.name = 'InvalidRuntimeTransitionError';
  }
}

export class RuntimeStateNotActiveError extends RuntimeStateError {
  constructor(message = 'Runtime state machine has no active run. Call create() first.') {
    super(message, 'RUNTIME_STATE_NOT_ACTIVE');
    this.name = 'RuntimeStateNotActiveError';
  }
}

export class RuntimeStateNotFoundError extends RuntimeStateError {
  constructor(runId: string) {
    super(`Runtime state not found for runId: ${runId}`, 'RUNTIME_STATE_NOT_FOUND');
    this.name = 'RuntimeStateNotFoundError';
  }
}
