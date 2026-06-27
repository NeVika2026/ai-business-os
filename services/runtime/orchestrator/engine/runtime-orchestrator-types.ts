import type { ISODateTime, UUID } from '@/types/runtime/dto';

export type OrchestratorStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface OrchestratorStartContext {
  organizationId: UUID;
  employeeId: UUID;
  runId: UUID;
  traceId: UUID;
  startedAt?: ISODateTime;
}

export interface OrchestratorTask {
  id: string;
  type: string;
  priority: number;
  dependsOn: string[];
}

export interface OrchestratorError {
  code: string;
  message: string;
}

export interface OrchestratorRuntime {
  id: UUID;
  organizationId: UUID;
  employeeId: UUID;
  runId: UUID;
  traceId: UUID;
  status: OrchestratorStatus;
  currentTaskId: string | null;
  pendingTasks: OrchestratorTask[];
  completedTaskIds: string[];
  failedTaskIds: string[];
  plannedOrder: string[];
  paused: boolean;
  pauseReason: string | null;
  cancelled: boolean;
  cancelReason: string | null;
  result: Record<string, unknown> | null;
  error: OrchestratorError | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface SerializedOrchestratorRuntime {
  id: string;
  organizationId: string;
  employeeId: string;
  runId: string;
  traceId: string;
  status: OrchestratorStatus;
  currentTaskId: string | null;
  pendingTasks: OrchestratorTask[];
  completedTaskIds: string[];
  failedTaskIds: string[];
  plannedOrder: string[];
  paused: boolean;
  pauseReason: string | null;
  cancelled: boolean;
  cancelReason: string | null;
  result: Record<string, unknown> | null;
  error: OrchestratorError | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrchestratorProvider {
  save(runtime: OrchestratorRuntime): void;
  get(runId: UUID): OrchestratorRuntime | null;
  update(runtime: OrchestratorRuntime): void;
  reset?(): void;
}

export interface OrchestratorOptions {
  provider?: OrchestratorProvider;
}

export interface OrchestratorNextResult {
  runtime: OrchestratorRuntime;
  task: OrchestratorTask | null;
  finished: boolean;
}
