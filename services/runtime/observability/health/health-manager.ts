import {
  aggregateHealthStatus,
  evaluateAllComponents,
  groupRecordsByComponent,
} from '@/services/runtime/observability/health/health-aggregator';
import {
  evaluateComponentHealth,
  worstStatus,
} from '@/services/runtime/observability/health/health-checks';
import { HealthValidationError } from '@/services/runtime/observability/health/health-errors';
import { serializeHealthSnapshot } from '@/services/runtime/observability/health/health-serializer';
import type {
  ComponentHealthResult,
  HealthCheckInput,
  HealthCheckRecord,
  HealthComponent,
  HealthManagerOptions,
  HealthProvider,
  HealthStatusSnapshot,
  SerializedHealthSnapshot,
} from '@/services/runtime/observability/health/health-types';
import {
  createMockHealthProvider,
  mockHealthProvider,
} from '@/services/runtime/observability/health/providers/mock-health-provider';
import type { UUID } from '@/types/runtime/dto';

let healthCheckSequence = 0;

const OBSERVABILITY_COMPONENTS: HealthComponent[] = ['logger', 'metrics', 'cost', 'trace'];

function hashSeed(seed: string): number {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function createHealthCheckId(seed: string): UUID {
  const next = healthCheckSequence;
  healthCheckSequence += 1;
  const suffix = hashSeed(`health:${seed}:${next}`).toString(16).padStart(12, '0').slice(0, 12);

  return `10000001-0000-4000-8000-${suffix}`;
}

function isValidStatus(value: unknown): value is HealthCheckInput['status'] {
  return value === 'healthy' || value === 'degraded' || value === 'unhealthy';
}

function validateCheckInput(input: HealthCheckInput): void {
  if (!input || typeof input !== 'object') {
    throw new HealthValidationError('check input must be an object');
  }

  if (!input.component) {
    throw new HealthValidationError('component is required');
  }

  if (!isValidStatus(input.status)) {
    throw new HealthValidationError('status must be healthy, degraded, or unhealthy');
  }
}

function buildCheckRecord(input: HealthCheckInput): HealthCheckRecord {
  validateCheckInput(input);

  const recordedAt = input.recordedAt ?? new Date().toISOString();
  const success = input.success ?? input.status === 'healthy';

  return {
    id: createHealthCheckId(`${input.component}:${recordedAt}`),
    component: input.component,
    status: input.status,
    latencyMs: input.latencyMs ?? null,
    success,
    message: input.message ?? null,
    recordedAt,
  };
}

/**
 * Per-execution health monitor. Each runtime run should create its own instance
 * via createHealthManager() so health state is not shared across concurrent requests.
 */
export class HealthManager {
  private readonly startedAt: string;

  constructor(
    private readonly provider: HealthProvider,
    options?: HealthManagerOptions,
  ) {
    this.startedAt = options?.startedAt ?? new Date().toISOString();
  }

  record(check: HealthCheckInput): HealthCheckRecord {
    const record = buildCheckRecord(check);
    this.provider.save(record);
    return record;
  }

  checkRuntime(): ComponentHealthResult {
    return this.checkComponent('runtime');
  }

  checkGateway(): ComponentHealthResult {
    return this.checkComponent('gateway');
  }

  checkTools(): ComponentHealthResult {
    return this.checkComponent('tools');
  }

  checkMemory(): ComponentHealthResult {
    return this.checkComponent('memory');
  }

  checkObservability(): ComponentHealthResult {
    const checkedAt = new Date().toISOString();
    const subResults = OBSERVABILITY_COMPONENTS.map((component) => this.checkComponent(component));
    const observabilityRecords = this.provider.listByComponent('observability');
    const statuses = [
      ...subResults.map((result) => result.status),
      ...observabilityRecords.map((record) => record.status),
    ];
    const latencies = [
      ...subResults
        .map((result) => result.latencyMs)
        .filter((value): value is number => typeof value === 'number'),
      ...observabilityRecords
        .map((record) => record.latencyMs)
        .filter((value): value is number => typeof value === 'number'),
    ];
    const averageLatency =
      latencies.length > 0
        ? Number((latencies.reduce((sum, value) => sum + value, 0) / latencies.length).toFixed(4))
        : null;

    return {
      component: 'observability',
      status: worstStatus(statuses.length > 0 ? statuses : ['healthy']),
      latencyMs: averageLatency,
      message: observabilityRecords.at(-1)?.message ?? subResults.at(-1)?.message ?? null,
      checkedAt,
    };
  }

  getStatus(): HealthStatusSnapshot {
    const checkedAt = new Date().toISOString();
    const records = this.provider.listAll();
    const grouped = groupRecordsByComponent(records);
    const componentResults = evaluateAllComponents(grouped, checkedAt);

    return aggregateHealthStatus(records, componentResults, this.startedAt, checkedAt);
  }

  serialize(): SerializedHealthSnapshot {
    return serializeHealthSnapshot(this.getStatus());
  }

  reset(): void {
    this.provider.reset?.();
  }

  private checkComponent(component: HealthComponent): ComponentHealthResult {
    const checkedAt = new Date().toISOString();
    const records = this.provider.listByComponent(component);
    return evaluateComponentHealth(component, records, checkedAt);
  }
}

export function createHealthManager(options?: HealthManagerOptions): HealthManager {
  const provider = options?.provider ?? mockHealthProvider;
  return new HealthManager(provider, options);
}

/** Default dev/test singleton. Do not use for concurrent production runtime executions. */
export const health = createHealthManager();

export { createMockHealthProvider, mockHealthProvider };

export function resetHealthCheckSequence(): void {
  healthCheckSequence = 0;
}
