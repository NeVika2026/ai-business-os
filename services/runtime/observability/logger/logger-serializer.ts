import type {
  LogEntry,
  SerializedLogEntry,
  SerializedLogReport,
} from '@/services/runtime/observability/logger/logger-types';

export function serializeLogEntry(entry: LogEntry): SerializedLogEntry {
  return {
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
    metadata: { ...entry.metadata },
  };
}

export function serializeLogReport(entries: LogEntry[]): SerializedLogReport {
  return {
    entries: entries.map(serializeLogEntry),
    count: entries.length,
  };
}
