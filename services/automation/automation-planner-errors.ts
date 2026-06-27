export class AutomationPlannerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AutomationPlannerError';
  }
}

export class AutomationPlannerValidationError extends AutomationPlannerError {
  constructor(message: string) {
    super(message);
    this.name = 'AutomationPlannerValidationError';
  }
}

export class AutomationPlannerNotPlannedError extends AutomationPlannerError {
  constructor() {
    super('automation planner has no active plan');
    this.name = 'AutomationPlannerNotPlannedError';
  }
}
