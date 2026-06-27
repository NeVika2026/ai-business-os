import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { before, describe, it } from 'node:test';

import { createAutonomousWorker } from '@/services/automation/autonomous-worker';
import {
  getRuntimeCheckpoint,
  resetRuntimeExecutionStore,
} from '@/services/runtime/execution/checkpoint-store';
import { WORKER_CHECKPOINT_STAGE } from '@/services/runtime/execution/worker-checkpoint';
import type { RoadmapInput } from '@/services/runtime/orchestrator/roadmap/roadmap-types';
import type { RoadmapTaskExecutionHandler } from '@/services/automation/roadmap-task-executor-types';

function createTempRoot(prefix: string): string {
  return mkdtempSync(path.join(tmpdir(), prefix));
}

function cleanupTempRoot(rootDir: string): void {
  rmSync(rootDir, { recursive: true, force: true });
}

function createRoadmap(): RoadmapInput {
  return {
    id: 'roadmap-checkpoint-1',
    title: 'Checkpoint Roadmap',
    sprints: [
      {
        id: 'sprint-checkpoint-1',
        code: 'CP1',
        title: 'First task',
        skipLint: true,
        skipBuild: true,
      },
      {
        id: 'sprint-checkpoint-2',
        code: 'CP2',
        title: 'Second task',
        dependsOn: ['sprint-checkpoint-1'],
        skipLint: true,
        skipBuild: true,
      },
    ],
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

describe('AutonomousWorker checkpoint resume', () => {
  before(() => {
    process.env.AUTOMATION_TEST_ROOT_REQUIRED = '1';
    resetRuntimeExecutionStore();
  });

  it('persists planner, runtime, and current task state on interrupt', () => {
    const rootDir = createTempRoot('worker-checkpoint-interrupt-');

    try {
      const worker = createAutonomousWorker({
        instanceId: 'worker-checkpoint',
        organizationId: 'org-checkpoint-001',
        taskHandler: createSuccessHandler(),
        cwd: rootDir,
      });

      worker.start({ roadmap: createRoadmap() });
      const runId = worker.getRunId();
      assert.ok(runId);

      worker.nextTask();
      worker.interrupt('simulated_failure');

      const checkpoint = getRuntimeCheckpoint(runId!, WORKER_CHECKPOINT_STAGE);
      assert.ok(checkpoint);
      const payload = checkpoint!.payload as {
        state: string;
        currentTaskId: string | null;
        tasks: Array<{ taskId: string; status: string }>;
        plannerSnapshot: { instanceId: string } | null;
      };

      assert.equal(payload.state, 'paused');
      assert.equal(payload.tasks[0]?.status, 'completed');
      assert.ok(payload.plannerSnapshot);
    } finally {
      cleanupTempRoot(rootDir);
    }
  });

  it('resumes interrupted execution from checkpoint', () => {
    const rootDir = createTempRoot('worker-checkpoint-resume-');

    try {
      resetRuntimeExecutionStore();

      const workerA = createAutonomousWorker({
        instanceId: 'worker-resume-a',
        organizationId: 'org-checkpoint-002',
        taskHandler: createSuccessHandler(),
        cwd: rootDir,
      });

      workerA.start({ roadmap: createRoadmap() });
      const runId = workerA.getRunId();
      assert.ok(runId);

      workerA.nextTask();
      workerA.interrupt('network_interruption');

      const workerB = createAutonomousWorker({
        instanceId: 'worker-resume-b',
        organizationId: 'org-checkpoint-002',
        taskHandler: createSuccessHandler(),
        cwd: rootDir,
      });

      const resumed = workerB.resumeFromCheckpoint(runId!);
      assert.equal(resumed.state, 'running');
      assert.equal(resumed.completedTaskCount, 1);
      assert.equal(resumed.pendingTaskCount, 1);

      const result = workerB.nextTask();
      assert.equal(result.executed, true);
      assert.equal(result.workerState, 'completed');
    } finally {
      cleanupTempRoot(rootDir);
    }
  });
});
