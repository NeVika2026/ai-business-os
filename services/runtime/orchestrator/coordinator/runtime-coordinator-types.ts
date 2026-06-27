import type { ISODateTime, UUID } from '@/types/runtime/dto';
import type {
  OrchestratorProvider,
  OrchestratorTask,
} from '@/services/runtime/orchestrator/engine/runtime-orchestrator-types';
import type { RuntimeEventProvider } from '@/services/runtime/orchestrator/events/runtime-event-types';
import type {
  RuntimeStateProvider,
  RuntimeState,
} from '@/services/runtime/orchestrator/state/runtime-state-types';

export type CoordinatorStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface CoordinatorStartContext {
  organizationId: UUID;
  employeeId: UUID;
  runId: UUID;
  traceId: UUID;
  spanId?: UUID | null;
  tasks?: OrchestratorTask[];
  startedAt?: ISODateTime;
}

export interface CoordinatorRecord {
  runId: UUID;
  organizationId: UUID;
  employeeId: UUID;
  traceId: UUID;
  spanId: UUID | null;
  status: CoordinatorStatus;
  taskCatalog: OrchestratorTask[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface CoordinatorStatusView {
  status: CoordinatorStatus;
  state: RuntimeState;
  runId: UUID;
  traceId: UUID;
  currentTaskId: string | null;
  queueLength: number;
  completedTaskIds: string[];
  paused: boolean;
  cancelled: boolean;
}

export interface SerializedCoordinatorTask {
  id: string;
  type: string;
  priority: number;
  dependsOn: string[];
}

export interface SerializedCoordinatorSnapshot {
  runtime: {
    id: string;
    organizationId: string;
    employeeId: string;
    runId: string;
    traceId: string;
    status: string;
    currentTaskId: string | null;
    pendingTasks: SerializedCoordinatorTask[];
    completedTaskIds: string[];
    failedTaskIds: string[];
    plannedOrder: string[];
    paused: boolean;
    pauseReason: string | null;
    cancelled: boolean;
    cancelReason: string | null;
    result: Record<string, unknown> | null;
    error: { code: string; message: string } | null;
    createdAt: string;
    updatedAt: string;
  };
  state: RuntimeState;
  queue: SerializedCoordinatorTask[];
  currentTask: SerializedCoordinatorTask | null;
  status: CoordinatorStatus;
}

export interface CoordinatorProvider {
  save(record: CoordinatorRecord): void;
  update(record: CoordinatorRecord): void;
  get(runId: UUID): CoordinatorRecord | null;
  reset?(): void;
}

export interface RuntimeCoordinatorOptions {
  provider?: CoordinatorProvider;
  stateProvider?: RuntimeStateProvider;
  orchestratorProvider?: OrchestratorProvider;
  eventProvider?: RuntimeEventProvider;
}

export interface CoordinatorDispatchResult {
  status: CoordinatorStatusView;
  task: OrchestratorTask | null;
  finished: boolean;
}
