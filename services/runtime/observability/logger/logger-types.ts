import type { ISODateTime, UUID } from '@/types/runtime/dto';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export const LOG_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];

export interface LogContext {
  organizationId?: UUID | null;
  employeeId?: UUID | null;
  traceId?: UUID | null;
  runId?: UUID | null;
  spanId?: UUID | null;
  provider?: string | null;
  model?: string | null;
  toolId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  stack?: string | null;
  metadata?: Record<string, unknown>;
  timestamp?: ISODateTime;
}

export interface LogEntry {
  id: UUID;
  level: LogLevel;
  message: string;
  timestamp: ISODateTime;
  organizationId: UUID | null;
  employeeId: UUID | null;
  traceId: UUID | null;
  runId: UUID | null;
  spanId: UUID | null;
  provider: string | null;
  model: string | null;
  toolId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  stack: string | null;
  metadata: Record<string, unknown>;
}

export interface LogFilter {
  level?: LogLevel | LogLevel[];
  traceId?: UUID;
  runId?: UUID;
  spanId?: UUID;
  provider?: string;
  model?: string;
  toolId?: string;
  organizationId?: UUID;
  employeeId?: UUID;
  from?: ISODateTime;
  to?: ISODateTime;
}

export interface SerializedLogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: string;
  organizationId: string | null;
  employeeId: string | null;
  traceId: string | null;
  runId: string | null;
  spanId: string | null;
  provider: string | null;
  model: string | null;
  toolId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  stack: string | null;
  metadata: Record<string, unknown>;
}

export interface SerializedLogReport {
  entries: SerializedLogEntry[];
  count: number;
}

export interface LogProvider {
  save(entry: LogEntry): void;
  getById(id: UUID): LogEntry | null;
  list(filter?: LogFilter): LogEntry[];
  reset?(): void;
}

export interface LoggerOptions {
  provider?: LogProvider;
  defaultContext?: LogContext;
}

export interface LoggerQueryResult {
  entries: LogEntry[];
  count: number;
}
