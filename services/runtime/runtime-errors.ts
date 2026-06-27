export class RuntimeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RuntimeValidationError';
  }
}

export class ContextBuildError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ContextBuildError';
  }
}

export class PromptCompileError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'PromptCompileError';
  }
}

export class GatewayExecutionError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'GatewayExecutionError';
  }
}
