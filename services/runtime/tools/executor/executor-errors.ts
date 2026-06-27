export class ToolExecutorError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'ToolExecutorError';
  }
}

export class ToolValidationError extends ToolExecutorError {
  constructor(message: string) {
    super(message, 'TOOL_VALIDATION_ERROR');
    this.name = 'ToolValidationError';
  }
}

export class ToolExecutionError extends ToolExecutorError {
  constructor(message: string) {
    super(message, 'TOOL_EXECUTION_ERROR');
    this.name = 'ToolExecutionError';
  }
}

export class ToolNotFoundError extends ToolExecutorError {
  constructor(toolId: string) {
    super(`Tool not found: ${toolId}`, 'TOOL_NOT_FOUND');
    this.name = 'ToolNotFoundError';
  }
}

export class ToolPermissionDeniedError extends ToolExecutorError {
  constructor(message: string) {
    super(message, 'TOOL_PERMISSION_DENIED');
    this.name = 'ToolPermissionDeniedError';
  }
}

export class ToolApprovalRequiredError extends ToolExecutorError {
  constructor(message: string) {
    super(message, 'TOOL_APPROVAL_REQUIRED');
    this.name = 'ToolApprovalRequiredError';
  }
}
