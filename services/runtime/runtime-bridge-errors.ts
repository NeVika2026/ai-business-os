export class RuntimeBridgeError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'RuntimeBridgeError';
  }
}

export class RuntimeBridgeValidationError extends RuntimeBridgeError {
  constructor(message: string) {
    super(message, 'RUNTIME_BRIDGE_VALIDATION_ERROR');
    this.name = 'RuntimeBridgeValidationError';
  }
}

export class RuntimeBridgeInvalidStateError extends RuntimeBridgeError {
  constructor(message: string) {
    super(message, 'RUNTIME_BRIDGE_INVALID_STATE');
    this.name = 'RuntimeBridgeInvalidStateError';
  }
}
