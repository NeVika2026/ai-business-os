import type {
  RuntimeEvent,
  RuntimeEventDispatchError,
  RuntimeEventFilter,
  RuntimeEventProvider,
  RuntimeEventSubscription,
} from '@/services/runtime/orchestrator/events/runtime-event-types';
import type { UUID } from '@/types/runtime/dto';

let dispatchErrorSequence = 0;

function hashSeed(seed: string): number {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function createDispatchErrorId(seed: string): UUID {
  const next = dispatchErrorSequence;
  dispatchErrorSequence += 1;
  const suffix = hashSeed(`event-error:${seed}:${next}`)
    .toString(16)
    .padStart(12, '0')
    .slice(0, 12);

  return `11000001-0000-4000-8000-${suffix}`;
}

export function dispatchEventToSubscribers(
  event: RuntimeEvent,
  subscriptions: RuntimeEventSubscription[],
  provider: RuntimeEventProvider,
): { dispatchedTo: number; handlerErrors: number } {
  const matching = subscriptions
    .filter((subscription) => subscription.type === event.type)
    .sort((left, right) => left.order - right.order);

  let handlerErrors = 0;

  for (const subscription of matching) {
    try {
      subscription.handler(event);
    } catch (error) {
      handlerErrors += 1;
      const message = error instanceof Error ? error.message : String(error);
      const dispatchError: RuntimeEventDispatchError = {
        id: createDispatchErrorId(`${subscription.id}:${event.id}`),
        subscriptionId: subscription.id,
        eventId: event.id,
        eventType: event.type,
        message,
        timestamp: new Date().toISOString(),
      };

      provider.appendError(dispatchError);
    }
  }

  return {
    dispatchedTo: matching.length,
    handlerErrors,
  };
}

export function matchesEventFilter(event: RuntimeEvent, filter?: RuntimeEventFilter): boolean {
  if (!filter) {
    return true;
  }

  if (filter.type) {
    const types = Array.isArray(filter.type) ? filter.type : [filter.type];

    if (!types.includes(event.type)) {
      return false;
    }
  }

  if (filter.organizationId && event.organizationId !== filter.organizationId) {
    return false;
  }

  if (filter.employeeId && event.employeeId !== filter.employeeId) {
    return false;
  }

  if (filter.traceId && event.traceId !== filter.traceId) {
    return false;
  }

  if (filter.runId && event.runId !== filter.runId) {
    return false;
  }

  if (filter.spanId && event.spanId !== filter.spanId) {
    return false;
  }

  if (filter.source && event.source !== filter.source) {
    return false;
  }

  if (filter.from || filter.to) {
    const timestamp = Date.parse(event.timestamp);

    if (Number.isNaN(timestamp)) {
      return false;
    }

    if (filter.from) {
      const from = Date.parse(filter.from);

      if (!Number.isNaN(from) && timestamp < from) {
        return false;
      }
    }

    if (filter.to) {
      const to = Date.parse(filter.to);

      if (!Number.isNaN(to) && timestamp > to) {
        return false;
      }
    }
  }

  return true;
}

export function resetDispatchErrorSequence(): void {
  dispatchErrorSequence = 0;
}
