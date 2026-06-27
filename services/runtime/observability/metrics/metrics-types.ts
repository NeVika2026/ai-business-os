import type { ISODateTime, UUID } from '@/types/runtime/dto';

export type MetricEventKind = 'execution' | 'tool' | 'llm';

export interface MetricEventBase {
  id?: UUID;
  organizationId: UUID;
  employeeId: UUID;
  traceId: UUID;
  runId: UUID;
  costEntryId?: UUID | null;
  timestamp?: ISODateTime;
}

export interface ExecutionMetricInput extends MetricEventBase {
  kind: 'execution';
  duration: number;
  startTime: ISODateTime;
  endTime: ISODateTime;
}

export interface ToolMetricInput extends MetricEventBase {
  kind: 'tool';
  toolCalls?: number;
  toolSuccess: number;
  toolFailed: number;
  retryCount?: number;
  cacheHits?: number;
  duration: number;
}

export interface LLMMetricInput extends MetricEventBase {
  kind: 'llm';
  llmCalls?: number;
  provider: string;
  model: string;
  latency: number;
  firstTokenLatency?: number | null;
  streamingDuration?: number | null;
}

export type MetricEventInput = ExecutionMetricInput | ToolMetricInput | LLMMetricInput;

export interface ExecutionMetricData {
  duration: number;
  startTime: ISODateTime;
  endTime: ISODateTime;
}

export interface ToolMetricData {
  toolCalls: number;
  toolSuccess: number;
  toolFailed: number;
  retryCount: number;
  cacheHits: number;
  duration: number;
}

export interface LLMMetricData {
  llmCalls: number;
  provider: string;
  model: string;
  latency: number;
  firstTokenLatency: number | null;
  streamingDuration: number | null;
}

export interface MetricRecord {
  id: UUID;
  kind: MetricEventKind;
  organizationId: UUID;
  employeeId: UUID;
  traceId: UUID;
  runId: UUID;
  costEntryId: UUID | null;
  timestamp: ISODateTime;
  execution: ExecutionMetricData | null;
  tool: ToolMetricData | null;
  llm: LLMMetricData | null;
}

export interface MetricsFilter {
  organizationId?: UUID;
  employeeId?: UUID;
  traceId?: UUID;
  runId?: UUID;
  kind?: MetricEventKind | MetricEventKind[];
  provider?: string;
  model?: string;
}

export interface MetricsTotals {
  eventCount: number;
  avgLatency: number;
  p50Latency: number;
  p95Latency: number;
  maxLatency: number;
  successRate: number;
  failureRate: number;
  retryRate: number;
  cacheHitRate: number;
  averageToolDuration: number;
  averageLlmLatency: number;
  providerDistribution: Record<string, number>;
  modelDistribution: Record<string, number>;
  toolCalls: number;
  toolSuccess: number;
  toolFailed: number;
  llmCalls: number;
  retryCount: number;
  cacheHits: number;
}

export interface SerializedMetricRecord {
  id: string;
  kind: MetricEventKind;
  organizationId: string;
  employeeId: string;
  traceId: string;
  runId: string;
  costEntryId: string | null;
  timestamp: string;
  execution: ExecutionMetricData | null;
  tool: ToolMetricData | null;
  llm: LLMMetricData | null;
}

export interface SerializedMetricsTotals {
  eventCount: number;
  avgLatency: number;
  p50Latency: number;
  p95Latency: number;
  maxLatency: number;
  successRate: number;
  failureRate: number;
  retryRate: number;
  cacheHitRate: number;
  averageToolDuration: number;
  averageLlmLatency: number;
  providerDistribution: Record<string, number>;
  modelDistribution: Record<string, number>;
  toolCalls: number;
  toolSuccess: number;
  toolFailed: number;
  llmCalls: number;
  retryCount: number;
  cacheHits: number;
}

export interface SerializedMetricsReport {
  records: SerializedMetricRecord[];
  totals: SerializedMetricsTotals;
}

export interface MetricsProvider {
  save(record: MetricRecord): void;
  getById(id: UUID): MetricRecord | null;
  list(filter?: MetricsFilter): MetricRecord[];
  reset?(): void;
}

export interface MetricsManagerOptions {
  provider?: MetricsProvider;
}

export interface RecordExecutionInput extends MetricEventBase {
  duration: number;
  startTime: ISODateTime;
  endTime: ISODateTime;
}

export interface RecordToolInput extends MetricEventBase {
  toolCalls?: number;
  toolSuccess: number;
  toolFailed: number;
  retryCount?: number;
  cacheHits?: number;
  duration: number;
}

export interface RecordLLMInput extends MetricEventBase {
  llmCalls?: number;
  provider: string;
  model: string;
  latency: number;
  firstTokenLatency?: number | null;
  streamingDuration?: number | null;
}
