export class RuntimeValidatorError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'RuntimeValidatorError';
  }
}

export class RuntimeValidatorConfigurationError extends RuntimeValidatorError {
  constructor(message: string) {
    super(message, 'RUNTIME_VALIDATOR_CONFIGURATION_ERROR');
    this.name = 'RuntimeValidatorConfigurationError';
  }
}

export class RuntimeValidatorCheckError extends RuntimeValidatorError {
  constructor(message: string) {
    super(message, 'RUNTIME_VALIDATOR_CHECK_ERROR');
    this.name = 'RuntimeValidatorCheckError';
  }
}
