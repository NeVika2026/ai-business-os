export class CostError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'CostError';
  }
}

export class CostValidationError extends CostError {
  constructor(message: string) {
    super(message, 'COST_VALIDATION_ERROR');
    this.name = 'CostValidationError';
  }
}

export class CostEntryNotFoundError extends CostError {
  constructor(id: string) {
    super(`Cost entry not found: ${id}`, 'COST_ENTRY_NOT_FOUND');
    this.name = 'CostEntryNotFoundError';
  }
}

export class CostPricingNotFoundError extends CostError {
  constructor(providerCode: string, modelCode: string) {
    super(`Pricing not found for ${providerCode}/${modelCode}`, 'COST_PRICING_NOT_FOUND');
    this.name = 'CostPricingNotFoundError';
  }
}
