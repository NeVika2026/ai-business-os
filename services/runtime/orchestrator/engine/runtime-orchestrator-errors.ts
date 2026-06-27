export class OrchestratorError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'OrchestratorError';
  }
}

export class OrchestratorValidationError extends OrchestratorError {
  constructor(message: string) {
    super(message, 'ORCHESTRATOR_VALIDATION_ERROR');
    this.name = 'OrchestratorValidationError';
  }
}

export class OrchestratorNotStartedError extends OrchestratorError {
  constructor(message = 'Orchestrator has no active run. Call start() first.') {
    super(message, 'ORCHESTRATOR_NOT_STARTED');
    this.name = 'OrchestratorNotStartedError';
  }
}

export class OrchestratorNotFoundError extends OrchestratorError {
  constructor(runId: string) {
    super(`Orchestrator runtime not found for runId: ${runId}`, 'ORCHESTRATOR_NOT_FOUND');
    this.name = 'OrchestratorNotFoundError';
  }
}

export class OrchestratorInvalidStateError extends OrchestratorError {
  constructor(message: string) {
    super(message, 'ORCHESTRATOR_INVALID_STATE');
    this.name = 'OrchestratorInvalidStateError';
  }
}

export class OrchestratorPlanningError extends OrchestratorError {
  constructor(message: string) {
    super(message, 'ORCHESTRATOR_PLANNING_ERROR');
    this.name = 'OrchestratorPlanningError';
  }
}
