import { MemoryValidationError } from '@/services/runtime/memory/memory-errors';
import type { MemoryLoadContext, MemoryStoreInput } from '@/services/runtime/memory/memory-types';
import type { TraceContext } from '@/types/runtime/dto';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function validateTrace(trace: TraceContext, prefix: string): void {
  if (!isNonEmptyString(trace.runId)) {
    throw new MemoryValidationError(`${prefix}.trace.runId is required`);
  }

  if (!isNonEmptyString(trace.correlationId)) {
    throw new MemoryValidationError(`${prefix}.trace.correlationId is required`);
  }

  if (!isNonEmptyString(trace.traceId)) {
    throw new MemoryValidationError(`${prefix}.trace.traceId is required`);
  }
}

export function validateLoadContext(context: MemoryLoadContext): void {
  if (!context || typeof context !== 'object') {
    throw new MemoryValidationError('load context must be an object');
  }

  if (!isNonEmptyString(context.scope?.organizationId)) {
    throw new MemoryValidationError('scope.organizationId is required');
  }

  if (!isNonEmptyString(context.employeeId)) {
    throw new MemoryValidationError('employeeId is required');
  }

  if (!context.trace) {
    throw new MemoryValidationError('trace is required');
  }

  validateTrace(context.trace, 'load context');
}

export function validateMemoryStoreInput(entry: MemoryStoreInput): void {
  if (!entry || typeof entry !== 'object') {
    throw new MemoryValidationError('entry must be an object');
  }

  if (entry.id !== undefined && !isNonEmptyString(entry.id)) {
    throw new MemoryValidationError('entry.id must be a non-empty string when provided');
  }

  if (!isNonEmptyString(entry.scope)) {
    throw new MemoryValidationError('entry.scope is required');
  }

  if (!isNonEmptyString(entry.content)) {
    throw new MemoryValidationError('entry.content is required');
  }

  if (typeof entry.importance !== 'number' || Number.isNaN(entry.importance)) {
    throw new MemoryValidationError('entry.importance must be a number');
  }

  if (entry.importance < 0 || entry.importance > 1) {
    throw new MemoryValidationError('entry.importance must be between 0 and 1');
  }

  if (entry.payload !== undefined) {
    if (!entry.payload || typeof entry.payload !== 'object' || Array.isArray(entry.payload)) {
      throw new MemoryValidationError('entry.payload must be an object');
    }
  }

  if (entry.createdAt !== undefined && !isValidIsoDate(entry.createdAt)) {
    throw new MemoryValidationError('entry.createdAt must be a valid ISO timestamp');
  }

  if (entry.updatedAt !== undefined && !isValidIsoDate(entry.updatedAt)) {
    throw new MemoryValidationError('entry.updatedAt must be a valid ISO timestamp');
  }

  if (
    entry.lastUsedAt !== undefined &&
    entry.lastUsedAt !== null &&
    !isValidIsoDate(entry.lastUsedAt)
  ) {
    throw new MemoryValidationError('entry.lastUsedAt must be a valid ISO timestamp or null');
  }

  if (!['working', 'semantic', 'episodic'].includes(entry.kind)) {
    throw new MemoryValidationError('entry.kind must be working, semantic, or episodic');
  }
}
