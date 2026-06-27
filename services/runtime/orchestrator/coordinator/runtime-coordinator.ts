import {
  CoordinatorInvalidStateError,
  CoordinatorNotFoundError,
  CoordinatorNotStartedError,
} from '@/services/runtime/orchestrator/coordinator/runtime-coordinator-errors';
import {
  assertCanDispatch,
  shouldEnterWaitingState,
} from '@/services/runtime/orchestrator/coordinator/runtime-coordinator-scheduler';
import {
  mapOrchestratorStatusToCoordinator,
  serializeCoordinatorSnapshot,
} from '@/services/runtime/orchestrator/coordinator/runtime-coordinator-serializer';
import {
  getDefaultCoordinatorTasks,
  validateCoordinatorStartContext,
  validateReason,
} from '@/services/runtime/orchestrator/coordinator/runtime-coordinator-validator';
import type {
  CoordinatorDispatchResult,
  CoordinatorProvider,
  CoordinatorRecord,
  CoordinatorStartContext,
  CoordinatorStatusView,
  RuntimeCoordinatorOptions,
  SerializedCoordinatorSnapshot,
} from '@/services/runtime/orchestrator/coordinator/runtime-coordinator-types';
import {
  createMockRuntimeCoordinatorProvider,
  mockRuntimeCoordinatorProvider,
} from '@/services/runtime/orchestrator/coordinator/providers/mock-runtime-coordinator-provider';
import { createRuntimeOrchestrator } from '@/services/runtime/orchestrator/engine/runtime-orchestrator';
import type { RuntimeOrchestrator } from '@/services/runtime/orchestrator/engine/runtime-orchestrator';
import { createMockRuntimeOrchestratorProvider } from '@/services/runtime/orchestrator/engine/providers/mock-runtime-orchestrator-provider';
import { createRuntimeEventBus } from '@/services/runtime/orchestrator/events/runtime-event-bus';
import type { RuntimeEventBus } from '@/services/runtime/orchestrator/events/runtime-event-bus';
import { createMockRuntimeEventProvider } from '@/services/runtime/orchestrator/events/providers/mock-runtime-event-provider';
import { createRuntimeStateMachine } from '@/services/runtime/orchestrator/state/runtime-state-machine';
import type { RuntimeStateMachine } from '@/services/runtime/orchestrator/state/runtime-state-machine';
import { createMockRuntimeStateProvider } from '@/services/runtime/orchestrator/state/providers/mock-runtime-state-provider';
import type { UUID } from '@/types/runtime/dto';

/**
 * Per-execution runtime coordinator wiring state machine, orchestrator, and event bus.
 */
export class RuntimeCoordinator {
  private activeRunId: UUID | null = null;

  private readonly stateMachine: RuntimeStateMachine;
  private readonly orchestrator: RuntimeOrchestrator;
  private readonly eventBus: RuntimeEventBus;

  constructor(
    private readonly provider: CoordinatorProvider,
    options?: RuntimeCoordinatorOptions,
  ) {
    this.stateMachine = createRuntimeStateMachine({
      provider: options?.stateProvider ?? createMockRuntimeStateProvider(),
    });
    this.orchestrator = createRuntimeOrchestrator({
      provider: options?.orchestratorProvider ?? createMockRuntimeOrchestratorProvider(),
    });
    this.eventBus = createRuntimeEventBus({
      provider: options?.eventProvider ?? createMockRuntimeEventProvider(),
    });
  }

  start(context: CoordinatorStartContext): CoordinatorStatusView {
    validateCoordinatorStartContext(context);

    const tasks = context.tasks ?? getDefaultCoordinatorTasks();
    const now = context.startedAt ?? new Date().toISOString();
    const spanId = context.spanId ?? null;

    this.stateMachine.create({
      organizationId: context.organizationId,
      employeeId: context.employeeId,
      runId: context.runId,
      traceId: context.traceId,
      createdAt: now,
    });
    this.stateMachine.transition('initializing');
    this.stateMachine.transition('planning');

    this.orchestrator.start({
      organizationId: context.organizationId,
      employeeId: context.employeeId,
      runId: context.runId,
      traceId: context.traceId,
      startedAt: now,
    });
    this.orchestrator.plan(tasks);

    const record: CoordinatorRecord = {
      runId: context.runId,
      organizationId: context.organizationId,
      employeeId: context.employeeId,
      traceId: context.traceId,
      spanId,
      status: 'running',
      taskCatalog: tasks,
      createdAt: now,
      updatedAt: now,
    };

    this.provider.save(record);
    this.activeRunId = context.runId;

    this.publishEvent('runtime.coordinator.started', record, {
      taskCount: tasks.length,
      plannedOrder: this.orchestrator.current().plannedOrder,
    });

    return this.status();
  }

