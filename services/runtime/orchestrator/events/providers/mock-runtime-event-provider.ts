import { matchesEventFilter } from '@/services/runtime/orchestrator/events/runtime-event-dispatcher';
import type {
  RuntimeEvent,
  RuntimeEventDispatchError,
  RuntimeEventFilter,
  RuntimeEventProvider,
} from '@/services/runtime/orchestrator/events/runtime-event-types';
import type { UUID } from '@/types/runtime/dto';

export class MockRuntimeEventProvider implements RuntimeEventProvider {
  private readonly events = new Map<UUID, RuntimeEvent>();
  private readonly errors: RuntimeEventDispatchError[] = [];

  save(event: RuntimeEvent): void {
    this.events.set(event.id, event);
  }

  list(filter?: RuntimeEventFilter): RuntimeEvent[] {
    return [...this.events.values()]
      .filter((event) => matchesEventFilter(event, filter))
      .sort((left, right) => left.timestamp.localeCompare(right.timestamp));
  }

  appendError(error: RuntimeEventDispatchError): void {
    this.errors.push(error);
  }

  listErrors(): RuntimeEventDispatchError[] {
    return [...this.errors].sort((left, right) => left.timestamp.localeCompare(right.timestamp));
  }

  reset(): void {
    this.events.clear();
    this.errors.length = 0;
  }
}

export function createMockRuntimeEventProvider(): MockRuntimeEventProvider {
  return new MockRuntimeEventProvider();
}

/** Shared in-memory store for local dev and tests. */
export const mockRuntimeEventProvider = createMockRuntimeEventProvider();
