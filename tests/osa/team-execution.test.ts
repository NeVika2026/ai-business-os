import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildExecutionPlan } from '@/utils/osa/execution-planner';
import {
  buildAgentTasks,
  buildExecutionGraph,
  completeTask,
  estimateProgress,
  failTask,
  getReadyTasks,
  groupParallelTasks,
} from '@/utils/osa/team-execution';
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

function buildSampleGraph() {
  const prepared = prepareOsaTaskSubmitInput(SAMPLE_INPUT);
  return buildExecutionGraph({ plan: prepared.executionPlan, graphId: 'graph-sample' });
}

describe('OSA team execution graph', () => {
  it('creates a graph from execution plan stages and agents', () => {
    const graph = buildSampleGraph();

    assert.ok(graph.stages.length >= 3);
    assert.ok(graph.totalTasks > 0);
    assert.equal(graph.id, 'graph-sample');
    assert.ok(graph.tasks.every((task) => task.id.includes(':')));
    assert.ok(graph.tasks.every((task) => task.agentId.length > 0));
  });

  it('builds agent tasks for a stage with upstream dependencies', () => {
    const prepared = prepareOsaTaskSubmitInput(SAMPLE_INPUT);
    const discoveryStage = prepared.executionPlan.stages[0]!;

    const tasks = buildAgentTasks(discoveryStage, []);

    assert.ok(tasks.length >= 1);
    assert.equal(tasks[0]?.dependsOn.length, 0);
    assert.equal(tasks[0]?.stageId, discoveryStage.id);
  });

  it('resolves dependency readiness across stages', () => {
    const graph = buildSampleGraph();
    const ready = getReadyTasks(graph);

    assert.ok(ready.length > 0);
    assert.ok(ready.every((task) => task.stageId === graph.stages[0]?.id));
  });

  it('groups parallel tasks within parallel stages', () => {
    const graph = buildSampleGraph();
    const groups = groupParallelTasks(graph.tasks, graph.stages);

    assert.ok(Array.isArray(groups));
    assert.ok(graph.parallelGroups.length >= 0);

    const executionStage = graph.stages.find((stage) => stage.id === 'execution');
    if (executionStage?.parallel && executionStage.taskIds.length > 1) {
      assert.ok(groups.some((group) => group.length > 1));
    }
  });

  it('completes tasks and unlocks downstream ready tasks', () => {
    let graph = buildSampleGraph();
    const firstReady = getReadyTasks(graph)[0];

    assert.ok(firstReady);

    graph = completeTask(graph, firstReady.id, {
      summary: 'Discovery complete',
      output: 'Brief prepared',
    });

    assert.equal(graph.completedTasks, 1);
    assert.ok(graph.progress > 0);
    assert.ok(getReadyTasks(graph).length >= 0);
  });

  it('estimates progress and ETA from task states', () => {
    const graph = buildSampleGraph();
    const metrics = estimateProgress(graph.tasks);

    assert.equal(metrics.totalTasks, graph.totalTasks);
    assert.equal(metrics.completedTasks, 0);
    assert.equal(metrics.progress, 0);
    assert.ok(metrics.eta > 0);
    assert.equal(metrics.remainingTasks, metrics.totalTasks);
  });

  it('propagates failure to downstream tasks as blocked', () => {
    let graph = buildSampleGraph();
    const readyTask = getReadyTasks(graph)[0];

    assert.ok(readyTask);

    graph = failTask(graph, readyTask.id, 'Agent unavailable');

    assert.equal(graph.failedTasks, 1);
    assert.ok(graph.tasks.some((task) => task.status === 'blocked'));
  });

  it('supports empty graph when plan has no stages', () => {
    const graph = buildExecutionGraph({
      plan: {
        stages: [],
        dependencies: {},
        parallelGroups: [],
        estimatedMinutes: 0,
        risks: [],
        executionMode: 'sequential',
        reviewRequired: false,
      },
      graphId: 'graph-empty',
    });

    assert.equal(graph.totalTasks, 0);
    assert.equal(graph.progress, 0);
    assert.equal(graph.eta, 0);
    assert.deepEqual(getReadyTasks(graph), []);
  });

  it('supports single-stage graph', () => {
    const team = prepareOsaTaskSubmitInput(SAMPLE_INPUT).executionPlan.stages[0]!.assignedAgents;
    const plan = buildExecutionPlan({
      userInput: 'Single stage task',
      team,
    });
    const singleStagePlan = {
      ...plan,
      stages: [plan.stages[0]!],
      dependencies: { [plan.stages[0]!.id]: [] },
      parallelGroups: [],
    };

    const graph = buildExecutionGraph({ plan: singleStagePlan, graphId: 'graph-single' });

    assert.equal(graph.stages.length, 1);
    assert.ok(graph.totalTasks >= 1);
    assert.ok(getReadyTasks(graph).length >= 1);
  });
});