  dispatch(): CoordinatorDispatchResult {
    const record = this.requireMutableRecord();
    const runtime = this.orchestrator.current();

    assertCanDispatch(record.status, runtime.paused);

    let state = this.stateMachine.current().state;

    if (state === 'planning' || state === 'waiting') {
      state = this.stateMachine.transition('executing').state;
    }

    if (state !== 'executing') {
      throw new CoordinatorInvalidStateError(`dispatch is not allowed from state ${state}`);
    }

    const result = this.orchestrator.next();

    if (result.task) {
      this.publishEvent('runtime.task.dispatched', record, {
        taskId: result.task.id,
        taskType: result.task.type,
      });

      if (shouldEnterWaitingState(result.runtime.pendingTasks.length)) {
        this.stateMachine.transition('waiting');
      }

      const updated = this.touch(record, { status: 'running' });
      this.provider.update(updated);

      return {
        status: this.status(),
        task: result.task,
        finished: false,
      };
    }

    this.orchestrator.complete({
      tasksCompleted: result.runtime.completedTaskIds.length,
      plannedOrder: result.runtime.plannedOrder,
    });
    this.stateMachine.transition('completed');

    const completed = this.touch(record, { status: 'completed' });
    this.provider.update(completed);

    this.publishEvent('runtime.coordinator.completed', completed, {
      tasksCompleted: result.runtime.completedTaskIds,
    });

    return {
      status: this.status(),
      task: null,
      finished: true,
    };
  }

  pause(reason: string): CoordinatorStatusView {
    validateReason(reason, 'pause reason');

    const record = this.requireMutableRecord();
    this.orchestrator.pause(reason);

    const updated = this.touch(record, { status: 'paused' });
    this.provider.update(updated);

    this.publishEvent('runtime.coordinator.paused', updated, { reason });

    return this.status();
  }

  resume(): CoordinatorStatusView {
    const record = this.requireMutableRecord();

    if (record.status !== 'paused') {
      throw new CoordinatorInvalidStateError('coordinator is not paused');
    }

    this.orchestrator.resume();

    const updated = this.touch(record, { status: 'running' });
    this.provider.update(updated);

    this.publishEvent('runtime.coordinator.resumed', updated, {});

    return this.status();
  }

  cancel(reason: string): CoordinatorStatusView {
    validateReason(reason, 'cancel reason');

    const record = this.requireMutableRecord();
    this.orchestrator.cancel(reason);

    const currentState = this.stateMachine.current().state;

    if (currentState !== 'completed' && currentState !== 'failed' && currentState !== 'cancelled') {
      this.stateMachine.transition('cancelled');
    }

    const updated = this.touch(record, { status: 'cancelled' });
    this.provider.update(updated);

    this.publishEvent('runtime.coordinator.cancelled', updated, { reason });

    return this.status();
  }

  status(): CoordinatorStatusView {
    const record = this.requireRecord();
    const runtime = this.orchestrator.current();
    const state = this.stateMachine.current();

    return {
      status: mapOrchestratorStatusToCoordinator(runtime.status, record.status),
      state: state.state,
      runId: record.runId,
      traceId: record.traceId,
      currentTaskId: runtime.currentTaskId,
      queueLength: runtime.pendingTasks.length,
      completedTaskIds: [...runtime.completedTaskIds],
      paused: runtime.paused,
      cancelled: runtime.cancelled,
    };
  }

  serialize(): SerializedCoordinatorSnapshot {
    const record = this.requireRecord();
    const runtime = this.orchestrator.current();
    const state = this.stateMachine.current().state;

    return serializeCoordinatorSnapshot(record, runtime, state);
  }

  reset(): void {
    this.activeRunId = null;
    this.provider.reset?.();
    this.stateMachine.reset();
    this.orchestrator.reset();
    this.eventBus.clear();
  }

  private publishEvent(
    type: string,
    record: CoordinatorRecord,
    payload: Record<string, unknown>,
  ): void {
    this.eventBus.publish({
      type,
      organizationId: record.organizationId,
      employeeId: record.employeeId,
      traceId: record.traceId,
      runId: record.runId,
      spanId: record.spanId,
      source: 'runtime-coordinator',
      payload,
      metadata: {
        coordinatorStatus: record.status,
      },
    });
  }

  private requireRecord(): CoordinatorRecord {
    const runId = this.requireActiveRunId();
    const record = this.provider.get(runId);

    if (!record) {
      throw new CoordinatorNotFoundError(runId);
    }

    return record;
  }

  private requireMutableRecord(): CoordinatorRecord {
    const record = this.requireRecord();

    if (
      record.status === 'cancelled' ||
      record.status === 'completed' ||
      record.status === 'failed'
    ) {
      throw new CoordinatorInvalidStateError(`coordinator is ${record.status}`);
    }

    return record;
  }

  private requireActiveRunId(): UUID {
    if (!this.activeRunId) {
      throw new CoordinatorNotStartedError();
    }

    return this.activeRunId;
  }

  private touch(record: CoordinatorRecord, patch: Partial<CoordinatorRecord>): CoordinatorRecord {
    return {
      ...record,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
  }
}

export function createRuntimeCoordinator(options?: RuntimeCoordinatorOptions): RuntimeCoordinator {
  const provider = options?.provider ?? mockRuntimeCoordinatorProvider;
  return new RuntimeCoordinator(provider, options);
}

/** Default dev/test singleton. Do not use for concurrent production runtime executions. */
export const runtimeCoordinator = createRuntimeCoordinator();

export { createMockRuntimeCoordinatorProvider, mockRuntimeCoordinatorProvider };
