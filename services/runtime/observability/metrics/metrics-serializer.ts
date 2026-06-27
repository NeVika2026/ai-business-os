import type {
  MetricRecord,
  MetricsFilter,
  MetricsTotals,
  SerializedMetricRecord,
  SerializedMetricsReport,
  SerializedMetricsTotals,
} from '@/services/runtime/observability/metrics/metrics-types';
import { aggregateMetricRecords } from '@/services/runtime/observability/metrics/metrics-aggregator';

export function serializeMetricRecord(record: MetricRecord): SerializedMetricRecord {
  return {
    id: record.id,
    kind: record.kind,
    organizationId: record.organizationId,
    employeeId: record.employeeId,
    traceId: record.traceId,
    runId: record.runId,
    costEntryId: record.costEntryId,
    timestamp: record.timestamp,
    execution: record.execution,
    tool: record.tool,
    llm: record.llm,
  };
}

export function serializeMetricsTotals(totals: MetricsTotals): SerializedMetricsTotals {
  return {
    eventCount: totals.eventCount,
    avgLatency: totals.avgLatency,
    p50Latency: totals.p50Latency,
    p95Latency: totals.p95Latency,
    maxLatency: totals.maxLatency,
    successRate: totals.successRate,
    failureRate: totals.failureRate,
    retryRate: totals.retryRate,
    cacheHitRate: totals.cacheHitRate,
    averageToolDuration: totals.averageToolDuration,
    averageLlmLatency: totals.averageLlmLatency,
    providerDistribution: { ...totals.providerDistribution },
    modelDistribution: { ...totals.modelDistribution },
    toolCalls: totals.toolCalls,
    toolSuccess: totals.toolSuccess,
    toolFailed: totals.toolFailed,
    llmCalls: totals.llmCalls,
    retryCount: totals.retryCount,
    cacheHits: totals.cacheHits,
  };
}

export function serializeMetricsReport(records: MetricRecord[]): SerializedMetricsReport {
  const totals = aggregateMetricRecords(records);

  return {
    records: records.map(serializeMetricRecord),
    totals: serializeMetricsTotals(totals),
  };
}

export function matchesMetricsFilter(record: MetricRecord, filter?: MetricsFilter): boolean {
  if (!filter) {
    return true;
  }

  if (filter.organizationId && record.organizationId !== filter.organizationId) {
    return false;
  }

  if (filter.employeeId && record.employeeId !== filter.employeeId) {
    return false;
  }

  if (filter.traceId && record.traceId !== filter.traceId) {
    return false;
  }

  if (filter.runId && record.runId !== filter.runId) {
    return false;
  }

  if (filter.kind) {
    const kinds = Array.isArray(filter.kind) ? filter.kind : [filter.kind];

    if (!kinds.includes(record.kind)) {
      return false;
    }
  }

  if (filter.provider && record.llm?.provider !== filter.provider) {
    return false;
  }

  if (filter.model && record.llm?.model !== filter.model) {
    return false;
  }

  return true;
}
