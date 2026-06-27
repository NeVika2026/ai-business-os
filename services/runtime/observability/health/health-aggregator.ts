import {
  collectIssues,
  evaluateComponentHealth,
  mockLatencyForComponent,
  worstStatus,
} from '@/services/runtime/observability/health/health-checks';
import type {
  ComponentHealthResult,
  HealthCheckRecord,
  HealthComponent,
  HealthStatus,
  HealthStatusSnapshot,
} from '@/services/runtime/observability/health/health-types';

function computeErrorRate(records: HealthCheckRecord[]): number {
  if (records.length === 0) {
    return 0;
  }

  const failures = records.filter((record) => !record.success).length;
  return Number((failures / records.length).toFixed(4));
}

function computeAverageLatency(records: HealthCheckRecord[]): number {
  const latencies = records
    .map((record) => record.latencyMs)
    .filter((value): value is number => typeof value === 'number');

  if (latencies.length === 0) {
    return 0;
  }

  const sum = latencies.reduce((total, value) => total + value, 0);
  return Number((sum / latencies.length).toFixed(4));
}

function computeUptime(startedAt: string, checkedAt: string): number {
  const start = Date.parse(startedAt);
  const end = Date.parse(checkedAt);

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return 0;
  }

  return end - start;
}

function componentStatus(
  componentResults: Record<string, ComponentHealthResult>,
  component: HealthComponent,
): HealthStatus {
  return componentResults[component]?.status ?? 'healthy';
}

export function aggregateHealthStatus(
  records: HealthCheckRecord[],
  componentResults: Record<HealthComponent, ComponentHealthResult>,
  startedAt: string,
  checkedAt: string,
): HealthStatusSnapshot {
  const issues = collectIssues(records);
  const componentStatuses = Object.values(componentResults).map((result) => result.status);
  const overallStatus = worstStatus(componentStatuses);

  return {
    status: overallStatus,
    uptime: computeUptime(startedAt, checkedAt),
    errorRate: computeErrorRate(records),
    averageLatency: computeAverageLatency(records),
    memoryStatus: componentStatus(componentResults, 'memory'),
    gatewayStatus: componentStatus(componentResults, 'gateway'),
    toolsStatus: componentStatus(componentResults, 'tools'),
    loggerStatus: componentStatus(componentResults, 'logger'),
    metricsStatus: componentStatus(componentResults, 'metrics'),
    costStatus: componentStatus(componentResults, 'cost'),
    traceStatus: componentStatus(componentResults, 'trace'),
    issues,
    checkedAt,
  };
}

export function evaluateAllComponents(
  recordsByComponent: Record<HealthComponent, HealthCheckRecord[]>,
  checkedAt: string,
): Record<HealthComponent, ComponentHealthResult> {
  const components: HealthComponent[] = [
    'runtime',
    'gateway',
    'tools',
    'memory',
    'logger',
    'metrics',
    'cost',
    'trace',
    'observability',
  ];

  const results = {} as Record<HealthComponent, ComponentHealthResult>;

  for (const component of components) {
    const componentRecords = recordsByComponent[component] ?? [];

    if (componentRecords.length === 0) {
      results[component] = {
        component,
        status: 'healthy',
        latencyMs: mockLatencyForComponent(component),
        message: null,
        checkedAt,
      };
      continue;
    }

    results[component] = evaluateComponentHealth(component, componentRecords, checkedAt);
  }

  return results;
}

export function groupRecordsByComponent(
  records: HealthCheckRecord[],
): Record<HealthComponent, HealthCheckRecord[]> {
  const grouped = {
    runtime: [],
    gateway: [],
    tools: [],
    memory: [],
    logger: [],
    metrics: [],
    cost: [],
    trace: [],
    observability: [],
  } as Record<HealthComponent, HealthCheckRecord[]>;

  for (const record of records) {
    grouped[record.component].push(record);
  }

  for (const component of Object.keys(grouped) as HealthComponent[]) {
    grouped[component].sort((left, right) => left.recordedAt.localeCompare(right.recordedAt));
  }

  return grouped;
}
