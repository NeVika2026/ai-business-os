import type {
  RuntimeEvent,
  RuntimeEventDispatchError,
  RuntimeEventFilter,
  SerializedRuntimeEvent,
  SerializedRuntimeEventDispatchError,
  SerializedRuntimeEventReport,
} from '@/services/runtime/orchestrator/events/runtime-event-types';

export function serializeRuntimeEvent(event: RuntimeEvent): SerializedRuntimeEvent {
  return {
    id: event.id,
    type: event.type,
    timestamp: event.timestamp,
    organizationId: event.organizationId,
    employeeId: event.employeeId,
    traceId: event.traceId,
    runId: event.runId,
    spanId: event.spanId,
    source: event.source,
    payload: { ...event.payload },
    metadata: { ...event.metadata },
  };
}

export function serializeRuntimeEventDispatchError(
  error: RuntimeEventDispatchError,
): SerializedRuntimeEventDispatchError {
  return {
    id: error.id,
    subscriptionId: error.subscriptionId,
    eventId: error.eventId,
    eventType: error.eventType,
    message: error.message,
    timestamp: error.timestamp,
  };
}

export function serializeRuntimeEventReport(
  events: RuntimeEvent[],
  errors: RuntimeEventDispatchError[],
): SerializedRuntimeEventReport {
  return {
    events: events.map(serializeRuntimeEvent),
    errors: errors.map(serializeRuntimeEventDispatchError),
    count: events.length,
  };
}

export function filterErrorsByEvents(
  errors: RuntimeEventDispatchError[],
  events: RuntimeEvent[],
): RuntimeEventDispatchError[] {
  const eventIds = new Set(events.map((event) => event.id));
  return errors.filter((error) => eventIds.has(error.eventId));
}

export function filterErrorsByFilter(
  errors: RuntimeEventDispatchError[],
  filter?: RuntimeEventFilter,
): RuntimeEventDispatchError[] {
  if (!filter?.type) {
    return errors;
  }

  const types = Array.isArray(filter.type) ? filter.type : [filter.type];
  return errors.filter((error) => types.includes(error.eventType));
}
