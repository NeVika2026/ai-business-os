import {
  createRuntimeCoordinator,
  type RuntimeCoordinator,
} from '@/services/runtime/orchestrator/coordinator/runtime-coordinator';
import type { CoordinatorStatus } from '@/services/runtime/orchestrator/coordinator/runtime-coordinator-types';
import {
  RunnerInvalidStateError,
  RunnerNotStartedError,
} from '@/services/runtime/orchestrator/runner/runtime-runner-errors';
import { executeRunnerLoop } from '@/services/runtime/orchestrator/runner/runtime-runner-loop';
import { serializeRunnerSnapshot } from '@/services/runtime/orchestrator/runner/runtime-runner-serializer';
import {
  DEFAULT_MAX_RUNNER_STEPS,
  type RunnerProvider,
  type RunnerRecord,
  type RunnerRunResult,
  type RunnerStartContext,
  type RunnerStatus,
  type RunnerStatusView,
  type RunnerStepResult,
  type RuntimeRunnerOptions,
  type SerializedRunnerSnapshot,
} from '@/services/runtime/orchestrator/runner/runtime-runner-types';
import { validateRunnerStartContext } from '@/services/runtime/orchestrator/runner/runtime-runner-validator';
import {
  createMockRuntimeRunnerProvider,
  mockRuntimeRunnerProvider,
} from '@/services/runtime/orchestrator/runner/providers/mock-runtime-runner-provider';
import type { UUID } from '@/types/runtime/dto';

function mapCoordinatorToRunnerStatus(status: CoordinatorStatus, stopped: boolean): RunnerStatus {
  if (stopped) {
    return 'stopped';
  }

  switch (status) {
    case 'paused':
      return 'paused';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'cancelled':
      return 'cancelled';
    case 'running':
      return 'running';
    default:
      return 'idle';
  }
}

/**
 * Per-execution auto runner. Each runtime run should create its own instance
 * via createRuntimeRunner() so runner state is not shared across concurrent requests.
 */
export class RuntimeRunner {
  private activeRunId: UUID | null = null;
  private stopped = false;
  private loopStartedAtMs: number | null = null;

  private readonly coordinator: RuntimeCoordinator;
  private readonly maxSteps: number;

  constructor(
    private readonly provider: RunnerProvider,
    options?: RuntimeRunnerOptions,
  ) {
    this.coordinator = options?.coordinator ?? createRuntimeCoordinator();
    this.maxSteps = options?.maxSteps ?? DEFAULT_MAX_RUNNER_STEPS;
  }

  start(context: RunnerStartContext): RunnerStatusView {
    validateRunnerStartContext(context);

    const now = context.startedAt ?? new Date().toISOString();
    this.coordinator.start(context);
    this.activeRunId = context.runId;
    this.stopped = false;
    this.loopStartedAtMs = Date.now();

    const record: RunnerRecord = {
      runId: context.runId,
      organizationId: context.organizationId,
      employeeId: context.employeeId,
      traceId: context.traceId,
      status: 'running',
      stepCount: 0,
      executedTasks: [],
      startedAt: now,
      updatedAt: now,
      stoppedAt: null,
      finished: false,
      finalStatus: 'running',
      durationMs: 0,
      stopReason: null,
    };

    this.provider.save(record);
    return this.status();
  }

  step(): RunnerStepResult {
    const record = this.requireMutableRecord();

    if (this.stopped) {
      throw new RunnerInvalidStateError('runner is stopped');
    }

    const result = this.coordinator.dispatch();
    const executedTasks = result.task
      ? [...record.executedTasks, result.task.id]
      : record.executedTasks;

    const updated = this.touch(record, {
      stepCount: record.stepCount + 1,
      executedTasks,
      finished: result.finished,
      finalStatus: result.status.status,
      status: mapCoordinatorToRunnerStatus(result.status.status, this.stopped),
      durationMs: Date.now() - (this.loopStartedAtMs ?? Date.now()),
      stopReason: result.finished ? 'completed' : null,
      stoppedAt: result.finished ? new Date().toISOString() : null,
    });

    this.provider.update(updated);

    return {
      status: updated.status,
      taskId: result.task?.id ?? null,
      finished: result.finished,
      stepCount: updated.stepCount,
    };
  }

