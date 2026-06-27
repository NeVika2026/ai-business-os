import {
  average,
  maxValue,
  percentile,
  rate,
} from '@/services/runtime/observability/metrics/metrics-calculator';
import type {
  MetricRecord,
  MetricsTotals,
} from '@/services/runtime/observability/metrics/metrics-types';

function collectLatencySamples(records: MetricRecord[]): number[] {
  const samples: number[] = [];

  for (const record of records) {
    if (record.execution) {
      samples.push(record.execution.duration);
    }

    if (record.tool) {
      samples.push(record.tool.duration);
    }

    if (record.llm) {
      samples.push(record.llm.latency);
    }
  }

  return samples;
}

export function aggregateMetricRecords(records: MetricRecord[]): MetricsTotals {
  const latencySamples = collectLatencySamples(records);

  let toolCalls = 0;
  let toolSuccess = 0;
  let toolFailed = 0;
  let retryCount = 0;
  let cacheHits = 0;
  let llmCalls = 0;
  let toolDurationSum = 0;
  let toolDurationCount = 0;
  let llmLatencySum = 0;
  let llmLatencyCount = 0;
  const providerDistribution: Record<string, number> = {};
  const modelDistribution: Record<string, number> = {};

  for (const record of records) {
    if (record.tool) {
      toolCalls += record.tool.toolCalls;
      toolSuccess += record.tool.toolSuccess;
      toolFailed += record.tool.toolFailed;
      retryCount += record.tool.retryCount;
      cacheHits += record.tool.cacheHits;
      toolDurationSum += record.tool.duration;
      toolDurationCount += 1;
    }

    if (record.llm) {
      llmCalls += record.llm.llmCalls;
      llmLatencySum += record.llm.latency;
      llmLatencyCount += 1;
      providerDistribution[record.llm.provider] =
        (providerDistribution[record.llm.provider] ?? 0) + record.llm.llmCalls;
      modelDistribution[record.llm.model] =
        (modelDistribution[record.llm.model] ?? 0) + record.llm.llmCalls;
    }
  }

  const toolOutcomes = toolSuccess + toolFailed;

  return {
    eventCount: records.length,
    avgLatency: average(latencySamples),
    p50Latency: percentile(latencySamples, 50),
    p95Latency: percentile(latencySamples, 95),
    maxLatency: maxValue(latencySamples),
    successRate: rate(toolSuccess, toolOutcomes),
    failureRate: rate(toolFailed, toolOutcomes),
    retryRate: rate(retryCount, toolCalls),
    cacheHitRate: rate(cacheHits, toolCalls),
    averageToolDuration: rate(toolDurationSum, toolDurationCount),
    averageLlmLatency: rate(llmLatencySum, llmLatencyCount),
    providerDistribution,
    modelDistribution,
    toolCalls,
    toolSuccess,
    toolFailed,
    llmCalls,
    retryCount,
    cacheHits,
  };
}
