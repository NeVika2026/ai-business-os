export class LocalAgentRunnerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocalAgentRunnerError';
  }
}

export class LocalAgentRunnerValidationError extends LocalAgentRunnerError {
  constructor(message: string) {
    super(message);
    this.name = 'LocalAgentRunnerValidationError';
  }
}

export class LocalAgentRunnerInvalidStateError extends LocalAgentRunnerError {
  constructor(message: string) {
    super(message);
    this.name = 'LocalAgentRunnerInvalidStateError';
  }
}
