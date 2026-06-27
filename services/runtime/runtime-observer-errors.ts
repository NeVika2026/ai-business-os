export class RuntimeObserverError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'RuntimeObserverError';
  }
}

export class RuntimeObserverValidationError extends RuntimeObserverError {
  constructor(message: string) {
    super(message, 'RUNTIME_OBSERVER_VALIDATION_ERROR');
    this.name = 'RuntimeObserverValidationError';
  }
}

export class RuntimeObserverConfigurationError extends RuntimeObserverError {
  constructor(message: string) {
    super(message, 'RUNTIME_OBSERVER_CONFIGURATION_ERROR');
    this.name = 'RuntimeObserverConfigurationError';
  }
}
