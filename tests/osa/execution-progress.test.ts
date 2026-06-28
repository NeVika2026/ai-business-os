import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildExecutionProgress,
  buildExecutionProgressSnapshot,
  formatExecutionProgressBar,
  parseExecutionProgress,
  serializeExecutionProgress,
  updateExecutionProgress,
} from '@/utils/osa/execution-progress';
import { buildOsaProgressUpdatedEvent } from '@/utils/osa/osa-run-persistence';
import { getOsaExecutionProgressFromEvents, getOsaProgressSnapshots } from '@/utils/osa/osa-runs';
import {
  completeRuntimeTask,
  createExecutionCoordinatorFromSubmit,
  prepareRuntimeCallsForReadyTasks,
  runTeamRuntimeExecution,
  startExecution,
} from '@/utils/osa/team-runtime';
import { buildExecutionGraph } from '@/utils/osa/team-execution';
import { prepareOsaTaskSubmitInput } from '@/utils/osa/osa-task';
import type { OrchestratorEvent } from '@/types/orchestrator';

const SAMPLE_INPUT = {
  userPrompt: 'Подготовь план на неделю',
  selectedAgents: [
    { id: 'business-manager', name: 'AI Business Manager' },
    { id: 'estate', name: 'AI Estate' },
    { id: 'crm', name: 'AI CRM' },
    { id: 'analyst', name: 'AI Analyst' },
  ],
  businessDescription: 'Я инвест-брокер',
};

const BASE_CONTEXT = {
  runId: 'run-progress-001',
  sessionId: 'session-progress-001',
  organizationId: '11111111-1111-1111-1111-111111111111',
  aiEmployeeId: 'osa000001-0000-4000-8000-000000000001',
  userId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  runtimeBridgeEnabled: false,
};

function createSampleCoordinator() {
  const prepared = prepareOsaTaskSubmitInput(SAMPLE_INPUT);
  const graph = buildExecutionGraph({
    plan: prepared.executionPlan,
    graphId: 'graph-progress-sample',
  });

  return createExecutionCoordinatorFromSubmit(prepared, graph, 'session-progress-sample');
}

describe('OSA execution progress', () => {
  it('creates initial progress from an idle session', () => {
    const coordinator = createSampleCoordinator();
    const progress = buildExecutionProgress(coordinator.session, '2026-06-28T10:00:00.000Z');

    assert.equal(progress.progress, coordinator.session.progress);
    assert.equal(progress.completedTasks.length, 0);
    assert.equal(progress.runningTasks.length, 0);
    assert.equal(progress.lastUpdate, '2026-06-28T10:00:00.000Z');
  });

  it('updates progress after a task completes', () => {
    let coordinator = startExecution(createSampleCoordinator());
    const { coordinator: prepared, calls } = prepareRuntimeCallsForReadyTasks(coordinator, {
      sessionId: 'session-progress-sample',
      runId: 'run-progress-001',
    });

    coordinator = prepared;
    assert.ok(calls.length > 0);

    const initial = buildExecutionProgress(coordinator.session);
    assert.ok(initial.runningTasks.length > 0);

    coordinator = completeRuntimeTask(coordinator, calls[0]!.taskId, {
      summary: 'Done',
      output: 'Output',
    });

    const updated = updateExecutionProgress(
      initial,
      coordinator.session,
      '2026-06-28T10:01:00.000Z',
    );

    assert.ok(updated.completedTasks.length > initial.completedTasks.length);
    assert.ok(updated.progress >= initial.progress);
    assert.equal(updated.lastUpdate, '2026-06-28T10:01:00.000Z');
  });

  it('estimates live ETA from remaining tasks', async () => {
    const coordinator = await runTeamRuntimeExecution(
      createSampleCoordinator(),
      { sessionId: 'session-progress-sample', runId: 'run-progress-001' },
      async (call) => ({
        summary: `Done ${call.taskId}`,
        output: `Output ${call.taskId}`,
      }),
    );

    const progress = buildExecutionProgress(coordinator.session);

    assert.equal(progress.progress, 100);
    assert.equal(progress.eta, 0);
    assert.ok(progress.completedTasks.length > 0);
  });

  it('creates progress snapshots and serializes payload fields', () => {
    const progress = buildExecutionProgress(createSampleCoordinator().session);
    const snapshot = buildExecutionProgressSnapshot(progress, {
      id: 'snapshot-1',
      runId: 'run-progress-001',
      createdAt: '2026-06-28T10:02:00.000Z',
    });
    const serialized = serializeExecutionProgress(progress);

    assert.equal(snapshot.id, 'snapshot-1');
    assert.equal(snapshot.runId, 'run-progress-001');
    assert.equal(serialized.progress, progress.progress);
    assert.deepEqual(serialized.completedTasks, progress.completedTasks);
    assert.equal(serialized.currentAgent, progress.currentAgent);
  });

  it('builds osa_progress_updated event payload', () => {
    const progress = buildExecutionProgress(createSampleCoordinator().session);
    const event = buildOsaProgressUpdatedEvent(BASE_CONTEXT, progress);

    assert.equal(event.type, 'osa_progress_updated');
    assert.equal(event.source, 'osa');
    assert.equal(event.payload.progress, progress.progress);
    assert.ok(Array.isArray(event.payload.completedTasks));
    assert.equal(event.payload.currentStage, progress.currentStage);
  });

  it('parses progress snapshots from history events', () => {
    const progress = buildExecutionProgress(createSampleCoordinator().session);
    const payload = serializeExecutionProgress(progress);

    const events: OrchestratorEvent[] = [
      {
        id: 'event-progress-1',
        organization_id: BASE_CONTEXT.organizationId,
        type: 'osa_progress_updated',
        source: 'osa',
        actor_type: 'system',
        actor_id: null,
        payload,
        correlation_id: BASE_CONTEXT.runId,
        created_at: '2026-06-28T10:03:00.000Z',
      },
    ];

    const latest = getOsaExecutionProgressFromEvents(events);
    const snapshots = getOsaProgressSnapshots(events);

    assert.ok(latest);
    assert.equal(latest?.progress, progress.progress);
    assert.equal(snapshots.length, 1);
    assert.equal(snapshots[0]?.id, 'event-progress-1');
  });

  it('handles empty execution graph progress', () => {
    const progress = buildExecutionProgress({
      ...createSampleCoordinator().session,
      completedTasks: [],
      runningTasks: [],
      failedTasks: [],
      blockedTasks: [],
      progress: 0,
      eta: 0,
    });

    assert.equal(progress.progress, 0);
    assert.equal(formatExecutionProgressBar(progress.progress), '░░░░░░░░░░ 0%');
  });

  it('handles completed execution progress', async () => {
    const coordinator = await runTeamRuntimeExecution(
      startExecution(createSampleCoordinator()),
      { sessionId: 'session-progress-sample', runId: 'run-progress-001' },
      async (call) => ({
        summary: `Done ${call.taskId}`,
        output: `Output ${call.taskId}`,
      }),
    );

    const progress = buildExecutionProgress(coordinator.session);
    const parsed = parseExecutionProgress(serializeExecutionProgress(progress));

    assert.equal(progress.progress, 100);
    assert.ok(parsed);
    assert.equal(parsed?.failedTasks.length, 0);
  });
});
