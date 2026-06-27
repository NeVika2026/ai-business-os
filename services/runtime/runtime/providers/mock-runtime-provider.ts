import type { RuntimeProvider, RuntimeRecord } from '@/services/runtime/runtime/runtime-types';

export class MockRuntimeProvider implements RuntimeProvider {
  private readonly records = new Map<string, RuntimeRecord>();

  save(instanceId: string, record: RuntimeRecord): void {
    this.records.set(instanceId, record);
  }

  update(instanceId: string, record: RuntimeRecord): void {
    this.records.set(instanceId, record);
  }

  get(instanceId: string): RuntimeRecord | null {
    return this.records.get(instanceId) ?? null;
  }

  reset(): void {
    this.records.clear();
  }
}

export function createMockRuntimeProvider(): MockRuntimeProvider {
  return new MockRuntimeProvider();
}

/** Shared in-memory store for local dev and tests. */
export const mockRuntimeProvider = createMockRuntimeProvider();
