import {
  TraceHierarchyError,
  TraceValidationError,
} from '@/services/runtime/observability/trace-errors';
import type {
  RuntimeTraceRecord,
  TraceCreateContext,
  TraceProvider,
} from '@/services/runtime/observability/trace-types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function assertDistinctIds(
  left: string | null | undefined,
  right: string | null | undefined,
  label: string,
): void {
  if (left && right && left === right) {
    throw new TraceValidationError(`${label} must not equal its paired id`);
  }
}

export function validateCreateContext(context: TraceCreateContext): void {
  if (!context || typeof context !== 'object') {
    throw new TraceValidationError('create context must be an object');
  }

  if (!isNonEmptyString(context.organizationId)) {
    throw new TraceValidationError('organizationId is required');
  }

  if (!isNonEmptyString(context.employeeId)) {
    throw new TraceValidationError('employeeId is required');
  }

  if (context.startedAt !== undefined && !isValidIsoDate(context.startedAt)) {
    throw new TraceValidationError('startedAt must be a valid ISO timestamp');
  }

  assertDistinctIds(context.parentRunId, context.runId, 'parentRunId and runId');
}

export function validateTraceRecord(trace: RuntimeTraceRecord): void {
  if (!trace || typeof trace !== 'object') {
    throw new TraceValidationError('trace must be an object');
  }

  const requiredStringFields: Array<keyof RuntimeTraceRecord> = [
    'traceId',
    'correlationId',
    'runId',
    'spanId',
    'organizationId',
    'employeeId',
    'startedAt',
    'createdAt',
    'updatedAt',
  ];

  for (const field of requiredStringFields) {
    if (!isNonEmptyString(trace[field])) {
      throw new TraceValidationError(`${field} is required`);
    }
  }

  if (trace.parentRunId !== null && !isNonEmptyString(trace.parentRunId)) {
    throw new TraceValidationError('parentRunId must be a non-empty string or null');
  }

  if (trace.parentSpanId !== null && !isNonEmptyString(trace.parentSpanId)) {
    throw new TraceValidationError('parentSpanId must be a non-empty string or null');
  }

  for (const field of ['startedAt', 'createdAt', 'updatedAt'] as const) {
    if (!isValidIsoDate(trace[field])) {
      throw new TraceValidationError(`${field} must be a valid ISO timestamp`);
    }
  }

  assertDistinctIds(trace.parentRunId, trace.runId, 'parentRunId and runId');
  assertDistinctIds(trace.parentSpanId, trace.spanId, 'parentSpanId and spanId');
}

export function validateTraceHierarchy(trace: RuntimeTraceRecord, provider: TraceProvider): void {
  validateTraceRecord(trace);

  if (!trace.parentSpanId) {
    return;
  }

  const parent = provider.get(trace.parentSpanId);

  if (!parent) {
    throw new TraceHierarchyError(`parent span not found: ${trace.parentSpanId}`);
  }

  if (parent.traceId !== trace.traceId) {
    throw new TraceHierarchyError('traceId must remain unchanged within the trace chain');
  }

  if (parent.correlationId !== trace.correlationId) {
    throw new TraceHierarchyError('correlationId must remain unchanged within the trace chain');
  }

  if (parent.organizationId !== trace.organizationId) {
    throw new TraceHierarchyError('organizationId must match parent span tenant scope');
  }

  if (parent.employeeId !== trace.employeeId) {
    throw new TraceHierarchyError('employeeId must match parent span tenant scope');
  }

  if (trace.parentRunId && trace.parentRunId !== parent.runId) {
    throw new TraceHierarchyError('parentRunId must reference the parent span runId when provided');
  }
}
