import type { ISODateTime, UUID } from '@/types/runtime/dto';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export type HealthComponent =
  | 'runtime'
  | 'gateway'
  | 'tools'
  | 'memory'
  | 'logger'
  | 'metrics'
  | 'cost'
  | 'trace'
  | 'observability';

export type HealthIssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface HealthIssue {
  code: string;
  severity: HealthIssueSeverity;
  component: HealthComponent;
  message: string;
  detectedAt: ISODateTime;
}

export interface HealthCheckInput {
  component: HealthComponent;
  status: HealthStatus;
  latencyMs?: number | null;
  success?: boolean;
  message?: string | null;
  code?: string | null;
  severity?: HealthIssueSeverity;
  recordedAt?: ISODateTime;
}

export interface HealthCheckRecord {
  id: UUID;
  component: HealthComponent;
  status: HealthStatus;
  latencyMs: number | null;
  success: boolean;
  message: string | null;
  recordedAt: ISODateTime;
}

export interface ComponentHealthResult {
  component: HealthComponent;
  status: HealthStatus;
  latencyMs: number | null;
  message: string | null;
  checkedAt: ISODateTime;
}

export interface HealthStatusSnapshot {
  status: HealthStatus;
  uptime: number;
  errorRate: number;
  averageLatency: number;
  memoryStatus: HealthStatus;
  gatewayStatus: HealthStatus;
  toolsStatus: HealthStatus;
  loggerStatus: HealthStatus;
  metricsStatus: HealthStatus;
  costStatus: HealthStatus;
  traceStatus: HealthStatus;
  issues: HealthIssue[];
  checkedAt: ISODateTime;
}

export interface SerializedHealthIssue {
  code: string;
  severity: HealthIssueSeverity;
  component: HealthComponent;
  message: string;
  detectedAt: string;
}

export interface SerializedHealthSnapshot {
  status: HealthStatus;
  uptime: number;
  errorRate: number;
  averageLatency: number;
  memoryStatus: HealthStatus;
  gatewayStatus: HealthStatus;
  toolsStatus: HealthStatus;
  loggerStatus: HealthStatus;
  metricsStatus: HealthStatus;
  costStatus: HealthStatus;
  traceStatus: HealthStatus;
  issues: SerializedHealthIssue[];
  checkedAt: string;
}

export interface HealthProvider {
  save(record: HealthCheckRecord): void;
  listByComponent(component: HealthComponent): HealthCheckRecord[];
  listAll(): HealthCheckRecord[];
  reset?(): void;
}

export interface HealthManagerOptions {
  provider?: HealthProvider;
  startedAt?: ISODateTime;
}
