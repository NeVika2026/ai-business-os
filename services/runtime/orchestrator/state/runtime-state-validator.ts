import { RuntimeStateValidationError } from '@/services/runtime/orchestrator/state/runtime-state-errors';
import type {
  RuntimeState,
  RuntimeStateCreateContext,
} from '@/services/runtime/orchestrator/state/runtime-state-types';
import { RUNTIME_STATES } from '@/services/runtime/orchestrator/state/runtime-state-types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

export function validateCreateContext(context: RuntimeStateCreateContext): void {
  if (!context || typeof context !== 'object') {
    throw new RuntimeStateValidationError('create context must be an object');
  }

  if (!isNonEmptyString(context.organizationId)) {
    throw new RuntimeStateValidationError('organizationId is required');
  }

  if (!isNonEmptyString(context.employeeId)) {
    throw new RuntimeStateValidationError('employeeId is required');
  }

  if (!isNonEmptyString(context.runId)) {
    throw new RuntimeStateValidationError('runId is required');
  }

  if (!isNonEmptyString(context.traceId)) {
    throw new RuntimeStateValidationError('traceId is required');
  }

  if (context.createdAt !== undefined && !isValidIsoDate(context.createdAt)) {
    throw new RuntimeStateValidationError('createdAt must be a valid ISO timestamp');
  }
}

export function validateRuntimeState(state: unknown): asserts state is RuntimeState {
  if (!isNonEmptyString(state) || !RUNTIME_STATES.includes(state as RuntimeState)) {
    throw new RuntimeStateValidationError(
      'state must be one of: created, initializing, planning, executing, waiting, completed, failed, cancelled',
    );
  }
}
