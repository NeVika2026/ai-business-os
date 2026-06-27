export class HealthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'HealthError';
  }
}

export class HealthValidationError extends HealthError {
  constructor(message: string) {
    super(message, 'HEALTH_VALIDATION_ERROR');
    this.name = 'HealthValidationError';
  }
}
