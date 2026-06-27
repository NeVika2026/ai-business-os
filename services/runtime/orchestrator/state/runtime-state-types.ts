import type { ISODateTime, UUID } from '@/types/runtime/dto';

export type RuntimeState =
  | 'created'
  | 'initializing'
  | 'planning'
  | 'executing'
  | 'waiting'
  | 'completed'
  | 'failed'
  | 'cancelled';

export const RUNTIME_STATES: RuntimeState[] = [
  'created',
  'initializing',
  'planning',
  'executing',
  'waiting',
  'completed',
  'failed',
  'cancelled',
];

export interface RuntimeStateCreateContext {
  organizationId: UUID;
  employeeId: UUID;
  runId: UUID;
  traceId: UUID;
  createdAt?: ISODateTime;
}

export interface RuntimeStateRecord {
  id: UUID;
  state: RuntimeState;
  organizationId: UUID;
  employeeId: UUID;
  runId: UUID;
  traceId: UUID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface RuntimeStateTransitionRecord {
  from: RuntimeState;
  to: RuntimeState;
  transitionAt: ISODateTime;
}

export interface RuntimeStateHistory {
  runId: UUID;
  transitions: RuntimeStateTransitionRecord[];
}

export interface SerializedRuntimeState {
  id: string;
  state: RuntimeState;
  organizationId: string;
  employeeId: string;
  runId: string;
  traceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedRuntimeTransition {
  from: RuntimeState;
  to: RuntimeState;
  transitionAt: string;
}

export interface SerializedRuntimeStateSnapshot {
  current: SerializedRuntimeState;
  history: SerializedRuntimeTransition[];
}

export interface RuntimeStateProvider {
  save(record: RuntimeStateRecord): void;
  get(runId: UUID): RuntimeStateRecord | null;
  update(record: RuntimeStateRecord): void;
  history(runId: UUID): RuntimeStateTransitionRecord[];
  appendHistory(runId: UUID, transition: RuntimeStateTransitionRecord): void;
  reset?(): void;
}

export interface RuntimeStateMachineOptions {
  provider?: RuntimeStateProvider;
}
