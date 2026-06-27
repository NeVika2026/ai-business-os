import { LoggerValidationError } from '@/services/runtime/observability/logger/logger-errors';
import { serializeLogReport } from '@/services/runtime/observability/logger/logger-serializer';
import type {
  LogContext,
  LogEntry,
  LogFilter,
  LogLevel,
  LoggerOptions,
  LoggerQueryResult,
  LogProvider,
  SerializedLogReport,
} from '@/services/runtime/observability/logger/logger-types';
import { LOG_LEVELS } from '@/services/runtime/observability/logger/logger-types';
import {
  createMockLogProvider,
  mockLogProvider,
} from '@/services/runtime/observability/logger/providers/mock-log-provider';
import type { UUID } from '@/types/runtime/dto';

let logEntrySequence = 0;

function hashSeed(seed: string): number {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function createLogEntryId(seed: string): UUID {
  const next = logEntrySequence;
  logEntrySequence += 1;
  const suffix = hashSeed(`log:${seed}:${next}`).toString(16).padStart(12, '0').slice(0, 12);

  return `0f000001-0000-4000-8000-${suffix}`;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  return { ...metadata };
}

function buildLogEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
  if (!isNonEmptyString(message)) {
    throw new LoggerValidationError('message is required');
  }

  if (!LOG_LEVELS.includes(level)) {
    throw new LoggerValidationError(`invalid log level: ${level}`);
  }

  const timestamp = context?.timestamp ?? new Date().toISOString();
  const id = createLogEntryId(`${level}:${message}:${timestamp}`);

  return {
    id,
    level,
    message,
    timestamp,
    organizationId: context?.organizationId ?? null,
    employeeId: context?.employeeId ?? null,
    traceId: context?.traceId ?? null,
    runId: context?.runId ?? null,
    spanId: context?.spanId ?? null,
    provider: context?.provider ?? null,
    model: context?.model ?? null,
    toolId: context?.toolId ?? null,
    errorCode: context?.errorCode ?? null,
    errorMessage: context?.errorMessage ?? null,
    stack: context?.stack ?? null,
    metadata: normalizeMetadata(context?.metadata),
  };
}

/**
 * Per-execution structured logger. Each runtime run should create its own instance
 * via createLogger() so log state is not shared across concurrent requests.
 */
export class RuntimeLogger {
  private readonly defaultContext: LogContext;

  constructor(
    private readonly provider: LogProvider,
    options?: LoggerOptions,
  ) {
    this.defaultContext = options?.defaultContext ?? {};
  }

  private write(level: LogLevel, message: string, context?: LogContext): LogEntry {
    const mergedContext: LogContext = {
      ...this.defaultContext,
      ...context,
      metadata: {
        ...normalizeMetadata(this.defaultContext.metadata),
        ...normalizeMetadata(context?.metadata),
      },
    };

    const entry = buildLogEntry(level, message, mergedContext);
    this.provider.save(entry);
    return entry;
  }

  debug(message: string, context?: LogContext): LogEntry {
    return this.write('debug', message, context);
  }

  info(message: string, context?: LogContext): LogEntry {
    return this.write('info', message, context);
  }

  warn(message: string, context?: LogContext): LogEntry {
    return this.write('warn', message, context);
  }

  error(message: string, context?: LogContext): LogEntry {
    return this.write('error', message, context);
  }

  fatal(message: string, context?: LogContext): LogEntry {
    return this.write('fatal', message, context);
  }

  query(filter?: LogFilter): LoggerQueryResult {
    const entries = this.provider.list(filter);

    return {
      entries,
      count: entries.length,
    };
  }

  serialize(filter?: LogFilter): SerializedLogReport {
    return serializeLogReport(this.provider.list(filter));
  }

  reset(): void {
    this.provider.reset?.();
  }
}

export function createLogger(options?: LoggerOptions): RuntimeLogger {
  const provider = options?.provider ?? mockLogProvider;
  return new RuntimeLogger(provider, options);
}

/** Default dev/test singleton. Do not use for concurrent production runtime executions. */
export const logger = createLogger();

export { createMockLogProvider, mockLogProvider };

export function resetLogEntrySequence(): void {
  logEntrySequence = 0;
}
