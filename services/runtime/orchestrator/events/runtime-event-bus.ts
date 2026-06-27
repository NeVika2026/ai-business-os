import { dispatchEventToSubscribers } from '@/services/runtime/orchestrator/events/runtime-event-dispatcher';
import { RuntimeEventSubscriptionNotFoundError } from '@/services/runtime/orchestrator/events/runtime-event-errors';
import {
  filterErrorsByEvents,
  filterErrorsByFilter,
  serializeRuntimeEventReport,
} from '@/services/runtime/orchestrator/events/runtime-event-serializer';
import {
  validateEventInput,
  validateEventType,
  validateSubscriptionId,
} from '@/services/runtime/orchestrator/events/runtime-event-validator';
import type {
  RuntimeEvent,
  RuntimeEventBusOptions,
  RuntimeEventFilter,
  RuntimeEventHandler,
  RuntimeEventInput,
  RuntimeEventProvider,
  RuntimeEventPublishResult,
  RuntimeEventSubscription,
  SerializedRuntimeEventReport,
} from '@/services/runtime/orchestrator/events/runtime-event-types';
import {
  createMockRuntimeEventProvider,
  mockRuntimeEventProvider,
} from '@/services/runtime/orchestrator/events/providers/mock-runtime-event-provider';
import type { UUID } from '@/types/runtime/dto';

let eventSequence = 0;
let subscriptionSequence = 0;

function hashSeed(seed: string): number {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function createEventId(seed: string): UUID {
  const next = eventSequence;
  eventSequence += 1;
  const suffix = hashSeed(`event:${seed}:${next}`).toString(16).padStart(12, '0').slice(0, 12);

  return `11000002-0000-4000-8000-${suffix}`;
}

function createSubscriptionId(type: string): UUID {
  const next = subscriptionSequence;
  subscriptionSequence += 1;
  const suffix = hashSeed(`subscription:${type}:${next}`)
    .toString(16)
    .padStart(12, '0')
    .slice(0, 12);

  return `11000003-0000-4000-8000-${suffix}`;
}

function normalizeObject(value?: Record<string, unknown>): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return { ...value };
}

function buildEvent(input: RuntimeEventInput): RuntimeEvent {
  validateEventInput(input);

  const timestamp = input.timestamp ?? new Date().toISOString();

  return {
    id: input.id ?? createEventId(`${input.type}:${timestamp}`),
    type: input.type,
    timestamp,
    organizationId: input.organizationId,
    employeeId: input.employeeId,
    traceId: input.traceId,
    runId: input.runId,
    spanId: input.spanId ?? null,
    source: input.source,
    payload: normalizeObject(input.payload),
    metadata: normalizeObject(input.metadata),
  };
}

/**
 * Per-execution runtime event bus. Each runtime run should create its own instance
 * via createRuntimeEventBus() so subscriptions and events are not shared across concurrent requests.
 */
export class RuntimeEventBus {
  private readonly subscriptions = new Map<UUID, RuntimeEventSubscription>();

  constructor(private readonly provider: RuntimeEventProvider) {}

  publish(input: RuntimeEventInput): RuntimeEventPublishResult {
    const event = buildEvent(input);
    this.provider.save(event);

    const dispatchResult = dispatchEventToSubscribers(
      event,
      [...this.subscriptions.values()],
      this.provider,
    );

    return {
      event,
      dispatchedTo: dispatchResult.dispatchedTo,
      handlerErrors: dispatchResult.handlerErrors,
    };
  }

  subscribe(type: string, handler: RuntimeEventHandler): UUID {
    validateEventType(type);

    const subscription: RuntimeEventSubscription = {
      id: createSubscriptionId(type),
      type,
      order: subscriptionSequence,
      handler,
    };

    this.subscriptions.set(subscription.id, subscription);
    return subscription.id;
  }

  unsubscribe(subscriptionId: UUID): void {
    validateSubscriptionId(subscriptionId);

    if (!this.subscriptions.delete(subscriptionId)) {
      throw new RuntimeEventSubscriptionNotFoundError(subscriptionId);
    }
  }

  history(filter?: RuntimeEventFilter): RuntimeEvent[] {
    return this.provider.list(filter);
  }

  clear(): void {
    this.subscriptions.clear();
    this.provider.reset?.();
  }

  serialize(filter?: RuntimeEventFilter): SerializedRuntimeEventReport {
    const events = this.provider.list(filter);
    const allErrors = this.provider.listErrors();
    const scopedErrors = filterErrorsByFilter(allErrors, filter);
    const errors = filter ? filterErrorsByEvents(scopedErrors, events) : allErrors;

    return serializeRuntimeEventReport(events, errors);
  }

  getSubscriptionCount(type?: string): number {
    if (!type) {
      return this.subscriptions.size;
    }

    return [...this.subscriptions.values()].filter((subscription) => subscription.type === type)
      .length;
  }
}

export function createRuntimeEventBus(options?: RuntimeEventBusOptions): RuntimeEventBus {
  const provider = options?.provider ?? mockRuntimeEventProvider;
  return new RuntimeEventBus(provider);
}

/** Default dev/test singleton. Do not use for concurrent production runtime executions. */
export const runtimeEventBus = createRuntimeEventBus();

export { createMockRuntimeEventProvider, mockRuntimeEventProvider };

export function resetRuntimeEventSequences(): void {
  eventSequence = 0;
  subscriptionSequence = 0;
}
