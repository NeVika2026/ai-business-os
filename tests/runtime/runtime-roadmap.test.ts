import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createRuntimeBridge } from '@/services/runtime/runtime-bridge';
import { createRuntime as createOrchestratorRuntime } from '@/services/runtime/runtime/runtime';

import { createRoadmapInput, createRuntimeContext, createSprintInput } from './helpers';

describe('Runtime roadmap integration', () => {
  it('executes roadmap and sprint via bridge and facade', () => {
    const bridge = createRuntimeBridge({
      instanceId: 'runtime-roadmap-bridge',
      orchestrationOnly: true,
    });

    const facade = bridge.getFacade();
    const runtimeContext = createRuntimeContext();
    const roadmap = createRoadmapInput();

    const roadmapResult = bridge.executeRoadmap({
      roadmap,
      runtimeContext,
      skipRuntime: true,
    });

    assert.equal(roadmapResult.roadmapId, roadmap.id);
    assert.ok(typeof roadmapResult.sprintsExecuted === 'number');
    assert.ok(roadmapResult.sessionStatus);

    const bridgeStatus = bridge.status();
    assert.equal(bridgeStatus.mode, 'roadmap');

    const bridgeReport = bridge.report();
    assert.equal(bridgeReport.mode, 'roadmap');
    assert.ok(bridgeReport.facadeReport.sessionReport);

    bridge.reset();

    const sprint = createSprintInput();
    const sprintContext = createRuntimeContext({
      runId: 'run-roadmap-0005-0000-4000-8000-000000000005',
      traceId: 'trace-roadmap-005-0000-4000-8000-000000000005',
    });

    const sprintResult = bridge.executeSprint({
      sprint,
      runtimeContext: sprintContext,
      skipRuntime: true,
    });

    assert.equal(sprintResult.sprintId, sprint.id);
    assert.ok(sprintResult.phase);
    assert.ok(Array.isArray(sprintResult.runnerExecutedTasks));

    const facadeResult = facade.executeSprint({
      sprint: {
        ...sprint,
        id: 'sprint-facade-direct-001',
        code: 'S10.2-F',
      },
      runtimeContext: createRuntimeContext({
        runId: 'run-facade-0006-0000-4000-8000-000000000006',
        traceId: 'trace-facade-006-0000-4000-8000-000000000006',
      }),
      skipRuntime: true,
    });

    assert.equal(facadeResult.sprintId, 'sprint-facade-direct-001');

    facade.reset();
    bridge.reset();

    assert.equal(bridge.status().mode, 'idle');
  });

  it('executes roadmap directly on standalone facade', () => {
    const facade = createOrchestratorRuntime({ instanceId: 'runtime-roadmap-facade' });
    const roadmap = createRoadmapInput();

    const result = facade.executeRoadmap({
      roadmap: {
        ...roadmap,
        id: 'roadmap-facade-direct-001',
      },
      runtimeContext: createRuntimeContext({
        runId: 'run-facade-0007-0000-4000-8000-000000000007',
        traceId: 'trace-facade-007-0000-4000-8000-000000000007',
      }),
      skipRuntime: true,
    });

    assert.equal(result.roadmapId, 'roadmap-facade-direct-001');
    assert.ok(facade.status().mode === 'roadmap' || facade.status().mode === 'idle');

    const snapshot = facade.serialize();
    assert.ok(snapshot.runtime);
    assert.ok(snapshot.status);

    facade.reset();
    assert.equal(facade.status().mode, 'idle');
  });
});
