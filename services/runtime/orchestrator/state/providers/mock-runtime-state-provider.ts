import type {
  RuntimeStateProvider,
  RuntimeStateRecord,
  RuntimeStateTransitionRecord,
} from '@/services/runtime/orchestrator/state/runtime-state-types';
import type { UUID } from '@/types/runtime/dto';

export class MockRuntimeStateProvider implements RuntimeStateProvider {
  private readonly records = new Map<UUID, RuntimeStateRecord>();
  private readonly histories = new Map<UUID, RuntimeStateTransitionRecord[]>();

  save(record: RuntimeStateRecord): void {
    this.records.set(record.runId, record);

    if (!this.histories.has(record.runId)) {
      this.histories.set(record.runId, []);
    }
  }

  get(runId: UUID): RuntimeStateRecord | null {
    return this.records.get(runId) ?? null;
  }

  update(record: RuntimeStateRecord): void {
    this.records.set(record.runId, record);
  }

  history(runId: UUID): RuntimeStateTransitionRecord[] {
    return [...(this.histories.get(runId) ?? [])];
  }

  appendHistory(runId: UUID, transition: RuntimeStateTransitionRecord): void {
    const existing = this.histories.get(runId) ?? [];
    existing.push(transition);
    this.histories.set(runId, existing);
  }

  reset(): void {
    this.records.clear();
    this.histories.clear();
  }
}

export function createMockRuntimeStateProvider(): MockRuntimeStateProvider {
  return new MockRuntimeStateProvider();
}

/** Shared in-memory store for local dev and tests. */
export const mockRuntimeStateProvider = createMockRuntimeStateProvider();
