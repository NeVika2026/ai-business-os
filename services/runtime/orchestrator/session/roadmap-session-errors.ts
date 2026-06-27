export class RoadmapSessionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'RoadmapSessionError';
  }
}

export class RoadmapSessionValidationError extends RoadmapSessionError {
  constructor(message: string) {
    super(message, 'ROADMAP_SESSION_VALIDATION_ERROR');
    this.name = 'RoadmapSessionValidationError';
  }
}

export class RoadmapSessionNotStartedError extends RoadmapSessionError {
  constructor(message = 'Roadmap session not started. Call start() first.') {
    super(message, 'ROADMAP_SESSION_NOT_STARTED');
    this.name = 'RoadmapSessionNotStartedError';
  }
}

export class RoadmapSessionInvalidStateError extends RoadmapSessionError {
  constructor(message: string) {
    super(message, 'ROADMAP_SESSION_INVALID_STATE');
    this.name = 'RoadmapSessionInvalidStateError';
  }
}
