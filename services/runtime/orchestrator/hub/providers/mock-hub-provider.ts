import type {
  HubExecutionRecord,
  HubProvider,
} from '@/services/runtime/orchestrator/hub/hub-types';

export class MockHubProvider implements HubProvider {
  private readonly records = new Map<string, HubExecutionRecord>();

  save(record: HubExecutionRecord): void {
    this.records.set(record.sprintId, record);
  }

  update(record: HubExecutionRecord): void {
    this.records.set(record.sprintId, record);
  }

  get(sprintId: string): HubExecutionRecord | null {
    return this.records.get(sprintId) ?? null;
  }

  reset(): void {
    this.records.clear();
  }
}

export function createMockHubProvider(): MockHubProvider {
  return new MockHubProvider();
}

/** Shared in-memory store for local dev and tests. */
export const mockHubProvider = createMockHubProvider();
