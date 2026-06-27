import type {
  RuntimeTraceRecord,
  TraceProvider,
} from '@/services/runtime/observability/trace-types';
import type { UUID } from '@/types/runtime/dto';

export class MockTraceProvider implements TraceProvider {
  private readonly store = new Map<UUID, RuntimeTraceRecord>();

  save(trace: RuntimeTraceRecord): void {
    this.store.set(trace.spanId, trace);
  }

  get(spanId: UUID): RuntimeTraceRecord | null {
    return this.store.get(spanId) ?? null;
  }

  listByRunId(runId: UUID): RuntimeTraceRecord[] {
    return [...this.store.values()].filter((trace) => trace.runId === runId);
  }

  reset(): void {
    this.store.clear();
  }
}

export function createMockTraceProvider(): MockTraceProvider {
  return new MockTraceProvider();
}

/** Shared in-memory store for local dev and tests. */
export const mockTraceProvider = createMockTraceProvider();
