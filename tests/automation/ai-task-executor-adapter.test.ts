import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';

import {
  createAITaskExecutorAdapter,
  createDefaultMockExecutor,
  type AITaskExecutorAdapter,
} from '@/services/automation/ai-task-executor-adapter';
import {
  AITaskExecutorAdapterInvalidStateError,
  AITaskExecutorAdapterValidationError,
} from '@/services/automation/ai-task-executor-adapter-errors';
import type { AITaskExecutorTask } from '@/services/automation/ai-task-executor-adapter-types';
import { createAutonomousWorker } from '@/services/automation/autonomous-worker';
import { createRoadmapTaskExecutor } from '@/services/automation/roadmap-task-executor';
import type { RoadmapTaskInput } from '@/services/automation/roadmap-task-executor-types';
import type { RoadmapInput } from '@/services/runtime/orchestrator/roadmap/roadmap-types';

function createTask(overrides?: Partial<AITaskExecutorTask>): AITaskExecutorTask {
  return {
    id: 'task-1',
    title: 'Implement feature',
    description: 'Implement the requested feature.',
    acceptanceCriteria: ['Feature works'],
    files: [],
    dependencies: [],
    status: 'idle',
    metadata: {},
    ...overrides,
  };
}

function createRoadmapTask(
  overrides: Partial<RoadmapTaskInput> & Pick<RoadmapTaskInput, 'id' | 'title'>,
): RoadmapTaskInput {
  return {
    description: 'Implement the requested feature.',
    dependencies: [],
    status: 'pending',
    metadata: {},
    ...overrides,
  };
}

function cleanupTempRoot(rootDir: string): void {
  rmSync(rootDir, { recursive: true, force: true });
}

describe('AITaskExecutorAdapter', () => {
  it('executes a task through the default mock executor', () => {
    const adapter = createAITaskExecutorAdapter({ instanceId: 'ai-adapter-mock' });
    const result = adapter.execute(createTask());

    assert.equal(result.success, true);
    assert.equal(result.executorName, 'default-mock-executor');
    assert.equal(result.executorVersion, '1.0.0');
    assert.deepEqual(result.filesChanged, ['services/automation/task-1.ts']);
    assert.equal(adapter.status().state, 'completed');
    assert.equal(adapter.report().completedCount, 1);
  });

  it('returns a failed execution result from the injected backend', () => {
    const adapter = createAITaskExecutorAdapter({
      instanceId: 'ai-adapter-failure',
      executor: {
        name: 'failing-executor',
        version: '0.0.1',
        execute() {
          return {
            success: false,
            filesChanged: [],
            warnings: [],
            errors: ['execution failed'],
            report: 'failed',
          };
        },
      },
    });

    const result = adapter.execute(createTask());

    assert.equal(result.success, false);
    assert.deepEqual(result.errors, ['execution failed']);
    assert.equal(result.report.status, 'failed');
    assert.equal(adapter.report().failedCount, 1);
  });

  it('cancels a running execution through the backend hook', () => {
    let adapterRef: AITaskExecutorAdapter | null = null;
    const adapter = createAITaskExecutorAdapter({
      instanceId: 'ai-adapter-cancel',
      executor: {
        name: 'cancellable-executor',
        version: '0.0.1',
        execute() {
          adapterRef?.cancel();
          return {
            success: false,
            filesChanged: [],
            warnings: [],
            errors: [],
            report: null,
          };
        },
      },
    });
    adapterRef = adapter;

    const result = adapter.execute(createTask());

    assert.equal(result.success, false);
    assert.equal(result.report.status, 'cancelled');
    assert.equal(adapter.status().state, 'cancelled');
  });

  it('rejects cancel when the adapter is idle', () => {
    const adapter = createAITaskExecutorAdapter({ instanceId: 'ai-adapter-cancel-idle' });

    assert.throws(
      () => adapter.cancel(),
      (error: unknown) => error instanceof AITaskExecutorAdapterInvalidStateError,
    );
  });

  it('serializes adapter state after execution', () => {
    const adapter = createAITaskExecutorAdapter({
      instanceId: 'ai-adapter-serialize',
      executor: createDefaultMockExecutor(),
    });

    adapter.execute(createTask());
    const snapshot = adapter.serialize();

    assert.equal(snapshot.instanceId, 'ai-adapter-serialize');
    assert.equal(snapshot.executionCount, 1);
    assert.equal(snapshot.lastTaskId, 'task-1');
    assert.equal(snapshot.lastSuccess, true);
    assert.ok(snapshot.lastResult);
    assert.equal(snapshot.report.completedCount, 1);

    adapter.reset();
    const resetSnapshot = adapter.serialize();
    assert.equal(resetSnapshot.executionCount, 0);
    assert.equal(resetSnapshot.lastResult, null);
  });

  it('rejects invalid task input during validation', () => {
    const adapter = createAITaskExecutorAdapter({ instanceId: 'ai-adapter-validate' });

    assert.throws(
      () => adapter.validate(createTask({ title: '   ', description: 'Valid description' })),
      (error: unknown) => error instanceof AITaskExecutorAdapterValidationError,
    );

    assert.throws(
      () => adapter.validate(createTask({ description: '   ' })),
      (error: unknown) => error instanceof AITaskExecutorAdapterValidationError,
    );
  });
});

describe('AITaskExecutorAdapter worker integration', () => {
  it('executes a roadmap task through the autonomous worker adapter path', () => {
    const rootDir = mkdtempSync(path.join(tmpdir(), 'ai-adapter-worker-'));
    process.env.AUTOMATION_TEST_ROOT_REQUIRED = '1';

    const adapter = createAITaskExecutorAdapter({ instanceId: 'ai-adapter-worker' });
    const worker = createAutonomousWorker({
      instanceId: 'ai-adapter-worker-instance',
      aiTaskExecutorAdapter: adapter,
      cwd: rootDir,
    });

    const roadmap: RoadmapInput = {
      id: 'roadmap-worker',
      title: 'Worker Roadmap',
      sprints: [
        {
          id: 'sprint-1',
          code: 'S1',
          title: 'First sprint',
          description: 'Implement first sprint.',
          skipLint: true,
          skipBuild: true,
        },
      ],
    };

    try {
      worker.start({ roadmap });
      const result = worker.nextTask();

      assert.equal(result.executed, true);
      assert.equal(result.taskId, 'sprint-1');
      assert.equal(result.report?.executor.success, true);
      assert.deepEqual(result.report?.files, ['services/automation/sprint-1.ts']);
      assert.equal(adapter.report().completedCount, 1);
    } finally {
      cleanupTempRoot(rootDir);
    }
  });

  it('integrates with roadmap task executor through toRoadmapHandler', () => {
    const rootDir = mkdtempSync(path.join(tmpdir(), 'ai-adapter-roadmap-'));

    try {
      const adapter = createAITaskExecutorAdapter({ instanceId: 'ai-adapter-roadmap' });
      const executor = createRoadmapTaskExecutor({
        instanceId: 'ai-adapter-roadmap-executor',
        adapter,
        tasks: [createRoadmapTask({ id: 'task-a', title: 'Task A' })],
        rootDir,
      });

      const result = executor.execute(
        createRoadmapTask({ id: 'task-a', title: 'Task A', status: 'pending' }),
      );

      assert.equal(result.success, true);
      assert.deepEqual(result.filesChanged, ['services/automation/task-a.ts']);
    } finally {
      cleanupTempRoot(rootDir);
    }
  });
});
