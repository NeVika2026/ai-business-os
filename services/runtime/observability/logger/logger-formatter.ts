import type { LogEntry } from '@/services/runtime/observability/logger/logger-types';

export function formatLogEntryAsJson(entry: LogEntry): string {
  return JSON.stringify({
    id: entry.id,
    level: entry.level,
    message: entry.message,
    timestamp: entry.timestamp,
    organizationId: entry.organizationId,
    employeeId: entry.employeeId,
    traceId: entry.traceId,
    runId: entry.runId,
    spanId: entry.spanId,
    provider: entry.provider,
    model: entry.model,
    toolId: entry.toolId,
    errorCode: entry.errorCode,
    errorMessage: entry.errorMessage,
    stack: entry.stack,
    metadata: entry.metadata,
  });
}

export function formatLogEntriesAsJson(entries: LogEntry[]): string {
  return JSON.stringify(
    entries.map((entry) => ({
      id: entry.id,
      level: entry.level,
      message: entry.message,
      timestamp: entry.timestamp,
      organizationId: entry.organizationId,
      employeeId: entry.employeeId,
      traceId: entry.traceId,
      runId: entry.runId,
      spanId: entry.spanId,
      provider: entry.provider,
      model: entry.model,
      toolId: entry.toolId,
      errorCode: entry.errorCode,
      errorMessage: entry.errorMessage,
      stack: entry.stack,
      metadata: entry.metadata,
    })),
  );
}
