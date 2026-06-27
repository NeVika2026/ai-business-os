import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createRoadmapTaskExecutor } from '@/services/automation/roadmap-task-executor';
import { RoadmapTaskExecutorValidationError } from '@/services/automation/roadmap-task-executor-errors';
import type { RoadmapTaskInput } from '@/services/automation/roadmap-task-executor-types';

function createTask(
  overrides: Partial<RoadmapTaskInput> & Pick<RoadmapTaskInput, 'id' | 'title'>,
): RoadmapTaskInput {
  return {
    description: null,
    dependencies: [],
    status: 'pending',
    metadata: {},
    ...overrides,
  };
}

describe('RoadmapTaskExecutor', () => {
  it('validates dependency ordering before execution', () => {
    const tasks = [
      createTask({ id: 'task-a', title: 'Task A' }),
      createTask({ id: 'task-b', title: 'Task B', dependencies: ['task-a'] }),
    ];
    const executor = createRoadmapTaskExecutor({
      instanceId: 'roadmap-task-executor-deps',
      tasks,
    });

    const blocked = createTask({
      id: 'task-b',
      title: 'Task B',
      dependencies: ['task-a'],
      status: 'pending',
    });

    assert.equal(executor.canExecute(blocked), false);

    const result = executor.execute(blocked);

    assert.equal(result.success, false);
    assert.match(result.errors[0] ?? '', /dependencies incomplete/);
  });

  it('rejects duplicate task ids during validation', () => {
    const tasks = [
      createTask({ id: 'task-a', title: 'Task A' }),
      createTask({ id: 'task-a', title: 'Task A duplicate' }),
    ];

    assert.throws(
      () =>
        createRoadmapTaskExecutor({
          instanceId: 'roadmap-task-executor-duplicate',
          tasks,
        }),
      (error: unknown) => error instanceof RoadmapTaskExecutorValidationError,
    );
  });

  it('executes a task successfully through the injected handler', () => {
    const tasks = [createTask({ id: 'task-a', title: 'Task A' })];
    const executor = createRoadmapTaskExecutor({
      instanceId: 'roadmap-task-executor-success',
      tasks,
      handler: {
        execute(task) {
          return {
            success: true,
            filesChanged: [`generated/${task.id}.ts`],
            warnings: ['minor warning'],
            errors: [],
          };
        },
      },
    });

    const task = createTask({ id: 'task-a', title: 'Task A', status: 'pending' });
    assert.equal(executor.canExecute(task), true);

    const result = executor.execute(task);

    assert.equal(result.success, true);
    assert.deepEqual(result.filesChanged, ['generated/task-a.ts']);
    assert.deepEqual(result.warnings, ['minor warning']);
    assert.equal(result.report.status, 'completed');
    assert.equal(result.report.taskId, 'task-a');
    assert.ok(result.report.startedAt);
    assert.ok(result.report.finishedAt);
    assert.equal(executor.execute(task).success, false);
  });

  it('returns a failed execution report when the handler fails', () => {
    const tasks = [createTask({ id: 'task-a', title: 'Task A' })];
    const executor = createRoadmapTaskExecutor({
      instanceId: 'roadmap-task-executor-failure',
      tasks,
      handler: {
        execute() {
          return {
            success: false,
            filesChanged: [],
            warnings: [],
            errors: ['implementation failed'],
          };
        },
      },
    });

    const result = executor.execute(
      createTask({ id: 'task-a', title: 'Task A', status: 'pending' }),
    );

    assert.equal(result.success, false);
    assert.deepEqual(result.errors, ['implementation failed']);
    assert.equal(result.report.status, 'failed');
    assert.equal(executor.report().failedTaskCount, 1);
  });

  it('serializes execution state and reports', () => {
    const tasks = [createTask({ id: 'task-a', title: 'Task A' })];
    const executor = createRoadmapTaskExecutor({
      instanceId: 'roadmap-task-executor-serialize',
      tasks,
    });

    executor.execute(createTask({ id: 'task-a', title: 'Task A', status: 'pending' }));

    const snapshot = executor.serialize();

    assert.equal(snapshot.instanceId, 'roadmap-task-executor-serialize');
    assert.equal(snapshot.executedTaskCount, 1);
    assert.equal(snapshot.completedTaskCount, 1);
    assert.equal(snapshot.lastTaskId, 'task-a');
    assert.equal(snapshot.lastSuccess, true);
    assert.ok(snapshot.lastResult);
    assert.equal(snapshot.report.reports.length, 1);
    assert.equal(snapshot.report.reports[0]?.filesChanged[0], 'services/automation/task-a.ts');

    executor.reset();
    const resetSnapshot = executor.serialize();
    assert.equal(resetSnapshot.executedTaskCount, 0);
    assert.equal(resetSnapshot.lastResult, null);
    assert.equal(resetSnapshot.report.reports.length, 0);
  });
});
