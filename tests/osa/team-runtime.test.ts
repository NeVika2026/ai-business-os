import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  cancelExecution,
  completeRuntimeTask,
  createExecutionCoordinatorFromSubmit,
  createExecutionSession,
  estimateRemainingTime,
  failRuntimeTask,
  getNextReadyTasks,
  isTeamExecutionComplete,
  pauseExecution,
  prepareRuntimeCall,
  prepareRuntimeCallsForReadyTasks,
  resumeExecution,
  serializeExecutionSession,
  startExecution,
  type ExecutionCoordinator,
} from '@/utils/osa/team-runtime';
import { buildExecutionGraph } from '@/utils/osa/team-execution';
import { prepareOsaTaskSubmitInput } from '@/utils/osa/osa-task';

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

function createSampleCoordinator(): ExecutionCoordinator {
  const prepared = prepareOsaTaskSubmitInput(SAMPLE_INPUT);
  const graph = buildExecutionGraph({
    plan: prepared.executionPlan,
    graphId: 'graph-runtime-sample',
  });

  return createExecutionCoordinatorFromSubmit(prepared, graph, 'session-runtime-sample');
}

describe('OSA team runtime coordinator', () => {
  it('creates an execution session with graph and plan context', () => {
    const prepared = prepareOsaTaskSubmitInput(SAMPLE_INPUT);
    const graph = buildExecutionGraph({ plan: prepared.executionPlan, graphId: 'graph-create' });
    const coordinator = createExecutionSession({
      sessionId: 'session-create',
      executionPlan: prepared.executionPlan,
      executionGraph: graph,
      businessContext: prepared.businessDescription,
      userGoal: prepared.userPrompt,
      selectedAgents: prepared.selectedAgents,
    });

    assert.equal(coordinator.session.id, 'session-create');
    assert.equal(coordinator.session.state, 'idle');
    assert.ok(coordinator.session.graph.totalTasks > 0);
    assert.equal(coordinator.session.userGoal, SAMPLE_INPUT.userPrompt);
  });

  it('starts execution and returns ready tasks for the first stage', () => {
    const started = startExecution(createSampleCoordinator());
    const ready = getNextReadyTasks(started);

    assert.equal(started.session.state, 'running');
    assert.ok(ready.length > 0);
    assert.ok(ready.every((task) => task.stageId === started.session.currentStage));
  });

  it('prepares runtime payload with task, stage, plan, graph, and previous results', () => {
    const started = startExecution(createSampleCoordinator());
    const readyTask = getNextReadyTasks(started)[0]!;

    const prepared = prepareRuntimeCall(started, readyTask.id, {
      sessionId: 'session-runtime-sample',
      runId: 'run-001',
    });

    assert.equal(prepared.taskId, readyTask.id);
    assert.ok(prepared.payload.task);
    assert.ok(prepared.payload.stage);
    assert.ok(prepared.payload.executionGraph);
    assert.ok(prepared.payload.executionPlan);
    assert.ok(prepared.payload.assignedAgent);
    assert.equal(prepared.payload.businessContext, SAMPLE_INPUT.businessDescription);
    assert.equal(prepared.payload.userGoal, SAMPLE_INPUT.userPrompt);
    assert.ok(prepared.payload.previousResults);
  });

  it('executes sequential stages by completing tasks and unlocking dependents', () => {
    let coordinator = startExecution(createSampleCoordinator());

    while (!isTeamExecutionComplete(coordinator)) {
      const { coordinator: prepared, calls } = prepareRuntimeCallsForReadyTasks(coordinator, {
        sessionId: 'session-runtime-sample',
        runId: 'run-001',
      });

      coordinator = prepared;

      if (calls.length === 0) {
        break;
      }

      for (const call of calls) {
        coordinator = completeRuntimeTask(coordinator, call.taskId, {
          summary: `Done ${call.taskId}`,
          output: `Output ${call.taskId}`,
        });
      }
    }

    assert.equal(coordinator.session.state, 'completed');
    assert.equal(coordinator.session.completedTasks.length, coordinator.session.graph.totalTasks);
    assert.equal(coordinator.session.progress, 100);
  });

  it('supports parallel ready tasks in the same stage snapshot', () => {
    let coordinator = startExecution(createSampleCoordinator());
    const { coordinator: prepared, calls } = prepareRuntimeCallsForReadyTasks(coordinator, {
      sessionId: 'session-runtime-sample',
      runId: 'run-parallel',
    });

    coordinator = prepared;

    if (calls.length > 1) {
      const snapshotIds = new Set(calls.map((call) => call.snapshotId));
      assert.equal(snapshotIds.size, 1);
    }

    assert.ok(calls.length >= 1);
  });

  it('propagates dependency results into subsequent runtime payloads', () => {
    let coordinator = startExecution(createSampleCoordinator());
    const firstCall = prepareRuntimeCallsForReadyTasks(coordinator, {
      sessionId: 'session-runtime-sample',
      runId: 'run-deps',
    });

    coordinator = firstCall.coordinator;
    const firstTaskId = firstCall.calls[0]?.taskId;
    assert.ok(firstTaskId);

    coordinator = completeRuntimeTask(coordinator, firstTaskId, {
      summary: 'First task done',
      output: 'First output',
    });

    const nextReady = getNextReadyTasks(coordinator);
    if (nextReady.length === 0) {
      return;
    }

    const nextTask = nextReady.find((task) => task.dependsOn.includes(firstTaskId));

    if (nextTask) {
      const payload = prepareRuntimeCall(coordinator, nextTask.id, {
        sessionId: 'session-runtime-sample',
        runId: 'run-deps',
      });

      const previousResults = payload.payload.previousResults as Record<string, unknown>;
      assert.ok(previousResults[firstTaskId]);
    }
  });

  it('propagates failure to blocked downstream tasks', () => {
    const started = startExecution(createSampleCoordinator());
    const firstTask = getNextReadyTasks(started)[0]!;

    const failed = failRuntimeTask(started, firstTask.id, 'Runtime unavailable');

    assert.equal(failed.session.state, 'failed');
    assert.ok(failed.session.failedTasks.includes(firstTask.id));
    assert.ok(failed.session.blockedTasks.length > 0);
  });

  it('supports pause and resume without losing ready tasks', () => {
    const started = startExecution(createSampleCoordinator());
    const paused = pauseExecution(started);
    const resumed = resumeExecution(paused);

    assert.equal(paused.session.state, 'paused');
    assert.equal(getNextReadyTasks(paused).length, 0);
    assert.equal(resumed.session.state, 'running');
    assert.ok(getNextReadyTasks(resumed).length > 0);
  });

  it('cancels pending and ready tasks', () => {
    const started = startExecution(createSampleCoordinator());
    const cancelled = cancelExecution(started);

    assert.equal(cancelled.session.state, 'cancelled');
    assert.ok(cancelled.session.blockedTasks.length > 0);
  });

  it('estimates remaining time from incomplete tasks', () => {
    const started = startExecution(createSampleCoordinator());
    const initialEta = estimateRemainingTime(started);

    assert.ok(initialEta > 0);

    const firstTask = getNextReadyTasks(started)[0]!;
    const completed = completeRuntimeTask(started, firstTask.id, {
      summary: 'Done',
      output: 'Output',
    });

    assert.ok(estimateRemainingTime(completed) <= initialEta);
  });

  it('serializes execution session for persistence', () => {
    const coordinator = startExecution(createSampleCoordinator());
    const serialized = serializeExecutionSession(coordinator.session);

    assert.equal(serialized.id, coordinator.session.id);
    assert.ok(serialized.graph);
    assert.ok(Array.isArray(serialized.completedTasks));
    assert.equal(typeof serialized.progress, 'number');
  });
});
