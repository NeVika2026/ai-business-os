import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { before, describe, it } from 'node:test';

import { createAITaskExecutorAdapter } from '@/services/automation/ai-task-executor-adapter';
import {
  AutonomousWorkerInvalidStateError,
  AutonomousWorkerNotStartedError,
} from '@/services/automation/autonomous-worker-errors';
import { createAutonomousWorker } from '@/services/automation/autonomous-worker';
import { createCommandRunner } from '@/services/automation/command-runner';
import type { RoadmapTaskExecutionHandler } from '@/services/automation/roadmap-task-executor-types';
import type { RoadmapInput } from '@/services/runtime/orchestrator/roadmap/roadmap-types';

function createTempRoot(prefix: string): string {
  return mkdtempSync(path.join(tmpdir(), prefix));
}

function cleanupTempRoot(rootDir: string): void {
  rmSync(rootDir, { recursive: true, force: true });
}

function createRoadmap(overrides?: Partial<RoadmapInput>): RoadmapInput {
  return {
    id: 'roadmap-1',
    title: 'Test Roadmap',
    sprints: [
      {
        id: 'sprint-1',
        code: 'S1',
        title: 'First sprint',
        description: 'First sprint task.',
        skipLint: true,
        skipBuild: true,
      },
    ],
    ...overrides,
  };
}

function createSuccessHandler(): RoadmapTaskExecutionHandler {
  return {
    execute(task) {
      return {
        success: true,
        filesChanged: [`generated/${task.id}.ts`],
        warnings: [],
        errors: [],
      };
    },
  };
}

function createFailingHandler(): RoadmapTaskExecutionHandler {
  return {
    execute() {
      return {
        success: false,
        filesChanged: [],
        warnings: [],
        errors: ['implementation failed'],
      };
    },
  };
}

