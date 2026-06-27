export class RuntimeEventError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'RuntimeEventError';
  }
}

export class RuntimeEventValidationError extends RuntimeEventError {
  constructor(message: string) {
    super(message, 'RUNTIME_EVENT_VALIDATION_ERROR');
    this.name = 'RuntimeEventValidationError';
  }
}

export class RuntimeEventSubscriptionNotFoundError extends RuntimeEventError {
  constructor(subscriptionId: string) {
    super(
      `Event subscription not found: ${subscriptionId}`,
      'RUNTIME_EVENT_SUBSCRIPTION_NOT_FOUND',
    );
    this.name = 'RuntimeEventSubscriptionNotFoundError';
  }
}
