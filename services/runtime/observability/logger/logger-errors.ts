export class LoggerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'LoggerError';
  }
}

export class LoggerValidationError extends LoggerError {
  constructor(message: string) {
    super(message, 'LOGGER_VALIDATION_ERROR');
    this.name = 'LoggerValidationError';
  }
}

export class LogEntryNotFoundError extends LoggerError {
  constructor(id: string) {
    super(`Log entry not found: ${id}`, 'LOG_ENTRY_NOT_FOUND');
    this.name = 'LogEntryNotFoundError';
  }
}
