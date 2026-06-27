export class CoordinatorError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'CoordinatorError';
  }
}

export class CoordinatorValidationError extends CoordinatorError {
  constructor(message: string) {
    super(message, 'COORDINATOR_VALIDATION_ERROR');
    this.name = 'CoordinatorValidationError';
  }
}

export class CoordinatorNotStartedError extends CoordinatorError {
  constructor(message = 'Runtime coordinator has no active run. Call start() first.') {
    super(message, 'COORDINATOR_NOT_STARTED');
    this.name = 'CoordinatorNotStartedError';
  }
}

export class CoordinatorInvalidStateError extends CoordinatorError {
  constructor(message: string) {
    super(message, 'COORDINATOR_INVALID_STATE');
    this.name = 'CoordinatorInvalidStateError';
  }
}

export class CoordinatorNotFoundError extends CoordinatorError {
  constructor(runId: string) {
    super(`Coordinator record not found for runId: ${runId}`, 'COORDINATOR_NOT_FOUND');
    this.name = 'CoordinatorNotFoundError';
  }
}
