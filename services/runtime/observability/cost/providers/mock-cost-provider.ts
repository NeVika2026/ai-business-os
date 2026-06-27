import { matchesCostFilter } from '@/services/runtime/observability/cost/cost-serializer';
import type {
  CostEntry,
  CostFilter,
  CostProvider,
} from '@/services/runtime/observability/cost/cost-types';
import type { UUID } from '@/types/runtime/dto';

export class MockCostProvider implements CostProvider {
  private readonly entries = new Map<UUID, CostEntry>();

  save(entry: CostEntry): void {
    this.entries.set(entry.id, entry);
  }

  getById(id: UUID): CostEntry | null {
    return this.entries.get(id) ?? null;
  }

  list(filter?: CostFilter): CostEntry[] {
    return [...this.entries.values()]
      .filter((entry) => matchesCostFilter(entry, filter))
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  reset(): void {
    this.entries.clear();
  }
}

export function createMockCostProvider(): MockCostProvider {
  return new MockCostProvider();
}

/** Shared in-memory store for local dev and tests. */
export const mockCostProvider = createMockCostProvider();
