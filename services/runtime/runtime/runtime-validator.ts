import { RuntimeFacadeValidationError } from '@/services/runtime/runtime/runtime-errors';
import type {
  RuntimeExecuteRoadmapInput,
  RuntimeExecuteSprintInput,
  RuntimeExecutionContext,
} from '@/services/runtime/runtime/runtime-types';
import {
  validateRoadmapInput,
  validateSprintInput,
} from '@/services/runtime/orchestrator/roadmap/roadmap-validator';
import { validateHubRuntimeContext } from '@/services/runtime/orchestrator/hub/hub-validator';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateRuntimeExecutionContext(context: RuntimeExecutionContext): void {
  validateHubRuntimeContext(context);
}

export function validateRuntimeExecuteRoadmapInput(input: RuntimeExecuteRoadmapInput): void {
  if (!input || typeof input !== 'object') {
    throw new RuntimeFacadeValidationError('roadmap input must be an object');
  }

  validateRoadmapInput(input.roadmap);
  validateRuntimeExecutionContext(input.runtimeContext);
}

export function validateRuntimeExecuteSprintInput(input: RuntimeExecuteSprintInput): void {
  if (!input || typeof input !== 'object') {
    throw new RuntimeFacadeValidationError('sprint input must be an object');
  }

  validateSprintInput(input.sprint);

  const skipRuntime = input.skipRuntime ?? false;

  if (!skipRuntime) {
    validateRuntimeExecutionContext(input.runtimeContext);
  }
}

export function validateRuntimeInstanceId(instanceId: string): void {
  if (!isNonEmptyString(instanceId)) {
    throw new RuntimeFacadeValidationError('instanceId is required');
  }
}
