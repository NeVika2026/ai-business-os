import { matchesMetricsFilter } from '@/services/runtime/observability/metrics/metrics-serializer';
import type {
  MetricRecord,
  MetricsFilter,
  MetricsProvider,
} from '@/services/runtime/observability/metrics/metrics-types';
import type { UUID } from '@/types/runtime/dto';

export class MockMetricsProvider implements MetricsProvider {
  private readonly records = new Map<UUID, MetricRecord>();

  save(record: MetricRecord): void {
    this.records.set(record.id, record);
  }

  getById(id: UUID): MetricRecord | null {
    return this.records.get(id) ?? null;
  }

  list(filter?: MetricsFilter): MetricRecord[] {
    return [...this.records.values()]
      .filter((record) => matchesMetricsFilter(record, filter))
      .sort((left, right) => left.timestamp.localeCompare(right.timestamp));
  }

  reset(): void {
    this.records.clear();
  }
}

export function createMockMetricsProvider(): MockMetricsProvider {
  return new MockMetricsProvider();
}

/** Shared in-memory store for local dev and tests. */
export const mockMetricsProvider = createMockMetricsProvider();
