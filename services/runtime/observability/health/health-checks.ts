import type {
  ComponentHealthResult,
  HealthCheckRecord,
  HealthComponent,
  HealthIssue,
  HealthStatus,
} from '@/services/runtime/observability/health/health-types';

const STATUS_RANK: Record<HealthStatus, number> = {
  healthy: 0,
  degraded: 1,
  unhealthy: 2,
};

export function worstStatus(statuses: HealthStatus[]): HealthStatus {
  if (statuses.length === 0) {
    return 'healthy';
  }

  return statuses.reduce((worst, current) =>
    STATUS_RANK[current] > STATUS_RANK[worst] ? current : worst,
  );
}

export function evaluateComponentHealth(
  component: HealthComponent,
  records: HealthCheckRecord[],
  checkedAt: string,
): ComponentHealthResult {
  if (records.length === 0) {
    return {
      component,
      status: 'healthy',
      latencyMs: null,
      message: null,
      checkedAt,
    };
  }

  const latest = records[records.length - 1];
  const latencies = records
    .map((record) => record.latencyMs)
    .filter((value): value is number => typeof value === 'number');
  const averageLatency =
    latencies.length > 0
      ? Number((latencies.reduce((sum, value) => sum + value, 0) / latencies.length).toFixed(4))
      : null;

  return {
    component,
    status: worstStatus(records.map((record) => record.status)),
    latencyMs: averageLatency ?? latest.latencyMs,
    message: latest.message,
    checkedAt,
  };
}

export function buildIssueFromCheck(
  record: HealthCheckRecord,
  code: string,
  severity: HealthIssue['severity'],
): HealthIssue {
  return {
    code,
    severity,
    component: record.component,
    message: record.message ?? `${record.component} reported ${record.status}`,
    detectedAt: record.recordedAt,
  };
}

export function collectIssues(records: HealthCheckRecord[]): HealthIssue[] {
  const issues: HealthIssue[] = [];

  for (const record of records) {
    if (record.status === 'healthy') {
      continue;
    }

    issues.push(
      buildIssueFromCheck(
        record,
        record.status === 'unhealthy' ? 'HEALTH_UNHEALTHY' : 'HEALTH_DEGRADED',
        record.status === 'unhealthy' ? 'high' : 'medium',
      ),
    );
  }

  return issues.sort((left, right) => left.detectedAt.localeCompare(right.detectedAt));
}

export function mockLatencyForComponent(component: HealthComponent): number {
  const baseLatencies: Record<HealthComponent, number> = {
    runtime: 12,
    gateway: 842,
    tools: 45,
    memory: 18,
    logger: 3,
    metrics: 5,
    cost: 4,
    trace: 6,
    observability: 10,
  };

  return baseLatencies[component];
}
