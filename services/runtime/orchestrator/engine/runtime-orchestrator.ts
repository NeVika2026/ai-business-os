import {
  OrchestratorInvalidStateError,
  OrchestratorNotFoundError,
  OrchestratorNotStartedError,
} from '@/services/runtime/orchestrator/engine/runtime-orchestrator-errors';
import {
  getPlannedOrderIds,
  planExecutionOrder,
} from '@/services/runtime/orchestrator/engine/runtime-orchestrator-planner';
import { serializeOrchestratorRuntime } from '@/services/runtime/orchestrator/engine/runtime-orchestrator-serializer';
import {
  validateOrchestratorError,
  validateStartContext,
  validateTasks,
} from '@/services/runtime/orchestrator/engine/runtime-orchestrator-validator';
import type {
  OrchestratorError,
  OrchestratorNextResult,
  OrchestratorOptions,
  OrchestratorProvider,
  OrchestratorRuntime,
  OrchestratorStartContext,
  OrchestratorTask,
  SerializedOrchestratorRuntime,
} from '@/services/runtime/orchestrator/engine/runtime-orchestrator-types';
import {
  createMockRuntimeOrchestratorProvider,
  mockRuntimeOrchestratorProvider,
} from '@/services/runtime/orchestrator/engine/providers/mock-runtime-orchestrator-provider';
import type { UUID } from '@/types/runtime/dto';

/**
 * Per-execution orchestrator. Each runtime run should create its own instance
 * via createRuntimeOrchestrator() so orchestration state is not shared across concurrent requests.
 */
export class RuntimeOrchestrator {
  private activeRunId: UUID | null = null;

  constructor(private readonly provider: OrchestratorProvider) {}

  start(context: OrchestratorStartContext): OrchestratorRuntime {
    validateStartContext(context);

    const now = context.startedAt ?? new Date().toISOString();
    const runtime: OrchestratorRuntime = {
      id: context.runId,
      organizationId: context.organizationId,
      employeeId: context.employeeId,
      runId: context.runId,
      traceId: context.traceId,
      status: 'running',
      currentTaskId: null,
      pendingTasks: [],
      completedTaskIds: [],
      failedTaskIds: [],
      plannedOrder: [],
      paused: false,
      pauseReason: null,
      cancelled: false,
      cancelReason: null,
      result: null,
      error: null,
      createdAt: now,
      updatedAt: now,
    };

    this.provider.save(runtime);
    this.activeRunId = context.runId;
    return runtime;
  }

  plan(tasks: OrchestratorTask[]): OrchestratorRuntime {
    const runtime = this.requireMutableRuntime();

    validateTasks(tasks);
    const ordered = planExecutionOrder(tasks);
    const updated = this.touch(runtime, {
      pendingTasks: ordered,
      plannedOrder: getPlannedOrderIds(tasks),
      currentTaskId: null,
      status: 'running',
    });

    this.provider.update(updated);
    return updated;
  }

  next(): OrchestratorNextResult {
    const runtime = this.requireMutableRuntime();

    if (runtime.paused) {
      throw new OrchestratorInvalidStateError('cannot advance while orchestrator is paused');
    }

    if (runtime.pendingTasks.length === 0) {
      const updated = this.touch(runtime, {
        currentTaskId: null,
      });
      this.provider.update(updated);

      return {
        runtime: updated,
        task: null,
        finished: true,
      };
    }

    const [nextTask, ...remaining] = runtime.pendingTasks;
    const completedTaskIds = runtime.currentTaskId
      ? [...runtime.completedTaskIds, runtime.currentTaskId]
      : runtime.completedTaskIds;

    const updated = this.touch(runtime, {
      currentTaskId: nextTask.id,
      pendingTasks: remaining,
      completedTaskIds,
      status: 'running',
    });

    this.provider.update(updated);

    return {
      runtime: updated,
      task: nextTask,
      finished: false,
    };
  }

