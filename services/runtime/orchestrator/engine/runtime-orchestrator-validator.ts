import { OrchestratorValidationError } from '@/services/runtime/orchestrator/engine/runtime-orchestrator-errors';
import type {
  OrchestratorError,
  OrchestratorStartContext,
  OrchestratorTask,
} from '@/services/runtime/orchestrator/engine/runtime-orchestrator-types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

export function validateStartContext(context: OrchestratorStartContext): void {
  if (!context || typeof context !== 'object') {
    throw new OrchestratorValidationError('start context must be an object');
  }

  if (!isNonEmptyString(context.organizationId)) {
    throw new OrchestratorValidationError('organizationId is required');
  }

  if (!isNonEmptyString(context.employeeId)) {
    throw new OrchestratorValidationError('employeeId is required');
  }

  if (!isNonEmptyString(context.runId)) {
    throw new OrchestratorValidationError('runId is required');
  }

  if (!isNonEmptyString(context.traceId)) {
    throw new OrchestratorValidationError('traceId is required');
  }

  if (context.startedAt !== undefined && !isValidIsoDate(context.startedAt)) {
    throw new OrchestratorValidationError('startedAt must be a valid ISO timestamp');
  }
}

export function validateTasks(tasks: OrchestratorTask[]): void {
  if (!Array.isArray(tasks)) {
    throw new OrchestratorValidationError('tasks must be an array');
  }

  const ids = new Set<string>();

  for (const task of tasks) {
    if (!task || typeof task !== 'object') {
      throw new OrchestratorValidationError('each task must be an object');
    }

    if (!isNonEmptyString(task.id)) {
      throw new OrchestratorValidationError('task.id is required');
    }

    if (ids.has(task.id)) {
      throw new OrchestratorValidationError(`duplicate task id: ${task.id}`);
    }

    ids.add(task.id);

    if (!isNonEmptyString(task.type)) {
      throw new OrchestratorValidationError(`task.type is required for ${task.id}`);
    }

    if (typeof task.priority !== 'number' || Number.isNaN(task.priority)) {
      throw new OrchestratorValidationError(`task.priority must be a number for ${task.id}`);
    }

    if (!Array.isArray(task.dependsOn)) {
      throw new OrchestratorValidationError(`task.dependsOn must be an array for ${task.id}`);
    }
  }

  for (const task of tasks) {
    for (const dependencyId of task.dependsOn) {
      if (!isNonEmptyString(dependencyId)) {
        throw new OrchestratorValidationError(`invalid dependency for task ${task.id}`);
      }

      if (!ids.has(dependencyId)) {
        throw new OrchestratorValidationError(
          `unknown dependency ${dependencyId} for task ${task.id}`,
        );
      }

      if (dependencyId === task.id) {
        throw new OrchestratorValidationError(`task ${task.id} cannot depend on itself`);
      }
    }
  }
}

export function validateOrchestratorError(error: OrchestratorError): void {
  if (!error || typeof error !== 'object') {
    throw new OrchestratorValidationError('error must be an object');
  }

  if (!isNonEmptyString(error.code)) {
    throw new OrchestratorValidationError('error.code is required');
  }

  if (!isNonEmptyString(error.message)) {
    throw new OrchestratorValidationError('error.message is required');
  }
}
