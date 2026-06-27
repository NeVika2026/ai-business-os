import {
  createOrchestratorHub,
  type OrchestratorHub,
} from '@/services/runtime/orchestrator/hub/orchestrator-hub';
import type { HubRuntimeContext } from '@/services/runtime/orchestrator/hub/hub-types';
import type { RoadmapInput } from '@/services/runtime/orchestrator/roadmap/roadmap-types';
import {
  RoadmapSessionInvalidStateError,
  RoadmapSessionNotStartedError,
} from '@/services/runtime/orchestrator/session/roadmap-session-errors';
import {
  buildRoadmapSessionReport,
  findNextRunnableSprint,
  mapHubResultToSprintStatus,
} from '@/services/runtime/orchestrator/session/roadmap-session-report';
import {
  createMockRoadmapSessionProvider,
  mockRoadmapSessionProvider,
} from '@/services/runtime/orchestrator/session/providers/mock-roadmap-session-provider';
import type {
  RoadmapSessionNextResult,
  RoadmapSessionOptions,
  RoadmapSessionProvider,
  RoadmapSessionRecord,
  RoadmapSessionReport,
  RoadmapSessionRunResult,
  RoadmapSessionStartInput,
  RoadmapSessionStatusView,
  RoadmapSprintExecutionRecord,
} from '@/services/runtime/orchestrator/session/roadmap-session-types';
import { DEFAULT_MAX_SPRINTS_PER_RUN } from '@/services/runtime/orchestrator/session/roadmap-session-types';
import { validateRoadmapSessionStartInput } from '@/services/runtime/orchestrator/session/roadmap-session-validator';

function createInitialSprintRecords(roadmap: RoadmapInput): RoadmapSprintExecutionRecord[] {
  return roadmap.sprints.map((sprint) => ({
    sprintId: sprint.id,
    sprintCode: sprint.code,
    status: 'pending',
    result: null,
    startedAt: null,
    finishedAt: null,
  }));
}

/**
 * Multi-sprint roadmap session orchestrating sequential sprint execution via OrchestratorHub.
 */
export class RoadmapSession {
  private roadmap: RoadmapInput | null = null;
  private runtimeContext: HubRuntimeContext | null = null;
  private skipRuntime = false;

  constructor(
    private readonly provider: RoadmapSessionProvider,
    private readonly hub: OrchestratorHub,
    private readonly maxSprintsPerRun: number = DEFAULT_MAX_SPRINTS_PER_RUN,
  ) {}

  start(input: RoadmapSessionStartInput): RoadmapSessionStatusView {
    validateRoadmapSessionStartInput(input);

    const now = new Date().toISOString();
    this.roadmap = input.roadmap;
    this.runtimeContext = input.runtimeContext ?? null;
    this.skipRuntime = input.skipRuntime ?? false;

    const record: RoadmapSessionRecord = {
      roadmapId: input.roadmap.id,
      roadmapTitle: input.roadmap.title,
      status: 'running',
      currentSprintId: null,
      completedSprintIds: [],
      failedSprintIds: [],
      sprintRecords: createInitialSprintRecords(input.roadmap),
      pauseReason: null,
      stopReason: null,
      startedAt: now,
      updatedAt: now,
      finishedAt: null,
    };

    this.provider.save(record);
    return this.status();
  }

