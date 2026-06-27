export class RoadmapTaskExecutorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoadmapTaskExecutorError';
  }
}

export class RoadmapTaskExecutorValidationError extends RoadmapTaskExecutorError {
  constructor(message: string) {
    super(message);
    this.name = 'RoadmapTaskExecutorValidationError';
  }
}

export class RoadmapTaskExecutorExecutionError extends RoadmapTaskExecutorError {
  constructor(message: string) {
    super(message);
    this.name = 'RoadmapTaskExecutorExecutionError';
  }
}
