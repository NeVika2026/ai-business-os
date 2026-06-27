export class MetricsError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'MetricsError';
  }
}

export class MetricsValidationError extends MetricsError {
  constructor(message: string) {
    super(message, 'METRICS_VALIDATION_ERROR');
    this.name = 'MetricsValidationError';
  }
}

export class MetricsRecordNotFoundError extends MetricsError {
  constructor(id: string) {
    super(`Metric record not found: ${id}`, 'METRICS_RECORD_NOT_FOUND');
    this.name = 'MetricsRecordNotFoundError';
  }
}
