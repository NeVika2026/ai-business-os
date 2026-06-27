import { matchesLogFilter } from '@/services/runtime/observability/logger/logger-filter';
import type {
  LogEntry,
  LogFilter,
  LogProvider,
} from '@/services/runtime/observability/logger/logger-types';
import type { UUID } from '@/types/runtime/dto';

export class MockLogProvider implements LogProvider {
  private readonly entries = new Map<UUID, LogEntry>();

  save(entry: LogEntry): void {
    this.entries.set(entry.id, entry);
  }

  getById(id: UUID): LogEntry | null {
    return this.entries.get(id) ?? null;
  }

  list(filter?: LogFilter): LogEntry[] {
    return [...this.entries.values()]
      .filter((entry) => matchesLogFilter(entry, filter))
      .sort((left, right) => left.timestamp.localeCompare(right.timestamp));
  }

  reset(): void {
    this.entries.clear();
  }
}

export function createMockLogProvider(): MockLogProvider {
  return new MockLogProvider();
}

/** Shared in-memory store for local dev and tests. */
export const mockLogProvider = createMockLogProvider();
