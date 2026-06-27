export class AutonomousWorkerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AutonomousWorkerError';
  }
}

export class AutonomousWorkerValidationError extends AutonomousWorkerError {
  constructor(message: string) {
    super(message);
    this.name = 'AutonomousWorkerValidationError';
  }
}

export class AutonomousWorkerNotStartedError extends AutonomousWorkerError {
  constructor() {
    super('autonomous worker is not started');
    this.name = 'AutonomousWorkerNotStartedError';
  }
}

export class AutonomousWorkerInvalidStateError extends AutonomousWorkerError {
  constructor(message: string) {
    super(message);
    this.name = 'AutonomousWorkerInvalidStateError';
  }
}

export class AutonomousWorkerTaskNotFoundError extends AutonomousWorkerError {
  constructor(taskId: string) {
    super(`autonomous worker task not found: ${taskId}`);
    this.name = 'AutonomousWorkerTaskNotFoundError';
  }
}
