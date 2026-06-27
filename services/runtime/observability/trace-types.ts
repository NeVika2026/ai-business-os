import type { ISODateTime, UUID } from '@/types/runtime/dto';

export interface TraceCreateContext {
  organizationId: UUID;
  employeeId: UUID;
  correlationId?: UUID;
  traceId?: UUID;
  runId?: UUID;
  parentRunId?: UUID | null;
  parentSpanId?: UUID | null;
  startedAt?: ISODateTime;
}

export type TraceChildKind = 'span' | 'run';

export interface TraceChildOptions {
  type?: TraceChildKind;
}

export interface RuntimeTraceRecord {
  traceId: UUID;
  correlationId: UUID;
  runId: UUID;
  parentRunId: UUID | null;
  spanId: UUID;
  parentSpanId: UUID | null;
  organizationId: UUID;
  employeeId: UUID;
  startedAt: ISODateTime;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface SerializedTraceDto {
  traceId: string;
  correlationId: string;
  runId: string;
  parentRunId: string | null;
  spanId: string;
  parentSpanId: string | null;
  organizationId: string;
  employeeId: string;
  startedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TraceProvider {
  save(trace: RuntimeTraceRecord): void;
  get(spanId: UUID): RuntimeTraceRecord | null;
  listByRunId(runId: UUID): RuntimeTraceRecord[];
  reset?(): void;
}

export interface TraceManagerOptions {
  provider?: TraceProvider;
}

export type TraceLoadInput = RuntimeTraceRecord | { spanId: UUID };