  run(): RunnerRunResult {
    const record = this.requireMutableRecord();

    if (this.stopped) {
      throw new RunnerInvalidStateError('runner is stopped');
    }

    const startedAtMs = this.loopStartedAtMs ?? Date.now();
    const loopResult = executeRunnerLoop({
      maxSteps: this.maxSteps,
      startedAtMs,
      getStatus: () => this.coordinator.status(),
      dispatch: () => this.coordinator.dispatch(),
    });

    const updated = this.touch(record, {
      stepCount: record.stepCount + loopResult.steps,
      executedTasks: [...record.executedTasks, ...loopResult.executedTasks],
      finished: loopResult.finished,
      finalStatus: loopResult.finalStatus,
      status: mapCoordinatorToRunnerStatus(loopResult.finalStatus, this.stopped),
      durationMs: loopResult.duration,
      stopReason: loopResult.stopReason,
      stoppedAt: new Date().toISOString(),
    });

    this.provider.update(updated);

    return {
      finished: loopResult.finished,
      executedTasks: updated.executedTasks,
      duration: loopResult.duration,
      finalStatus: loopResult.finalStatus,
      steps: loopResult.steps,
      stopReason: loopResult.stopReason,
    };
  }

  stop(): RunnerStatusView {
    const record = this.requireRecord();
    this.stopped = true;

    const updated = this.touch(record, {
      status: 'stopped',
      stopReason: 'stopped',
      stoppedAt: new Date().toISOString(),
      durationMs: Date.now() - (this.loopStartedAtMs ?? Date.now()),
    });

    this.provider.update(updated);
    return this.status();
  }

  status(): RunnerStatusView {
    const record = this.requireRecord();

    return {
      status: record.status,
      runId: record.runId,
      stepCount: record.stepCount,
      executedTasks: [...record.executedTasks],
      finished: record.finished,
      finalStatus: record.finalStatus,
      durationMs: record.durationMs,
      stopReason: record.stopReason,
    };
  }

  serialize(): SerializedRunnerSnapshot {
    const record = this.requireRecord();
    const coordinator = this.coordinator.status();

    return serializeRunnerSnapshot(record, coordinator.status, coordinator.state);
  }

  reset(): void {
    this.activeRunId = null;
    this.stopped = false;
    this.loopStartedAtMs = null;
    this.provider.reset?.();
    this.coordinator.reset();
  }

  private requireRecord(): RunnerRecord {
    const runId = this.requireActiveRunId();
    const record = this.provider.get(runId);

    if (!record) {
      throw new RunnerNotStartedError();
    }

    return record;
  }

  private requireMutableRecord(): RunnerRecord {
    const record = this.requireRecord();

    if (record.finished && record.status === 'completed') {
      throw new RunnerInvalidStateError('runner is already completed');
    }

    if (this.stopped) {
      throw new RunnerInvalidStateError('runner is stopped');
    }

    return record;
  }

  private requireActiveRunId(): UUID {
    if (!this.activeRunId) {
      throw new RunnerNotStartedError();
    }

    return this.activeRunId;
  }

  private touch(record: RunnerRecord, patch: Partial<RunnerRecord>): RunnerRecord {
    return {
      ...record,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
  }
}

export function createRuntimeRunner(options?: RuntimeRunnerOptions): RuntimeRunner {
  const provider = options?.provider ?? mockRuntimeRunnerProvider;
  return new RuntimeRunner(provider, options);
}

/** Default dev/test singleton. Do not use for concurrent production runtime executions. */
export const runtimeRunner = createRuntimeRunner();

export { createMockRuntimeRunnerProvider, mockRuntimeRunnerProvider };
