import { RuntimeEventValidationError } from '@/services/runtime/orchestrator/events/runtime-event-errors';
import type { RuntimeEventInput } from '@/services/runtime/orchestrator/events/runtime-event-types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateEventInput(input: RuntimeEventInput): void {
  if (!input || typeof input !== 'object') {
    throw new RuntimeEventValidationError('event must be an object');
  }

  if (!isNonEmptyString(input.type)) {
    throw new RuntimeEventValidationError('event.type is required');
  }

  if (!isNonEmptyString(input.organizationId)) {
    throw new RuntimeEventValidationError('event.organizationId is required');
  }

  if (!isNonEmptyString(input.employeeId)) {
    throw new RuntimeEventValidationError('event.employeeId is required');
  }

  if (!isNonEmptyString(input.traceId)) {
    throw new RuntimeEventValidationError('event.traceId is required');
  }

  if (!isNonEmptyString(input.runId)) {
    throw new RuntimeEventValidationError('event.runId is required');
  }

  if (!isNonEmptyString(input.source)) {
    throw new RuntimeEventValidationError('event.source is required');
  }

  if (input.timestamp !== undefined && !isValidIsoDate(input.timestamp)) {
    throw new RuntimeEventValidationError('event.timestamp must be a valid ISO timestamp');
  }

  if (input.spanId !== undefined && input.spanId !== null && !isNonEmptyString(input.spanId)) {
    throw new RuntimeEventValidationError('event.spanId must be a non-empty string or null');
  }

  if (input.payload !== undefined && !isPlainObject(input.payload)) {
    throw new RuntimeEventValidationError('event.payload must be a plain object');
  }

  if (input.metadata !== undefined && !isPlainObject(input.metadata)) {
    throw new RuntimeEventValidationError('event.metadata must be a plain object');
  }
}

export function validateEventType(type: string): void {
  if (!isNonEmptyString(type)) {
    throw new RuntimeEventValidationError('subscription type is required');
  }
}

export function validateSubscriptionId(subscriptionId: string): void {
  if (!isNonEmptyString(subscriptionId)) {
    throw new RuntimeEventValidationError('subscriptionId is required');
  }
}
