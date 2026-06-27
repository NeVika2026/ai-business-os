import type {
  RuntimeTraceRecord,
  SerializedTraceDto,
} from '@/services/runtime/observability/trace-types';

export function serializeTrace(trace: RuntimeTraceRecord): SerializedTraceDto {
  return {
    traceId: trace.traceId,
    correlationId: trace.correlationId,
    runId: trace.runId,
    parentRunId: trace.parentRunId,
    spanId: trace.spanId,
    parentSpanId: trace.parentSpanId,
    organizationId: trace.organizationId,
    employeeId: trace.employeeId,
    startedAt: trace.startedAt,
    createdAt: trace.createdAt,
    updatedAt: trace.updatedAt,
  };
}
