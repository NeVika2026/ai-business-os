export class AutomationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'AutomationError';
  }
}

export class AutomationValidationError extends AutomationError {
  constructor(message: string) {
    super(message, 'AUTOMATION_VALIDATION_ERROR');
    this.name = 'AutomationValidationError';
  }
}

export class AutomationNotStartedError extends AutomationError {
  constructor(message = 'Automation controller has no active plan. Call start() first.') {
    super(message, 'AUTOMATION_NOT_STARTED');
    this.name = 'AutomationNotStartedError';
  }
}

export class AutomationInvalidStateError extends AutomationError {
  constructor(message: string) {
    super(message, 'AUTOMATION_INVALID_STATE');
    this.name = 'AutomationInvalidStateError';
  }
}
