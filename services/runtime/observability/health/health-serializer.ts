import type {
  HealthIssue,
  HealthStatusSnapshot,
  SerializedHealthIssue,
  SerializedHealthSnapshot,
} from '@/services/runtime/observability/health/health-types';

export function serializeHealthIssue(issue: HealthIssue): SerializedHealthIssue {
  return {
    code: issue.code,
    severity: issue.severity,
    component: issue.component,
    message: issue.message,
    detectedAt: issue.detectedAt,
  };
}

export function serializeHealthSnapshot(snapshot: HealthStatusSnapshot): SerializedHealthSnapshot {
  return {
    status: snapshot.status,
    uptime: snapshot.uptime,
    errorRate: snapshot.errorRate,
    averageLatency: snapshot.averageLatency,
    memoryStatus: snapshot.memoryStatus,
    gatewayStatus: snapshot.gatewayStatus,
    toolsStatus: snapshot.toolsStatus,
    loggerStatus: snapshot.loggerStatus,
    metricsStatus: snapshot.metricsStatus,
    costStatus: snapshot.costStatus,
    traceStatus: snapshot.traceStatus,
    issues: snapshot.issues.map(serializeHealthIssue),
    checkedAt: snapshot.checkedAt,
  };
}
