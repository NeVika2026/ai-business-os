import { CoordinatorValidationError } from '@/services/runtime/orchestrator/coordinator/runtime-coordinator-errors';
import type { CoordinatorStartContext } from '@/services/runtime/orchestrator/coordinator/runtime-coordinator-types';
import type { OrchestratorTask } from '@/services/runtime/orchestrator/engine/runtime-orchestrator-types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

export function validateCoordinatorStartContext(context: CoordinatorStartContext): void {
  if (!context || typeof context !== 'object') {
    throw new CoordinatorValidationError('start context must be an object');
  }

  if (!isNonEmptyString(context.organizationId)) {
    throw new CoordinatorValidationError('organizationId is required');
  }

  if (!isNonEmptyString(context.employeeId)) {
    throw new CoordinatorValidationError('employeeId is required');
  }

  if (!isNonEmptyString(context.runId)) {
    throw new CoordinatorValidationError('runId is required');
  }

  if (!isNonEmptyString(context.traceId)) {
    throw new CoordinatorValidationError('traceId is required');
  }

  if (context.startedAt !== undefined && !isValidIsoDate(context.startedAt)) {
    throw new CoordinatorValidationError('startedAt must be a valid ISO timestamp');
  }

  if (
    context.spanId !== undefined &&
    context.spanId !== null &&
    !isNonEmptyString(context.spanId)
  ) {
    throw new CoordinatorValidationError('spanId must be a non-empty string or null');
  }

  if (context.tasks !== undefined && !Array.isArray(context.tasks)) {
    throw new CoordinatorValidationError('tasks must be an array when provided');
  }
}

export function validateReason(reason: string, fieldName: string): void {
  if (!isNonEmptyString(reason)) {
    throw new CoordinatorValidationError(`${fieldName} is required`);
  }
}

export function getDefaultCoordinatorTasks(): OrchestratorTask[] {
  return [
    {
      id: 'task-context',
      type: 'context.build',
      priority: 100,
      dependsOn: [],
    },
    {
      id: 'task-prompt',
      type: 'prompt.compile',
      priority: 90,
      dependsOn: ['task-context'],
    },
    {
      id: 'task-gateway',
      type: 'gateway.complete',
      priority: 80,
      dependsOn: ['task-prompt'],
    },
  ];
}
