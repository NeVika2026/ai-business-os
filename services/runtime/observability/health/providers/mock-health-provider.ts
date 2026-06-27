import type {
  HealthCheckRecord,
  HealthComponent,
  HealthProvider,
} from '@/services/runtime/observability/health/health-types';
import type { UUID } from '@/types/runtime/dto';

export class MockHealthProvider implements HealthProvider {
  private readonly records = new Map<UUID, HealthCheckRecord>();

  save(record: HealthCheckRecord): void {
    this.records.set(record.id, record);
  }

  listByComponent(component: HealthComponent): HealthCheckRecord[] {
    return [...this.records.values()]
      .filter((record) => record.component === component)
      .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt));
  }

  listAll(): HealthCheckRecord[] {
    return [...this.records.values()].sort((left, right) =>
      left.recordedAt.localeCompare(right.recordedAt),
    );
  }

  reset(): void {
    this.records.clear();
  }
}

export function createMockHealthProvider(): MockHealthProvider {
  return new MockHealthProvider();
}

/** Shared in-memory store for local dev and tests. */
export const mockHealthProvider = createMockHealthProvider();
