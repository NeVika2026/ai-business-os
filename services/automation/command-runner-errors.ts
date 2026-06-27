export class CommandRunnerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CommandRunnerError';
  }
}

export class CommandRunnerValidationError extends CommandRunnerError {
  constructor(message: string) {
    super(message);
    this.name = 'CommandRunnerValidationError';
  }
}
