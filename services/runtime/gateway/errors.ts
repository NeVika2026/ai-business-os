export class GatewayError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'GatewayError';
  }
}

export class ProviderNotFoundError extends GatewayError {
  constructor(providerCode: string) {
    super(`Provider not found: ${providerCode}`, 'ProviderNotFound');
    this.name = 'ProviderNotFoundError';
  }
}

export class ModelNotSupportedError extends GatewayError {
  constructor(providerCode: string, modelCode: string) {
    super(`Model not supported: ${providerCode}/${modelCode}`, 'ModelNotSupported');
    this.name = 'ModelNotSupportedError';
  }
}

export class ProviderUnavailableError extends GatewayError {
  constructor(providerCode: string, reason?: string) {
    super(
      reason
        ? `Provider unavailable: ${providerCode} (${reason})`
        : `Provider unavailable: ${providerCode}`,
      'ProviderUnavailable',
    );
    this.name = 'ProviderUnavailableError';
  }
}

export class GatewayTimeoutError extends GatewayError {
  constructor(timeoutMs: number) {
    super(`Gateway request timed out after ${timeoutMs}ms`, 'GatewayTimeout');
    this.name = 'GatewayTimeoutError';
  }
}

export class InvalidGatewayRequestError extends GatewayError {
  constructor(message: string) {
    super(message, 'InvalidGatewayRequest');
    this.name = 'InvalidGatewayRequestError';
  }
}

export class NoAllowedModelProviderError extends GatewayError {
  constructor() {
    super('Не удалось подготовить результат. Попробуйте позже.', 'NoAllowedModelProvider');
    this.name = 'NoAllowedModelProviderError';
  }
}
