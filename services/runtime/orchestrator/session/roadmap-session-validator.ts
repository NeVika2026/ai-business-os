import { RoadmapSessionValidationError } from '@/services/runtime/orchestrator/session/roadmap-session-errors';
import type { RoadmapSessionStartInput } from '@/services/runtime/orchestrator/session/roadmap-session-types';
import { validateRoadmapInput } from '@/services/runtime/orchestrator/roadmap/roadmap-validator';
import { validateHubRuntimeContext } from '@/services/runtime/orchestrator/hub/hub-validator';

export function validateRoadmapSessionStartInput(input: RoadmapSessionStartInput): void {
  if (!input || typeof input !== 'object') {
    throw new RoadmapSessionValidationError('start input must be an object');
  }

  validateRoadmapInput(input.roadmap);

  const skipRuntime = input.skipRuntime ?? false;

  if (!skipRuntime && !input.runtimeContext) {
    throw new RoadmapSessionValidationError('runtimeContext is required when skipRuntime is false');
  }

  if (input.runtimeContext) {
    validateHubRuntimeContext(input.runtimeContext);
  }
}

export function validateMaxSprintsPerRun(maxSprints: number): void {
  if (!Number.isInteger(maxSprints) || maxSprints <= 0) {
    throw new RoadmapSessionValidationError('maxSprintsPerRun must be a positive integer');
  }
}
