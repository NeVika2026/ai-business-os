import {
  RuntimeStateNotActiveError,
  RuntimeStateNotFoundError,
} from '@/services/runtime/orchestrator/state/runtime-state-errors';
import { serializeRuntimeStateSnapshot } from '@/services/runtime/orchestrator/state/runtime-state-serializer';
import { assertValidTransition } from '@/services/runtime/orchestrator/state/runtime-state-transitions';
import {
  validateCreateContext,
  validateRuntimeState,
} from '@/services/runtime/orchestrator/state/runtime-state-validator';
import type {
  RuntimeStateCreateContext,
  RuntimeStateHistory,
  RuntimeStateMachineOptions,
  RuntimeStateProvider,
  RuntimeStateRecord,
  RuntimeStateTransitionRecord,
  SerializedRuntimeStateSnapshot,
} from '@/services/runtime/orchestrator/state/runtime-state-types';
import {
  createMockRuntimeStateProvider,
  mockRuntimeStateProvider,
} from '@/services/runtime/orchestrator/state/providers/mock-runtime-state-provider';
import type { UUID } from '@/types/runtime/dto';

/**
 * Per-execution runtime state machine. Each runtime run should create its own instance
 * via createRuntimeStateMachine() so state is not shared across concurrent requests.
 */
export class RuntimeStateMachine {
  private activeRunId: UUID | null = null;

  constructor(private readonly provider: RuntimeStateProvider) {}

  create(context: RuntimeStateCreateContext): RuntimeStateRecord {
    validateCreateContext(context);

    const now = context.createdAt ?? new Date().toISOString();
    const record: RuntimeStateRecord = {
      id: context.runId,
      state: 'created',
      organizationId: context.organizationId,
      employeeId: context.employeeId,
      runId: context.runId,
      traceId: context.traceId,
      createdAt: now,
      updatedAt: now,
    };

    this.provider.save(record);
    this.activeRunId = context.runId;
    return record;
  }

  current(): RuntimeStateRecord {
    const runId = this.requireActiveRunId();
    const record = this.provider.get(runId);

    if (!record) {
      throw new RuntimeStateNotFoundError(runId);
    }

    return record;
  }

  transition(nextState: RuntimeStateRecord['state']): RuntimeStateRecord {
    validateRuntimeState(nextState);

    const current = this.current();
    assertValidTransition(current.state, nextState);

    const transitionAt = new Date().toISOString();
    const transition: RuntimeStateTransitionRecord = {
      from: current.state,
      to: nextState,
      transitionAt,
    };

    const updated: RuntimeStateRecord = {
      ...current,
      state: nextState,
      updatedAt: transitionAt,
    };

    this.provider.update(updated);
    this.provider.appendHistory(current.runId, transition);
    return updated;
  }

  history(): RuntimeStateHistory {
    const runId = this.requireActiveRunId();

    return {
      runId,
      transitions: this.provider.history(runId),
    };
  }

  serialize(): SerializedRuntimeStateSnapshot {
    const current = this.current();

    return serializeRuntimeStateSnapshot(current, this.history());
  }

  isActive(): boolean {
    return this.activeRunId !== null;
  }

  getActiveRunId(): UUID | null {
    return this.activeRunId;
  }

  reset(): void {
    this.activeRunId = null;
  }

  private requireActiveRunId(): UUID {
    if (!this.activeRunId) {
      throw new RuntimeStateNotActiveError();
    }

    return this.activeRunId;
  }
}

export function createRuntimeStateMachine(
  options?: RuntimeStateMachineOptions,
): RuntimeStateMachine {
  const provider = options?.provider ?? mockRuntimeStateProvider;
  return new RuntimeStateMachine(provider);
}

/** Default dev/test singleton. Do not use for concurrent production runtime executions. */
export const runtimeStateMachine = createRuntimeStateMachine();

export { createMockRuntimeStateProvider, mockRuntimeStateProvider };
