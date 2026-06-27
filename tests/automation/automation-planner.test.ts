import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createAutomationPlanner } from '@/services/automation/automation-planner';
import { AutomationPlannerValidationError } from '@/services/automation/automation-planner-errors';
import type {
  AutomationPlannerInput,
  AutomationPlannerTask,
} from '@/services/automation/automation-planner-types';

function createTask(
  overrides: Partial<AutomationPlannerTask> & Pick<AutomationPlannerTask, 'id' | 'title'>,
): AutomationPlannerTask {
  return {
    description: null,
    dependencies: [],
    status: 'pending',
    priority: 0,
    order: 0,
    metadata: {},
    ...overrides,
  };
}

function createInput(tasks: AutomationPlannerTask[]): AutomationPlannerInput {
  return {
    roadmapId: 'roadmap-1',
    roadmapTitle: 'Roadmap One',
    tasks,
  };
}

describe('AutomationPlanner', () => {
  it('plans a simple roadmap with one ready task', () => {
    const planner = createAutomationPlanner({ instanceId: 'planner-simple' });
    const plan = planner.plan(
      createInput([createTask({ id: 'task-a', title: 'Task A', order: 0 })]),
    );

    assert.equal(plan.nextTask?.id, 'task-a');
    assert.deepEqual(
      plan.readyTasks.map((task) => task.id),
      ['task-a'],
    );
    assert.equal(plan.completedTasks.length, 0);
    assert.deepEqual(plan.executionOrder, ['task-a']);
    assert.equal(planner.report().statistics.totalTasks, 1);
  });

  it('orders a dependency chain by depth', () => {
    const planner = createAutomationPlanner({ instanceId: 'planner-chain' });
    const plan = planner.plan(
      createInput([
        createTask({ id: 'task-c', title: 'Task C', dependencies: ['task-b'], order: 2 }),
        createTask({ id: 'task-a', title: 'Task A', order: 0 }),
        createTask({ id: 'task-b', title: 'Task B', dependencies: ['task-a'], order: 1 }),
      ]),
    );

    assert.equal(plan.nextTask?.id, 'task-a');
    assert.deepEqual(plan.executionOrder, ['task-a', 'task-b', 'task-c']);
    assert.equal(planner.next()?.id, 'task-a');
    planner.syncTaskStatus('task-a', 'completed');
    assert.equal(planner.next()?.id, 'task-b');
  });

  it('supports parallel ready tasks', () => {
    const planner = createAutomationPlanner({ instanceId: 'planner-parallel' });
    const plan = planner.plan(
      createInput([
        createTask({ id: 'task-a', title: 'Task A', order: 0 }),
        createTask({ id: 'task-b', title: 'Task B', order: 1 }),
      ]),
    );

    assert.deepEqual(
      plan.readyTasks.map((task) => task.id),
      ['task-a', 'task-b'],
    );
    assert.equal(planner.next()?.id, 'task-a');
    assert.equal(planner.next()?.id, 'task-b');
  });

  it('blocks tasks when a dependency failed', () => {
    const planner = createAutomationPlanner({ instanceId: 'planner-failed-dep' });
    planner.plan(
      createInput([
        createTask({ id: 'task-a', title: 'Task A', status: 'failed', order: 0 }),
        createTask({
          id: 'task-b',
          title: 'Task B',
          dependencies: ['task-a'],
          order: 1,
        }),
      ]),
    );

    assert.deepEqual(
      planner.blocked().map((task) => task.id),
      ['task-b'],
    );
    assert.equal(planner.next(), null);
    assert.equal(planner.report().statistics.blocked, 1);
  });

  it('rejects duplicate task ids', () => {
    const planner = createAutomationPlanner({ instanceId: 'planner-duplicate' });

    assert.throws(
      () =>
        planner.plan(
          createInput([
            createTask({ id: 'task-a', title: 'Task A' }),
            createTask({ id: 'task-a', title: 'Task A duplicate', order: 1 }),
          ]),
        ),
      (error: unknown) => error instanceof AutomationPlannerValidationError,
    );
  });

  it('rejects missing dependencies', () => {
    const planner = createAutomationPlanner({ instanceId: 'planner-missing-dep' });

    assert.throws(
      () =>
        planner.plan(
          createInput([
            createTask({
              id: 'task-a',
              title: 'Task A',
              dependencies: ['missing-task'],
            }),
          ]),
        ),
      (error: unknown) =>
        error instanceof AutomationPlannerValidationError &&
        (error.message.includes('missing dependency') || error.message.includes('orphan task')),
    );
  });

  it('rejects circular dependencies', () => {
    const planner = createAutomationPlanner({ instanceId: 'planner-cycle' });

    assert.throws(
      () =>
        planner.plan(
          createInput([
            createTask({ id: 'task-a', title: 'Task A', dependencies: ['task-b'], order: 0 }),
            createTask({ id: 'task-b', title: 'Task B', dependencies: ['task-a'], order: 1 }),
          ]),
        ),
      (error: unknown) => error instanceof AutomationPlannerValidationError,
    );
  });

  it('detects orphan task references', () => {
    const planner = createAutomationPlanner({ instanceId: 'planner-orphan' });

    assert.throws(
      () =>
        planner.plan(
          createInput([
            createTask({
              id: 'task-child',
              title: 'Task Child',
              dependencies: ['orphan-parent'],
            }),
          ]),
        ),
      (error: unknown) =>
        error instanceof AutomationPlannerValidationError &&
        error.message.includes('missing dependency: orphan-parent'),
    );
  });

  it('serializes planner state', () => {
    const planner = createAutomationPlanner({ instanceId: 'planner-serialize' });
    planner.plan(createInput([createTask({ id: 'task-a', title: 'Task A' })]));

    const snapshot = planner.serialize();

    assert.equal(snapshot.instanceId, 'planner-serialize');
    assert.equal(snapshot.planned, true);
    assert.equal(snapshot.statistics.totalTasks, 1);
    assert.ok(snapshot.plan);
    assert.equal(snapshot.report.readyTaskIds[0], 'task-a');

    planner.reset();
    const resetSnapshot = planner.serialize();
    assert.equal(resetSnapshot.planned, false);
    assert.equal(resetSnapshot.plan, null);
  });
});
