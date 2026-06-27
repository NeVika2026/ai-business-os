export class HubError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'HubError';
  }
}

export class HubValidationError extends HubError {
  constructor(message: string) {
    super(message, 'HUB_VALIDATION_ERROR');
    this.name = 'HubValidationError';
  }
}

export class HubInvalidStateError extends HubError {
  constructor(message: string) {
    super(message, 'HUB_INVALID_STATE');
    this.name = 'HubInvalidStateError';
  }
}

export class HubRuntimeContextRequiredError extends HubError {
  constructor() {
    super('runtimeContext is required when skipRuntime is false', 'HUB_RUNTIME_CONTEXT_REQUIRED');
    this.name = 'HubRuntimeContextRequiredError';
  }
}
