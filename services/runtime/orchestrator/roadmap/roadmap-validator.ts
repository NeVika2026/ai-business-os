import { RoadmapValidationError } from '@/services/runtime/orchestrator/roadmap/roadmap-errors';
import type {
  RoadmapInput,
  RoadmapSprintInput,
} from '@/services/runtime/orchestrator/roadmap/roadmap-types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateSprint(sprint: RoadmapSprintInput, index: number): void {
  if (!isNonEmptyString(sprint.id)) {
    throw new RoadmapValidationError(`sprints[${index}].id is required`);
  }

  if (!isNonEmptyString(sprint.title)) {
    throw new RoadmapValidationError(`sprints[${index}].title is required`);
  }

  if (!isNonEmptyString(sprint.code)) {
    throw new RoadmapValidationError(`sprints[${index}].code is required`);
  }

  if (sprint.dependsOn !== undefined) {
    if (!Array.isArray(sprint.dependsOn)) {
      throw new RoadmapValidationError(`sprints[${index}].dependsOn must be an array`);
    }

    for (const dep of sprint.dependsOn) {
      if (!isNonEmptyString(dep)) {
        throw new RoadmapValidationError(`sprints[${index}].dependsOn contains invalid id`);
      }
    }
  }
}

function detectSprintDependencyCycle(sprints: RoadmapSprintInput[]): void {
  const sprintIds = new Set(sprints.map((sprint) => sprint.id));
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const depsById = new Map<string, string[]>(
    sprints.map((sprint) => [sprint.id, sprint.dependsOn ?? []]),
  );

  function visit(sprintId: string): void {
    if (visited.has(sprintId)) {
      return;
    }

    if (visiting.has(sprintId)) {
      throw new RoadmapValidationError(`sprint dependency cycle detected at: ${sprintId}`);
    }

    visiting.add(sprintId);

    for (const depId of depsById.get(sprintId) ?? []) {
      if (!sprintIds.has(depId)) {
        throw new RoadmapValidationError(`sprint ${sprintId} depends on unknown sprint: ${depId}`);
      }

      visit(depId);
    }

    visiting.delete(sprintId);
    visited.add(sprintId);
  }

  for (const sprint of sprints) {
    visit(sprint.id);
  }
}

export function validateRoadmapInput(roadmap: RoadmapInput): void {
  if (!roadmap || typeof roadmap !== 'object') {
    throw new RoadmapValidationError('roadmap must be an object');
  }

  if (!isNonEmptyString(roadmap.id)) {
    throw new RoadmapValidationError('roadmap.id is required');
  }

  if (!isNonEmptyString(roadmap.title)) {
    throw new RoadmapValidationError('roadmap.title is required');
  }

  if (!Array.isArray(roadmap.sprints) || roadmap.sprints.length === 0) {
    throw new RoadmapValidationError('roadmap.sprints must be a non-empty array');
  }

  const ids = new Set<string>();

  roadmap.sprints.forEach((sprint, index) => {
    validateSprint(sprint, index);

    if (ids.has(sprint.id)) {
      throw new RoadmapValidationError(`duplicate sprint id: ${sprint.id}`);
    }

    ids.add(sprint.id);
  });

  detectSprintDependencyCycle(roadmap.sprints);
}

export function validateSprintInput(sprint: RoadmapSprintInput): void {
  validateSprint(sprint, 0);
}