describe('AutonomousWorker', () => {
  before(() => {
    process.env.AUTOMATION_TEST_ROOT_REQUIRED = '1';
  });

  it('starts and reports running state', () => {
    const rootDir = createTempRoot('autonomous-worker-start-');

    try {
      const worker = createAutonomousWorker({
        instanceId: 'worker-start',
        taskHandler: createSuccessHandler(),
        cwd: rootDir,
      });

      const status = worker.start({ roadmap: createRoadmap() });

      assert.equal(status.state, 'running');
      assert.equal(status.roadmapId, 'roadmap-1');
      assert.equal(status.completedTaskCount, 0);
      assert.equal(status.pendingTaskCount, 1);
      assert.equal(worker.report().workerState, 'running');
    } finally {
      cleanupTempRoot(rootDir);
    }
  });

  it('pauses and resumes the worker', () => {
    const rootDir = createTempRoot('autonomous-worker-pause-');

    try {
      const worker = createAutonomousWorker({
        instanceId: 'worker-pause',
        taskHandler: createSuccessHandler(),
        cwd: rootDir,
      });

      worker.start({ roadmap: createRoadmap() });
      const paused = worker.pause('manual pause');

      assert.equal(paused.state, 'paused');
      assert.equal(paused.pauseReason, 'manual pause');

      assert.throws(
        () => worker.nextTask(),
        (error: unknown) => error instanceof AutonomousWorkerInvalidStateError,
      );

      const resumed = worker.resume();
      assert.equal(resumed.state, 'running');
      assert.equal(resumed.pauseReason, null);
    } finally {
      cleanupTempRoot(rootDir);
    }
  });

  it('stops the worker', () => {
    const rootDir = createTempRoot('autonomous-worker-stop-');

    try {
      const worker = createAutonomousWorker({
        instanceId: 'worker-stop',
        taskHandler: createSuccessHandler(),
        cwd: rootDir,
      });

      worker.start({ roadmap: createRoadmap() });
      const stopped = worker.stop('user requested stop');

      assert.equal(stopped.state, 'stopped');
      assert.equal(stopped.stopReason, 'user requested stop');
      assert.equal(stopped.currentTaskId, null);

      assert.throws(
        () => worker.nextTask(),
        (error: unknown) => error instanceof AutonomousWorkerInvalidStateError,
      );
    } finally {
      cleanupTempRoot(rootDir);
    }
  });

  it('executes one task successfully', () => {
    const rootDir = createTempRoot('autonomous-worker-execute-');

    try {
      const worker = createAutonomousWorker({
        instanceId: 'worker-execute',
        taskHandler: createSuccessHandler(),
        cwd: rootDir,
      });

      worker.start({ roadmap: createRoadmap() });
      const result = worker.nextTask();

      assert.equal(result.executed, true);
      assert.equal(result.taskId, 'sprint-1');
      assert.equal(result.taskStatus, 'completed');
      assert.equal(result.workerState, 'completed');
      assert.equal(result.report?.status, 'completed');
      assert.deepEqual(result.report?.files, ['generated/sprint-1.ts']);
      assert.equal(worker.status().completedTaskCount, 1);
      assert.equal(worker.status().pendingTaskCount, 0);
    } finally {
      cleanupTempRoot(rootDir);
    }
  });

  it('marks the worker failed when a task fails', () => {
    const rootDir = createTempRoot('autonomous-worker-failed-');

    try {
      const worker = createAutonomousWorker({
        instanceId: 'worker-failed',
        taskHandler: createFailingHandler(),
        cwd: rootDir,
      });

      worker.start({ roadmap: createRoadmap() });
      const result = worker.nextTask();

      assert.equal(result.executed, true);
      assert.equal(result.taskStatus, 'failed');
      assert.equal(result.workerState, 'failed');
      assert.equal(result.report?.status, 'failed');
      assert.match(result.report?.errors[0] ?? '', /implementation failed/);
      assert.equal(worker.status().failedTaskCount, 1);
    } finally {
      cleanupTempRoot(rootDir);
    }
  });

  it('blocks dependent tasks when a dependency fails', () => {
    const rootDir = createTempRoot('autonomous-worker-blocked-');
    const roadmap = createRoadmap({
      sprints: [
        {
          id: 'sprint-a',
          code: 'SA',
          title: 'Sprint A',
          skipLint: true,
          skipBuild: true,
        },
        {
          id: 'sprint-b',
          code: 'SB',
          title: 'Sprint B',
          dependsOn: ['sprint-a'],
          skipLint: true,
          skipBuild: true,
        },
      ],
    });

    try {
      const worker = createAutonomousWorker({
        instanceId: 'worker-blocked',
        taskHandler: createFailingHandler(),
        cwd: rootDir,
      });

      worker.start({ roadmap });
      const first = worker.nextTask();

      assert.equal(first.taskId, 'sprint-a');
      assert.equal(first.taskStatus, 'failed');
      assert.equal(first.workerState, 'failed');

      assert.throws(
        () => worker.nextTask(),
        (error: unknown) => error instanceof AutonomousWorkerInvalidStateError,
      );

      const report = worker.report();
      assert.equal(report.failedTaskCount, 1);
      assert.equal(report.pendingTaskCount, 1);
      assert.match(report.nextRecommendedAction, /failed/i);
    } finally {
      cleanupTempRoot(rootDir);
    }
  });

  it('pauses for prepared cursor tasks without running lint or build', () => {
    const rootDir = createTempRoot('autonomous-worker-prepared-');
    let lintCalled = false;
    let buildCalled = false;

    const commandRunner = createCommandRunner({ cwd: rootDir, instanceId: 'prepared-runner' });
    const originalRun = commandRunner.run.bind(commandRunner);
    commandRunner.run = (command, args) => {
      if (command === 'npm' && args[1] === 'lint') {
        lintCalled = true;
      }
      if (command === 'npm' && args[1] === 'build') {
        buildCalled = true;
      }
      return originalRun(command, args);
    };

    const adapter = createAITaskExecutorAdapter({
      instanceId: 'worker-prepared-adapter',
      backend: 'cursor',
    });

    try {
      const worker = createAutonomousWorker({
        instanceId: 'worker-prepared',
        aiTaskExecutorAdapter: adapter,
        commandRunner,
        cwd: rootDir,
      });

      worker.start({
        roadmap: createRoadmap({
          sprints: [
            {
              id: 'sprint-cursor',
              code: 'SC',
              title: 'Cursor sprint',
              description: 'Prepare for Cursor execution.',
              skipLint: false,
              skipBuild: false,
            },
          ],
        }),
      });

      const result = worker.nextTask();

      assert.equal(result.executed, true);
      assert.equal(result.taskStatus, 'running');
      assert.equal(result.workerState, 'paused');
      assert.equal(result.reason, 'waiting_for_external_executor');
      assert.equal(result.report?.status, 'prepared');
      assert.deepEqual(result.report?.files, []);
      assert.equal(result.report?.lint, null);
      assert.equal(result.report?.build, null);
      assert.equal(lintCalled, false);
      assert.equal(buildCalled, false);
      assert.equal(adapter.status().state, 'idle');
      assert.equal(result.report?.executor.status, 'prepared');
    } finally {
      cleanupTempRoot(rootDir);
    }
  });

  it('serializes worker state and resets to idle', () => {
    const rootDir = createTempRoot('autonomous-worker-serialize-');

    try {
      const worker = createAutonomousWorker({
        instanceId: 'worker-serialize',
        taskHandler: createSuccessHandler(),
        cwd: rootDir,
      });

      worker.start({ roadmap: createRoadmap() });
      worker.nextTask();

      const snapshot = worker.serialize();

      assert.equal(snapshot.instanceId, 'worker-serialize');
      assert.equal(snapshot.state, 'completed');
      assert.equal(snapshot.completedTaskCount, 1);
      assert.ok(snapshot.report);
      assert.equal(snapshot.report?.taskReports.length, 1);
      assert.equal(snapshot.report?.taskReports[0]?.status, 'completed');

      worker.reset();
      const resetStatus = worker.status();

      assert.equal(resetStatus.state, 'idle');
      assert.equal(resetStatus.roadmapId, null);
      assert.equal(resetStatus.completedTaskCount, 0);

      const resetSnapshot = worker.serialize();
      assert.equal(resetSnapshot.report, null);

      assert.throws(
        () => worker.report(),
        (error: unknown) => error instanceof AutonomousWorkerNotStartedError,
      );
    } finally {
      cleanupTempRoot(rootDir);
    }
  });
});