  runNextSprint(): RoadmapSessionNextResult {
    const record = this.requireMutableRecord();
    const roadmap = this.requireRoadmap();

    const nextSprint = findNextRunnableSprint(
      roadmap,
      record.completedSprintIds,
      record.failedSprintIds,
    );

    if (!nextSprint) {
      const allCompleted = record.completedSprintIds.length === roadmap.sprints.length;
      const updated = this.touch(record, {
        status: allCompleted ? 'completed' : 'failed',
        stopReason: allCompleted ? null : 'no_runnable_sprints',
        finishedAt: new Date().toISOString(),
      });

      this.provider.update(updated);

      return {
        executed: false,
        sprintId: null,
        sprintCode: null,
        sessionStatus: updated.status,
        stopped: true,
        reason: updated.stopReason,
        execution: null,
      };
    }

    const startedAt = new Date().toISOString();
    record.currentSprintId = nextSprint.id;

    const execution = this.hub.executeSprint({
      sprint: nextSprint,
      runtimeContext: this.runtimeContext,
      skipRuntime: this.skipRuntime,
    });

    const sprintStatus = mapHubResultToSprintStatus(execution);

    if (execution.paused) {
      const paused = this.applySprintResult(
        record,
        nextSprint.id,
        sprintStatus,
        execution,
        startedAt,
        {
          status: 'paused',
          pauseReason: execution.nextRecommendedAction ?? 'paused_at_commit_gate',
        },
      );

      return {
        executed: true,
        sprintId: nextSprint.id,
        sprintCode: nextSprint.code,
        sessionStatus: paused.status,
        stopped: true,
        reason: paused.pauseReason,
        execution,
      };
    }

    if (sprintStatus === 'completed') {
      const updated = this.applySprintResult(
        record,
        nextSprint.id,
        'completed',
        execution,
        startedAt,
        {
          completedSprintIds: [...record.completedSprintIds, nextSprint.id],
          status:
            record.completedSprintIds.length + 1 === roadmap.sprints.length
              ? 'completed'
              : 'running',
          finishedAt:
            record.completedSprintIds.length + 1 === roadmap.sprints.length
              ? new Date().toISOString()
              : null,
        },
      );

      return {
        executed: true,
        sprintId: nextSprint.id,
        sprintCode: nextSprint.code,
        sessionStatus: updated.status,
        stopped: updated.status !== 'running',
        reason: null,
        execution,
      };
    }

    const failed = this.applySprintResult(record, nextSprint.id, 'failed', execution, startedAt, {
      failedSprintIds: [...record.failedSprintIds, nextSprint.id],
      status: 'failed',
      stopReason: execution.stopReason ?? 'sprint_failed',
      finishedAt: new Date().toISOString(),
    });

    return {
      executed: true,
      sprintId: nextSprint.id,
      sprintCode: nextSprint.code,
      sessionStatus: failed.status,
      stopped: true,
      reason: failed.stopReason,
      execution,
    };
  }

  runAllUntilStop(): RoadmapSessionRunResult {
    this.requireMutableRecord();

    let sprintsExecuted = 0;
    let stopped = false;
    let reason: string | null = null;

    while (!stopped && sprintsExecuted < this.maxSprintsPerRun) {
      const result = this.runNextSprint();

      if (result.executed) {
        sprintsExecuted += 1;
      }

      if (result.stopped || result.sessionStatus !== 'running') {
        stopped = true;
        reason = result.reason;
        break;
      }
    }

    const record = this.requireRecord();

    if (!stopped && sprintsExecuted >= this.maxSprintsPerRun && record.status === 'running') {
      const updated = this.touch(record, {
        status: 'stopped',
        stopReason: 'max_sprints_per_run_exceeded',
        finishedAt: new Date().toISOString(),
      });

      this.provider.update(updated);
      stopped = true;
      reason = updated.stopReason;
    }

    const finalRecord = this.requireRecord();

    return {
      sprintsExecuted,
      sessionStatus: finalRecord.status,
      stopped,
      reason,
    };
  }

  pause(reason: string): RoadmapSessionStatusView {
    const record = this.requireMutableRecord();

    const updated = this.touch(record, {
      status: 'paused',
      pauseReason: reason.trim().length > 0 ? reason : 'paused_by_user',
    });

    this.provider.update(updated);
    return this.status();
  }

  resume(): RoadmapSessionStatusView {
    const record = this.requireRecord();

    if (record.status !== 'paused') {
      throw new RoadmapSessionInvalidStateError('session is not paused');
    }

    const updated = this.touch(record, {
      status: 'running',
      pauseReason: null,
    });

    this.provider.update(updated);
    return this.status();
  }

