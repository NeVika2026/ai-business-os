import {
  HubRuntimeContextRequiredError,
  HubValidationError,
} from '@/services/runtime/orchestrator/hub/hub-errors';
import type {
  HubRuntimeContext,
  HubSprintInput,
} from '@/services/runtime/orchestrator/hub/hub-types';
import { validateSprintInput } from '@/services/runtime/orchestrator/roadmap/roadmap-validator';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

export function validateHubRuntimeContext(context: HubRuntimeContext): void {
  if (!context || typeof context !== 'object') {
    throw new HubValidationError('runtimeContext must be an object');
  }

  if (!isNonEmptyString(context.organizationId)) {
    throw new HubValidationError('runtimeContext.organizationId is required');
  }

  if (!isNonEmptyString(context.employeeId)) {
    throw new HubValidationError('runtimeContext.employeeId is required');
  }

  if (!isNonEmptyString(context.runId)) {
    throw new HubValidationError('runtimeContext.runId is required');
  }

  if (!isNonEmptyString(context.traceId)) {
    throw new HubValidationError('runtimeContext.traceId is required');
  }

  if (context.startedAt !== undefined && !isValidIsoDate(context.startedAt)) {
    throw new HubValidationError('runtimeContext.startedAt must be a valid ISO timestamp');
  }
}

export function validateHubSprintInput(input: HubSprintInput): void {
  if (!input || typeof input !== 'object') {
    throw new HubValidationError('sprint input must be an object');
  }

  validateSprintInput(input.sprint);

  const skipRuntime = input.skipRuntime ?? false;

  if (!skipRuntime && !input.runtimeContext) {
    throw new HubRuntimeContextRequiredError();
  }

  if (input.runtimeContext) {
    validateHubRuntimeContext(input.runtimeContext);
  }
}
