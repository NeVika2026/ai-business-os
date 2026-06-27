export class RunnerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'RunnerError';
  }
}

export class RunnerValidationError extends RunnerError {
  constructor(message: string) {
    super(message, 'RUNNER_VALIDATION_ERROR');
    this.name = 'RunnerValidationError';
  }
}

export class RunnerNotStartedError extends RunnerError {
  constructor(message = 'Runtime runner has no active run. Call start() first.') {
    super(message, 'RUNNER_NOT_STARTED');
    this.name = 'RunnerNotStartedError';
  }
}

export class RunnerInvalidStateError extends RunnerError {
  constructor(message: string) {
    super(message, 'RUNNER_INVALID_STATE');
    this.name = 'RunnerInvalidStateError';
  }
}

export class RunnerMaxStepsExceededError extends RunnerError {
  constructor(maxSteps: number) {
    super(`Runtime runner exceeded maximum steps: ${maxSteps}`, 'RUNNER_MAX_STEPS_EXCEEDED');
    this.name = 'RunnerMaxStepsExceededError';
  }
}
