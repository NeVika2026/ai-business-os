import type { ISODateTime, UUID } from '@/types/runtime/dto';

export interface RuntimeEventInput {
  id?: UUID;
  type: string;
  timestamp?: ISODateTime;
  organizationId: UUID;
  employeeId: UUID;
  traceId: UUID;
  runId: UUID;
  spanId?: UUID | null;
  source: string;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface RuntimeEvent {
  id: UUID;
  type: string;
  timestamp: ISODateTime;
  organizationId: UUID;
  employeeId: UUID;
  traceId: UUID;
  runId: UUID;
  spanId: UUID | null;
  source: string;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export type RuntimeEventHandler = (event: RuntimeEvent) => void;

export interface RuntimeEventSubscription {
  id: UUID;
  type: string;
  order: number;
  handler: RuntimeEventHandler;
}

export interface RuntimeEventDispatchError {
  id: UUID;
  subscriptionId: UUID;
  eventId: UUID;
  eventType: string;
  message: string;
  timestamp: ISODateTime;
}

export interface RuntimeEventFilter {
  type?: string | string[];
  organizationId?: UUID;
  employeeId?: UUID;
  traceId?: UUID;
  runId?: UUID;
  spanId?: UUID;
  source?: string;
  from?: ISODateTime;
  to?: ISODateTime;
}

export interface SerializedRuntimeEvent {
  id: string;
  type: string;
  timestamp: string;
  organizationId: string;
  employeeId: string;
  traceId: string;
  runId: string;
  spanId: string | null;
  source: string;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface SerializedRuntimeEventDispatchError {
  id: string;
  subscriptionId: string;
  eventId: string;
  eventType: string;
  message: string;
  timestamp: string;
}

export interface SerializedRuntimeEventReport {
  events: SerializedRuntimeEvent[];
  errors: SerializedRuntimeEventDispatchError[];
  count: number;
}

export interface RuntimeEventProvider {
  save(event: RuntimeEvent): void;
  list(filter?: RuntimeEventFilter): RuntimeEvent[];
  appendError(error: RuntimeEventDispatchError): void;
  listErrors(): RuntimeEventDispatchError[];
  reset?(): void;
}

export interface RuntimeEventBusOptions {
  provider?: RuntimeEventProvider;
}

export interface RuntimeEventPublishResult {
  event: RuntimeEvent;
  dispatchedTo: number;
  handlerErrors: number;
}
