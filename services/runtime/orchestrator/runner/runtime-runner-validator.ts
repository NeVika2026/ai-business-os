import { RunnerValidationError } from '@/services/runtime/orchestrator/runner/runtime-runner-errors';
import type { RunnerStartContext } from '@/services/runtime/orchestrator/runner/runtime-runner-types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

export function validateRunnerStartContext(context: RunnerStartContext): void {
  if (!context || typeof context !== 'object') {
    throw new RunnerValidationError('start context must be an object');
  }

  if (!isNonEmptyString(context.organizationId)) {
    throw new RunnerValidationError('organizationId is required');
  }

  if (!isNonEmptyString(context.employeeId)) {
    throw new RunnerValidationError('employeeId is required');
  }

  if (!isNonEmptyString(context.runId)) {
    throw new RunnerValidationError('runId is required');
  }

  if (!isNonEmptyString(context.traceId)) {
    throw new RunnerValidationError('traceId is required');
  }

  if (context.startedAt !== undefined && !isValidIsoDate(context.startedAt)) {
    throw new RunnerValidationError('startedAt must be a valid ISO timestamp');
  }
}

export function validateMaxSteps(maxSteps: number): void {
  if (!Number.isInteger(maxSteps) || maxSteps <= 0) {
    throw new RunnerValidationError('maxSteps must be a positive integer');
  }
}
