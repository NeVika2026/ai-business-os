import type {
  LogEntry,
  LogFilter,
  LogLevel,
} from '@/services/runtime/observability/logger/logger-types';

function matchesLevel(entryLevel: LogLevel, filterLevel?: LogLevel | LogLevel[]): boolean {
  if (!filterLevel) {
    return true;
  }

  const levels = Array.isArray(filterLevel) ? filterLevel : [filterLevel];
  return levels.includes(entryLevel);
}

function matchesTimestampRange(timestamp: string, from?: string, to?: string): boolean {
  const value = Date.parse(timestamp);

  if (Number.isNaN(value)) {
    return false;
  }

  if (from) {
    const fromValue = Date.parse(from);

    if (!Number.isNaN(fromValue) && value < fromValue) {
      return false;
    }
  }

  if (to) {
    const toValue = Date.parse(to);

    if (!Number.isNaN(toValue) && value > toValue) {
      return false;
    }
  }

  return true;
}

export function matchesLogFilter(entry: LogEntry, filter?: LogFilter): boolean {
  if (!filter) {
    return true;
  }

  if (!matchesLevel(entry.level, filter.level)) {
    return false;
  }

  if (filter.traceId && entry.traceId !== filter.traceId) {
    return false;
  }

  if (filter.runId && entry.runId !== filter.runId) {
    return false;
  }

  if (filter.spanId && entry.spanId !== filter.spanId) {
    return false;
  }

  if (filter.provider && entry.provider !== filter.provider) {
    return false;
  }

  if (filter.model && entry.model !== filter.model) {
    return false;
  }

  if (filter.toolId && entry.toolId !== filter.toolId) {
    return false;
  }

  if (filter.organizationId && entry.organizationId !== filter.organizationId) {
    return false;
  }

  if (filter.employeeId && entry.employeeId !== filter.employeeId) {
    return false;
  }

  if (!matchesTimestampRange(entry.timestamp, filter.from, filter.to)) {
    return false;
  }

  return true;
}
