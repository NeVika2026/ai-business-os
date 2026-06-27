import type {
  CoordinatorProvider,
  CoordinatorRecord,
} from '@/services/runtime/orchestrator/coordinator/runtime-coordinator-types';
import type { UUID } from '@/types/runtime/dto';

export class MockRuntimeCoordinatorProvider implements CoordinatorProvider {
  private readonly records = new Map<UUID, CoordinatorRecord>();

  save(record: CoordinatorRecord): void {
    this.records.set(record.runId, record);
  }

  update(record: CoordinatorRecord): void {
    this.records.set(record.runId, record);
  }

  get(runId: UUID): CoordinatorRecord | null {
    return this.records.get(runId) ?? null;
  }

  reset(): void {
    this.records.clear();
  }
}

export function createMockRuntimeCoordinatorProvider(): MockRuntimeCoordinatorProvider {
  return new MockRuntimeCoordinatorProvider();
}

/** Shared in-memory store for local dev and tests. */
export const mockRuntimeCoordinatorProvider = createMockRuntimeCoordinatorProvider();
