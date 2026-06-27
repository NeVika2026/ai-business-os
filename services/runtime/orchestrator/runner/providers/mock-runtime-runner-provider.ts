import type {
  RunnerProvider,
  RunnerRecord,
} from '@/services/runtime/orchestrator/runner/runtime-runner-types';
import type { UUID } from '@/types/runtime/dto';

export class MockRuntimeRunnerProvider implements RunnerProvider {
  private readonly records = new Map<UUID, RunnerRecord>();

  save(record: RunnerRecord): void {
    this.records.set(record.runId, record);
  }

  update(record: RunnerRecord): void {
    this.records.set(record.runId, record);
  }

  get(runId: UUID): RunnerRecord | null {
    return this.records.get(runId) ?? null;
  }

  reset(): void {
    this.records.clear();
  }
}

export function createMockRuntimeRunnerProvider(): MockRuntimeRunnerProvider {
  return new MockRuntimeRunnerProvider();
}

/** Shared in-memory store for local dev and tests. */
export const mockRuntimeRunnerProvider = createMockRuntimeRunnerProvider();