  stop(reason: string): RoadmapSessionStatusView {
    const record = this.requireRecord();

    const updated = this.touch(record, {
      status: 'stopped',
      stopReason: reason.trim().length > 0 ? reason : 'stopped_by_user',
      finishedAt: new Date().toISOString(),
    });

    this.provider.update(updated);
    return this.status();
  }

  status(): RoadmapSessionStatusView {
    const record = this.requireRecord();
    const roadmap = this.requireRoadmap();

    const pendingSprintCount = roadmap.sprints.filter(
      (sprint) =>
        !record.completedSprintIds.includes(sprint.id) &&
        !record.failedSprintIds.includes(sprint.id),
    ).length;

    return {
      status: record.status,
      roadmapId: record.roadmapId,
      roadmapTitle: record.roadmapTitle,
      currentSprintId: record.currentSprintId,
      completedSprintCount: record.completedSprintIds.length,
      failedSprintCount: record.failedSprintIds.length,
      pendingSprintCount,
      pauseReason: record.pauseReason,
      stopReason: record.stopReason,
    };
  }

  report(): RoadmapSessionReport {
    const record = this.requireRecord();
    return buildRoadmapSessionReport(record, this.requireRoadmap());
  }

  reset(): void {
    this.roadmap = null;
    this.runtimeContext = null;
    this.skipRuntime = false;
    this.provider.reset?.();
    this.hub.reset();
  }

  private applySprintResult(
    record: RoadmapSessionRecord,
    sprintId: string,
    sprintStatus: RoadmapSprintExecutionRecord['status'],
    execution: RoadmapSessionNextResult['execution'],
    startedAt: string,
    patch: Partial<RoadmapSessionRecord>,
  ): RoadmapSessionRecord {
    const sprintRecords = record.sprintRecords.map((sprint) =>
      sprint.sprintId === sprintId
        ? {
            ...sprint,
            status: sprintStatus,
            result: execution,
            startedAt,
            finishedAt: new Date().toISOString(),
          }
        : sprint,
    );

    const updated = this.touch(record, {
      ...patch,
      sprintRecords,
      currentSprintId: sprintId,
    });

    this.provider.update(updated);
    return updated;
  }

  private requireRoadmap(): RoadmapInput {
    if (!this.roadmap) {
      throw new RoadmapSessionNotStartedError();
    }

    return this.roadmap;
  }

  private requireRecord(): RoadmapSessionRecord {
    const roadmap = this.requireRoadmap();
    const record = this.provider.get(roadmap.id);

    if (!record) {
      throw new RoadmapSessionNotStartedError();
    }

    return record;
  }

  private requireMutableRecord(): RoadmapSessionRecord {
    const record = this.requireRecord();

    if (record.status === 'completed') {
      throw new RoadmapSessionInvalidStateError('session is already completed');
    }

    if (record.status === 'stopped') {
      throw new RoadmapSessionInvalidStateError('session is stopped');
    }

    if (record.status === 'failed') {
      throw new RoadmapSessionInvalidStateError('session has failed');
    }

    if (record.status === 'paused') {
      throw new RoadmapSessionInvalidStateError('session is paused — call resume() first');
    }

    return record;
  }

  private touch(
    record: RoadmapSessionRecord,
    patch: Partial<RoadmapSessionRecord>,
  ): RoadmapSessionRecord {
    return {
      ...record,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
  }
}

export function createRoadmapSession(options?: RoadmapSessionOptions): RoadmapSession {
  const provider = options?.provider ?? mockRoadmapSessionProvider;
  const hub = options?.hub ?? createOrchestratorHub({ skipRuntime: options?.skipRuntime });
  const maxSprintsPerRun = options?.maxSprintsPerRun ?? DEFAULT_MAX_SPRINTS_PER_RUN;

  return new RoadmapSession(provider, hub, maxSprintsPerRun);
}

/** Default dev/test singleton. Do not use for concurrent production roadmap runs. */
export const roadmapSession = createRoadmapSession();

export { createMockRoadmapSessionProvider, mockRoadmapSessionProvider };
