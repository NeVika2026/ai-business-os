import { aggregateMetricRecords } from '@/services/runtime/observability/metrics/metrics-aggregator';
import { MetricsValidationError } from '@/services/runtime/observability/metrics/metrics-errors';
import { serializeMetricsReport } from '@/services/runtime/observability/metrics/metrics-serializer';
import type {
  ExecutionMetricInput,
  LLMMetricInput,
  MetricEventInput,
  MetricRecord,
  MetricsFilter,
  MetricsManagerOptions,
  MetricsProvider,
  MetricsTotals,
  RecordExecutionInput,
  RecordLLMInput,
  RecordToolInput,
  SerializedMetricsReport,
  ToolMetricInput,
} from '@/services/runtime/observability/metrics/metrics-types';
import {
  createMockMetricsProvider,
  mockMetricsProvider,
} from '@/services/runtime/observability/metrics/providers/mock-metrics-provider';
import type { UUID } from '@/types/runtime/dto';

let metricRecordSequence = 0;

function hashSeed(seed: string): number {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function createMetricRecordId(seed: string): UUID {
  const next = metricRecordSequence;
  metricRecordSequence += 1;
  const suffix = hashSeed(`metric:${seed}:${next}`).toString(16).padStart(12, '0').slice(0, 12);

  return `0e000001-0000-4000-8000-${suffix}`;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function validateBaseFields(input: {
  organizationId: UUID;
  employeeId: UUID;
  traceId: UUID;
  runId: UUID;
}): void {
  if (!isNonEmptyString(input.organizationId)) {
    throw new MetricsValidationError('organizationId is required');
  }

  if (!isNonEmptyString(input.employeeId)) {
    throw new MetricsValidationError('employeeId is required');
  }

  if (!isNonEmptyString(input.traceId)) {
    throw new MetricsValidationError('traceId is required');
  }

  if (!isNonEmptyString(input.runId)) {
    throw new MetricsValidationError('runId is required');
  }
}

function buildRecord(event: MetricEventInput): MetricRecord {
  validateBaseFields(event);

  const timestamp = event.timestamp ?? new Date().toISOString();
  const id =
    event.id ?? createMetricRecordId(`${event.kind}:${event.runId}:${event.traceId}:${timestamp}`);

  const base = {
    id,
    organizationId: event.organizationId,
    employeeId: event.employeeId,
    traceId: event.traceId,
    runId: event.runId,
    costEntryId: event.costEntryId ?? null,
    timestamp,
    execution: null,
    tool: null,
    llm: null,
  };

  if (event.kind === 'execution') {
    if (typeof event.duration !== 'number' || event.duration < 0) {
      throw new MetricsValidationError('execution.duration must be a non-negative number');
    }

    if (!isValidIsoDate(event.startTime) || !isValidIsoDate(event.endTime)) {
      throw new MetricsValidationError(
        'execution.startTime and endTime must be valid ISO timestamps',
      );
    }

    return {
      ...base,
      kind: 'execution',
      execution: {
        duration: event.duration,
        startTime: event.startTime,
        endTime: event.endTime,
      },
    };
  }

  if (event.kind === 'tool') {
    if (typeof event.duration !== 'number' || event.duration < 0) {
      throw new MetricsValidationError('tool.duration must be a non-negative number');
    }

    if (event.toolSuccess < 0 || event.toolFailed < 0) {
      throw new MetricsValidationError('toolSuccess and toolFailed must be non-negative');
    }

    return {
      ...base,
      kind: 'tool',
      tool: {
        toolCalls: event.toolCalls ?? 1,
        toolSuccess: event.toolSuccess,
        toolFailed: event.toolFailed,
        retryCount: event.retryCount ?? 0,
        cacheHits: event.cacheHits ?? 0,
        duration: event.duration,
      },
    };
  }

  if (!isNonEmptyString(event.provider) || !isNonEmptyString(event.model)) {
    throw new MetricsValidationError('llm.provider and llm.model are required');
  }

  if (typeof event.latency !== 'number' || event.latency < 0) {
    throw new MetricsValidationError('llm.latency must be a non-negative number');
  }

  return {
    ...base,
    kind: 'llm',
    llm: {
      llmCalls: event.llmCalls ?? 1,
      provider: event.provider,
      model: event.model,
      latency: event.latency,
      firstTokenLatency: event.firstTokenLatency ?? null,
      streamingDuration: event.streamingDuration ?? null,
    },
  };
}

/**
 * Per-execution metrics manager. Each runtime run should create its own instance
 * via createMetricsManager() so metrics state is not shared across concurrent requests.
 */
export class MetricsManager {
  constructor(private readonly provider: MetricsProvider) {}

  record(event: MetricEventInput): MetricRecord {
    const record = buildRecord(event);
    this.provider.save(record);
    return record;
  }

  recordExecution(input: RecordExecutionInput): MetricRecord {
    const event: ExecutionMetricInput = {
      kind: 'execution',
      ...input,
    };

    return this.record(event);
  }

  recordTool(input: RecordToolInput): MetricRecord {
    const event: ToolMetricInput = {
      kind: 'tool',
      ...input,
    };

    return this.record(event);
  }

  recordLLM(input: RecordLLMInput): MetricRecord {
    const event: LLMMetricInput = {
      kind: 'llm',
      ...input,
    };

    return this.record(event);
  }

  getRun(runId: UUID): MetricRecord[] {
    return this.provider.list({ runId });
  }

  getTrace(traceId: UUID): MetricRecord[] {
    return this.provider.list({ traceId });
  }

  getTotals(filter?: MetricsFilter): MetricsTotals {
    return aggregateMetricRecords(this.provider.list(filter));
  }

  serialize(filter?: MetricsFilter): SerializedMetricsReport {
    return serializeMetricsReport(this.provider.list(filter));
  }

  reset(): void {
    this.provider.reset?.();
  }
}

export function createMetricsManager(options?: MetricsManagerOptions): MetricsManager {
  const provider = options?.provider ?? mockMetricsProvider;
  return new MetricsManager(provider);
}

/** Default dev/test singleton. Do not use for concurrent production runtime executions. */
export const metrics = createMetricsManager();

export { createMockMetricsProvider, mockMetricsProvider };

export function resetMetricRecordSequence(): void {
  metricRecordSequence = 0;
}