  pause(reason: string): OrchestratorRuntime {
    const runtime = this.requireMutableRuntime();

    const updated = this.touch(runtime, {
      paused: true,
      pauseReason: reason,
      status: 'paused',
    });

    this.provider.update(updated);
    return updated;
  }

  resume(): OrchestratorRuntime {
    const runtime = this.requireMutableRuntime();

    if (!runtime.paused) {
      throw new OrchestratorInvalidStateError('orchestrator is not paused');
    }

    const updated = this.touch(runtime, {
      paused: false,
      pauseReason: null,
      status: 'running',
    });

    this.provider.update(updated);
    return updated;
  }

  cancel(reason: string): OrchestratorRuntime {
    const runtime = this.requireMutableRuntime();

    const updated = this.touch(runtime, {
      cancelled: true,
      cancelReason: reason,
      paused: false,
      pauseReason: null,
      status: 'cancelled',
      currentTaskId: null,
      pendingTasks: [],
    });

    this.provider.update(updated);
    return updated;
  }

  complete(result: Record<string, unknown>): OrchestratorRuntime {
    const runtime = this.requireMutableRuntime();

    const completedTaskIds = runtime.currentTaskId
      ? [...runtime.completedTaskIds, runtime.currentTaskId]
      : runtime.completedTaskIds;

    const updated = this.touch(runtime, {
      status: 'completed',
      currentTaskId: null,
      pendingTasks: [],
      completedTaskIds,
      result,
      error: null,
      paused: false,
      pauseReason: null,
    });

    this.provider.update(updated);
    return updated;
  }

  fail(error: OrchestratorError): OrchestratorRuntime {
    validateOrchestratorError(error);

    const runtime = this.requireMutableRuntime();

    const failedTaskIds = runtime.currentTaskId
      ? [...runtime.failedTaskIds, runtime.currentTaskId]
      : runtime.failedTaskIds;

    const updated = this.touch(runtime, {
      status: 'failed',
      currentTaskId: null,
      pendingTasks: [],
      failedTaskIds,
      error,
      paused: false,
      pauseReason: null,
    });

    this.provider.update(updated);
    return updated;
  }

  current(): OrchestratorRuntime {
    return this.requireRuntime();
  }

  serialize(): SerializedOrchestratorRuntime {
    return serializeOrchestratorRuntime(this.current());
  }

  isActive(): boolean {
    return this.activeRunId !== null;
  }

  reset(): void {
    this.activeRunId = null;
  }

  private requireRuntime(): OrchestratorRuntime {
    const runId = this.requireActiveRunId();
    const runtime = this.provider.get(runId);

    if (!runtime) {
      throw new OrchestratorNotFoundError(runId);
    }

    return runtime;
  }

  private requireMutableRuntime(): OrchestratorRuntime {
    const runtime = this.requireRuntime();

    if (runtime.cancelled || runtime.status === 'cancelled') {
      throw new OrchestratorInvalidStateError('orchestrator is cancelled');
    }

    if (runtime.status === 'completed') {
      throw new OrchestratorInvalidStateError('orchestrator is already completed');
    }

    if (runtime.status === 'failed') {
      throw new OrchestratorInvalidStateError('orchestrator has failed');
    }

    return runtime;
  }

  private requireActiveRunId(): UUID {
    if (!this.activeRunId) {
      throw new OrchestratorNotStartedError();
    }

    return this.activeRunId;
  }

  private touch(
    runtime: OrchestratorRuntime,
    patch: Partial<OrchestratorRuntime>,
  ): OrchestratorRuntime {
    return {
      ...runtime,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
  }
}

export function createRuntimeOrchestrator(options?: OrchestratorOptions): RuntimeOrchestrator {
  const provider = options?.provider ?? mockRuntimeOrchestratorProvider;
  return new RuntimeOrchestrator(provider);
}

/** Default dev/test singleton. Do not use for concurrent production runtime executions. */
export const runtimeOrchestrator = createRuntimeOrchestrator();

export { createMockRuntimeOrchestratorProvider, mockRuntimeOrchestratorProvider };
