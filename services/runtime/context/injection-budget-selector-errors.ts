export class InjectionBudgetSelectorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InjectionBudgetSelectorError';
  }
}

export class InjectionBudgetSelectorValidationError extends InjectionBudgetSelectorError {
  constructor(message: string) {
    super(message);
    this.name = 'InjectionBudgetSelectorValidationError';
  }
}
