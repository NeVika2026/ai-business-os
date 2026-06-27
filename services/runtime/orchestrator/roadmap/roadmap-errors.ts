export class RoadmapError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'RoadmapError';
  }
}

export class RoadmapValidationError extends RoadmapError {
  constructor(message: string) {
    super(message, 'ROADMAP_VALIDATION_ERROR');
    this.name = 'RoadmapValidationError';
  }
}

export class RoadmapNotFoundError extends RoadmapError {
  constructor(roadmapId: string) {
    super(`Roadmap not found: ${roadmapId}`, 'ROADMAP_NOT_FOUND');
    this.name = 'RoadmapNotFoundError';
  }
}

export class RoadmapSprintNotFoundError extends RoadmapError {
  constructor(sprintId: string) {
    super(`Roadmap sprint not found: ${sprintId}`, 'ROADMAP_SPRINT_NOT_FOUND');
    this.name = 'RoadmapSprintNotFoundError';
  }
}
