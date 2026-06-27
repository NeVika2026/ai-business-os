export class ToolRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolRegistryError';
  }
}

export class DuplicateToolError extends ToolRegistryError {
  constructor(toolId: string) {
    super(`Tool already registered: ${toolId}`);
    this.name = 'DuplicateToolError';
  }
}

export class InvalidToolRegistrationError extends ToolRegistryError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidToolRegistrationError';
  }
}

export class ToolNotFoundError extends ToolRegistryError {
  constructor(toolId: string) {
    super(`Tool not found: ${toolId}`);
    this.name = 'ToolNotFoundError';
  }
}
