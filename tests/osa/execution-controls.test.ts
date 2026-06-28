import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  applyExecutionControl,
  canCancelExecution,
  canControlExecution,
  canPauseExecution,
  canRestartExecution,
  canResumeExecution,
  canRetryStage,
  canRetryTask,
  cancelExecution,
  getExecutionControlAvailability,
  getExecutionControlAvailabilityFromProgress,
  getExecutionControlState,
  isValidControlTransition,
  mapSessionToControlState,
  pauseExecution,
  restartExecution,
  resumeExecution,
  retryStage,
  retryTask,
} from '@/utils/osa/execution-controls';
import { buildExecutionProgress } from '@/utils/osa/execution-progress';
import {
  buildOsaExecutionControlEvent,
  buildOsaProgressUpdatedEvent,
} from '@/utils/osa/osa-run-persistence';
import {
  failRuntimeTask,
  prepareRuntimeCallsForReadyTasks,
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

const BASE_CONTEXT = {
  runId: 'run-control-001',
  sessionId: 'session-control-001',
  organizationId: '11111111-1111-1111-1111-111111111111',
  aiEmployeeId: 'osa000001-0000-4000-8000-000000000001',
  userId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  runtimeBridgeEnabled: false,
};

function createSampleCoordinator(): ExecutionCoordinator {
  const prepared = prepareOsaTaskSubmitInput(SAMPLE_INPUT);
  const graph = buildExecutionGraph({
    plan: prepared.executionPlan,
    graphId: 'graph-control-sample',
  });

  return {
    session: {
      id: 'session-control-sample',
      state: 'idle',
      currentStage: graph.stages[0]?.id ?? null,
      graph,
      executionPlan: prepared.executionPlan,
      businessContext: prepared.businessDescription,
      userGoal: prepared.userPrompt,
      selectedAgents: prepared.selectedAgents,
      completedTasks: [],
      runningTasks: [],
      failedTasks: [],
      blockedTasks: [],
      results: {},
      snapshots: [],
      steps: [],
      progress: graph.progress,
      eta: graph.eta,
      createdAt: '2026-06-28T10:00:00.000Z',
      updatedAt: '2026-06-28T10:00:00.000Z',
    },
  };
}

function createRunningCoordinator(): ExecutionCoordinator {
  return startExecution(createSampleCoordinator());
}

function createFailedCoordinator(): ExecutionCoordinator {
  let coordinator = createRunningCoordinator();
  const { coordinator: prepared, calls } = prepareRuntimeCallsForReadyTasks(coordinator, {
    sessionId: 'session-control-sample',
    runId: 'run-control-001',
  });

  coordinator = prepared;
  const taskId = calls[0]?.taskId;

  assert.ok(taskId);

  return failRuntimeTask(coordinator, taskId, 'Simulated failure');
}

describe('OSA execution controls', () => {
  it('maps session states to control states', () => {
    assert.equal(mapSessionToControlState('running'), 'active');
    assert.equal(mapSessionToControlState('paused'), 'paused');
    assert.equal(mapSessionToControlState('retrying'), 'retrying');
    assert.equal(mapSessionToControlState('cancelled'), 'cancelled');
    assert.equal(mapSessionToControlState('completed'), 'completed');
    assert.equal(mapSessionToControlState('failed'), 'failed');
  });

  it('pauses and resumes an active execution', () => {
    const running = createRunningCoordinator();

    assert.equal(canPauseExecution(running), true);
    assert.equal(canResumeExecution(running), false);

    const paused = pauseExecution(running);

    assert.equal(paused.session.state, 'paused');
    assert.equal(getExecutionControlState(paused), 'paused');
    assert.equal(canResumeExecution(paused), true);

    const resumed = resumeExecution(paused);

    assert.equal(resumed.session.state, 'running');
    assert.equal(getExecutionControlState(resumed), 'active');
  });

  it('cancels a running or paused execution', () => {
    const running = createRunningCoordinator();
    const cancelledFromRunning = cancelExecution(running);

    assert.equal(cancelledFromRunning.session.state, 'cancelled');
    assert.equal(canCancelExecution(cancelledFromRunning), false);

    const paused = pauseExecution(createRunningCoordinator());
    const cancelledFromPaused = cancelExecution(paused);

    assert.equal(cancelledFromPaused.session.state, 'cancelled');
  });

  it('restarts a failed or cancelled execution with a fresh graph', () => {
    const failed = createFailedCoordinator();

    assert.equal(canRestartExecution(failed), true);

    const restarted = restartExecution(failed);

    assert.equal(restarted.session.state, 'running');
    assert.equal(restarted.session.completedTasks.length, 0);
    assert.equal(restarted.session.failedTasks.length, 0);
    assert.equal(getExecutionControlState(restarted), 'active');
  });

  it('retries a failed task and downstream dependents', () => {
    const failed = createFailedCoordinator();
    const failedTaskId = failed.session.failedTasks[0]!;

    assert.equal(canRetryTask(failed, failedTaskId), true);

    const retried = retryTask(failed, failedTaskId);

    assert.equal(retried.session.state, 'retrying');
    assert.equal(getExecutionControlState(retried), 'retrying');
    assert.equal(retried.session.failedTasks.length, 0);

    const retriedTask = retried.session.graph.tasks.find((task) => task.id === failedTaskId);

    assert.equal(retriedTask?.status, 'ready');
  });

  it('retries a failed stage and downstream tasks', () => {
    const failed = createFailedCoordinator();
    const failedTask = failed.session.graph.tasks.find(
      (task) => task.id === failed.session.failedTasks[0],
    );

    assert.ok(failedTask);
    assert.equal(canRetryStage(failed, failedTask.stageId), true);

    const retried = retryStage(failed, failedTask.stageId);

    assert.equal(retried.session.state, 'retrying');
    assert.equal(retried.session.failedTasks.length, 0);
  });

  it('rejects invalid control transitions', () => {
    const idle = createSampleCoordinator();
    const paused = pauseExecution(createRunningCoordinator());
    const cancelled = cancelExecution(createRunningCoordinator());
    const completed = {
      session: { ...createRunningCoordinator().session, state: 'completed' as const },
    };

    assert.equal(isValidControlTransition(idle, 'pause'), false);
    assert.equal(isValidControlTransition(paused, 'pause'), false);
    assert.equal(isValidControlTransition(cancelled, 'resume'), false);
    assert.equal(isValidControlTransition(completed, 'cancel'), false);
    assert.equal(canPauseExecution(cancelled), false);
    assert.equal(canResumeExecution(createRunningCoordinator()), false);
  });

  it('checks permissions for run owner and run status', () => {
    const running = createRunningCoordinator();
    const ownerContext = {
      userId: BASE_CONTEXT.userId,
      runOwnerId: BASE_CONTEXT.userId,
      runStatus: 'running' as const,
    };
    const strangerContext = {
      userId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      runOwnerId: BASE_CONTEXT.userId,
      runStatus: 'running' as const,
    };

    assert.equal(canControlExecution(ownerContext, running, 'pause'), true);
    assert.equal(canControlExecution(strangerContext, running, 'pause'), false);
    assert.equal(canControlExecution(ownerContext, running, 'cancel'), true);
    assert.equal(
      canControlExecution(
        { ...ownerContext, runStatus: 'completed' },
        createFailedCoordinator(),
        'restart',
      ),
      true,
    );
    assert.equal(
      canControlExecution(
        { ...ownerContext, runStatus: 'completed' },
        running,
        'pause',
      ),
      false,
    );
  });

  it('derives button availability from live progress snapshots', () => {
    const running = createRunningCoordinator();
    const progress = buildExecutionProgress(running.session);
    const availability = getExecutionControlAvailabilityFromProgress(progress);

    assert.equal(availability.pause, true);
    assert.equal(availability.resume, false);
    assert.equal(availability.cancel, true);

    const paused = pauseExecution(running);
    const pausedProgress = buildExecutionProgress(paused.session);
    const pausedAvailability = getExecutionControlAvailabilityFromProgress(pausedProgress);

    assert.equal(pausedAvailability.pause, false);
    assert.equal(pausedAvailability.resume, true);
  });

  it('builds history events for control actions and progress updates', () => {
    const running = createRunningCoordinator();
    const paused = pauseExecution(running);
    const progress = buildExecutionProgress(paused.session);

    const pausedEvent = buildOsaExecutionControlEvent(BASE_CONTEXT, 'pause', {
      control_state: paused.session.state,
    });
    const progressEvent = buildOsaProgressUpdatedEvent(BASE_CONTEXT, progress);

    assert.equal(pausedEvent.type, 'osa_execution_paused');
    assert.equal(pausedEvent.actor_id, BASE_CONTEXT.userId);
    assert.equal(pausedEvent.correlation_id, BASE_CONTEXT.runId);
    assert.equal(progressEvent.type, 'osa_progress_updated');
    assert.equal((progressEvent.payload as { controlState?: string }).controlState, 'paused');
  });

  it('applies control actions through a single dispatcher', () => {
    const running = createRunningCoordinator();
    const paused = applyExecutionControl(running, 'pause');
    const resumed = applyExecutionControl(paused, 'resume');
    const availability = getExecutionControlAvailability(resumed);

    assert.equal(paused.session.state, 'paused');
    assert.equal(resumed.session.state, 'running');
    assert.equal(availability.pause, true);
    assert.equal(availability.restart, false);
  });

  it('emits retry history events for task and stage retries', () => {
    const failed = createFailedCoordinator();
    const taskEvent = buildOsaExecutionControlEvent(BASE_CONTEXT, 'retry_task', {
      task_id: failed.session.failedTasks[0],
    });
    const stageEvent = buildOsaExecutionControlEvent(BASE_CONTEXT, 'retry_stage', {
      stage_id: failed.session.currentStage,
    });

    assert.equal(taskEvent.type, 'osa_execution_retry');
    assert.equal(stageEvent.type, 'osa_execution_retry');
    assert.equal(taskEvent.payload.action, 'retry_task');
    assert.equal(stageEvent.payload.action, 'retry_stage');
  });
});
