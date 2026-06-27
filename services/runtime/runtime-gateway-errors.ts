export class RuntimeGatewayAdapterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'RuntimeGatewayAdapterError';
  }
}

export class RuntimeGatewayValidationError extends RuntimeGatewayAdapterError {
  constructor(message: string) {
    super(message, 'RUNTIME_GATEWAY_VALIDATION_ERROR');
    this.name = 'RuntimeGatewayValidationError';
  }
}

export class RuntimeGatewayNotSupportedError extends RuntimeGatewayAdapterError {
  constructor(feature: string) {
    super(`Gateway feature not supported: ${feature}`, 'RUNTIME_GATEWAY_NOT_SUPPORTED');
    this.name = 'RuntimeGatewayNotSupportedError';
  }
}
