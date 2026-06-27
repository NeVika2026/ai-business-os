import type { BuildContextInput } from '@/services/runtime/context/types';

export class ContextValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContextValidationError';
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateBuildContextInput(input: BuildContextInput): void {
  if (!isNonEmptyString(input.scope.organizationId)) {
    throw new ContextValidationError('organizationId is required');
  }

  if (!isNonEmptyString(input.employeeId)) {
    throw new ContextValidationError('employeeId is required');
  }

  if (!input.request || !isNonEmptyString(input.request.action)) {
    throw new ContextValidationError('request.action is required');
  }

  if (!input.request.payload || typeof input.request.payload !== 'object') {
    throw new ContextValidationError('request.payload must be an object');
  }

  if (!isNonEmptyString(input.trace.runId)) {
    throw new ContextValidationError('trace.runId is required');
  }

  if (!isNonEmptyString(input.trace.correlationId)) {
    throw new ContextValidationError('trace.correlationId is required');
  }

  if (!isNonEmptyString(input.trace.traceId)) {
    throw new ContextValidationError('trace.traceId is required');
  }
}
