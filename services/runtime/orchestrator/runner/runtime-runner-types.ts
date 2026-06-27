import type { ISODateTime, UUID } from '@/types/runtime/dto';
import type { RuntimeCoordinator } from '@/services/runtime/orchestrator/coordinator/runtime-coordinator';
import type {
  CoordinatorStartContext,
  CoordinatorStatus,
} from '@/services/runtime/orchestrator/coordinator/runtime-coordinator-types';

export type RunnerStatus =
  | 'idle'
  | 'running'
  | 'stopped'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused';

export type RunnerStopReason =
  | 'completed'
  | 'paused'
  | 'cancelled'
  | 'failed'
  | 'max_steps'
  | 'stopped'
  | 'dispatch_error'
  | 'not_started';

export interface RunnerRecord {
  runId: UUID;
  organizationId: UUID;
  employeeId: UUID;
  traceId: UUID;
  status: RunnerStatus;
  stepCount: number;
  executedTasks: string[];
  startedAt: ISODateTime;
  updatedAt: ISODateTime;
  stoppedAt: ISODateTime | null;
  finished: boolean;
  finalStatus: CoordinatorStatus | null;
  durationMs: number;
  stopReason: RunnerStopReason | null;
}

export interface RunnerStepResult {
  status: RunnerStatus;
  taskId: string | null;
  finished: boolean;
  stepCount: number;
}

export interface RunnerRunResult {
  finished: boolean;
  executedTasks: string[];
  duration: number;
  finalStatus: CoordinatorStatus;
  steps: number;
  stopReason: RunnerStopReason;
}

export interface RunnerStatusView {
  status: RunnerStatus;
  runId: UUID | null;
  stepCount: number;
  executedTasks: string[];
  finished: boolean;
  finalStatus: CoordinatorStatus | null;
  durationMs: number;
  stopReason: RunnerStopReason | null;
}

export interface SerializedRunnerRecord {
  runId: string;
  organizationId: string;
  employeeId: string;
  traceId: string;
  status: RunnerStatus;
  stepCount: number;
  executedTasks: string[];
  startedAt: string;
  updatedAt: string;
  stoppedAt: string | null;
  finished: boolean;
  finalStatus: CoordinatorStatus | null;
  durationMs: number;
  stopReason: RunnerStopReason | null;
}

export interface SerializedRunnerSnapshot {
  runner: SerializedRunnerRecord;
  coordinatorStatus: CoordinatorStatus | null;
  coordinatorState: string | null;
}

export interface RunnerProvider {
  save(record: RunnerRecord): void;
  update(record: RunnerRecord): void;
  get(runId: UUID): RunnerRecord | null;
  reset?(): void;
}

export interface RuntimeRunnerOptions {
  provider?: RunnerProvider;
  coordinator?: RuntimeCoordinator;
  maxSteps?: number;
}

export type RunnerStartContext = CoordinatorStartContext;

export const DEFAULT_MAX_RUNNER_STEPS = 1000;
