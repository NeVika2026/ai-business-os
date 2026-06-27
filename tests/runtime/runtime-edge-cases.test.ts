import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { RoadmapValidationError } from '@/services/runtime/orchestrator/roadmap/roadmap-errors';
import { validateRoadmapInput } from '@/services/runtime/orchestrator/roadmap/roadmap-validator';
import { RuntimeFacadeValidationError } from '@/services/runtime/runtime/runtime-errors';
import { createRuntimeBridge, MockRuntimeBridgeProvider } from '@/services/runtime/runtime-bridge';
import { RuntimeBridgeValidationError } from '@/services/runtime/runtime-bridge-errors';

import {
  createRoadmapInput,
  createRuntimeContext,
  createSprintInput,
  TEST_EMPLOYEE_ID,
  TEST_ORG_ID,
} from './helpers';

describe('Runtime edge cases (S10.4)', () => {
  it('rejects empty roadmap sprint list', () => {
    assert.throws(
      () =>
        validateRoadmapInput({
          id: 'roadmap-empty',
          title: 'Empty Roadmap',
          sprints: [],
        }),
      (error: unknown) =>
        error instanceof RoadmapValidationError &&
        error.message.includes('roadmap.sprints must be a non-empty array'),
    );
  });

  it('rejects duplicated sprint ids', () => {
    const sprint = createSprintInput();

    assert.throws(
      () =>
        validateRoadmapInput({
          id: 'roadmap-duplicates',
          title: 'Duplicate Sprint IDs',
          sprints: [
            { ...sprint, id: 'sprint-dup-001' },
            { ...sprint, id: 'sprint-dup-001', code: 'S10.4-B' },
          ],
        }),
      (error: unknown) =>
        error instanceof RoadmapValidationError && error.message.includes('duplicate sprint id'),
    );
  });

  it('rejects circular sprint dependencies', () => {
    assert.throws(
      () =>
        validateRoadmapInput({
          id: 'roadmap-cycle',
          title: 'Circular Dependencies',
          sprints: [
            {
              ...createSprintInput(),
              id: 'sprint-cycle-a',
              code: 'S10.4-A',
              dependsOn: ['sprint-cycle-b'],
            },
            {
              ...createSprintInput(),
              id: 'sprint-cycle-b',
              code: 'S10.4-B',
              dependsOn: ['sprint-cycle-a'],
            },
          ],
        }),
      (error: unknown) =>
        error instanceof RoadmapValidationError &&
        error.message.includes('sprint dependency cycle detected'),
    );
  });

  it('rejects missing sprint dependency', () => {
    assert.throws(
      () =>
        validateRoadmapInput({
          id: 'roadmap-missing-dep',
          title: 'Missing Dependency',
          sprints: [
            {
              ...createSprintInput(),
              id: 'sprint-missing-dep',
              code: 'S10.4-M',
              dependsOn: ['sprint-does-not-exist'],
            },
          ],
        }),
      (error: unknown) =>
        error instanceof RoadmapValidationError &&
        error.message.includes('depends on unknown sprint'),
    );
  });

  it('handles cancelled coordinator execution', () => {
    const bridge = createRuntimeBridge({
      instanceId: 'runtime-edge-cancelled',
      orchestrationOnly: true,
    });

    const coordinator = bridge.getFacade().getCoordinator();
    coordinator.start({
      organizationId: TEST_ORG_ID,
      employeeId: TEST_EMPLOYEE_ID,
      runId: 'run-edge-cancelled-001',
      traceId: 'trace-edge-cancelled-001',
    });

    coordinator.cancel('user_cancelled');

    const status = coordinator.status();
    assert.equal(status.status, 'cancelled');
    assert.equal(status.cancelled, true);

    const serialized = coordinator.serialize();
    assert.equal(serialized.runtime.cancelReason, 'user_cancelled');

    bridge.reset();
    assert.equal(bridge.status().facadeStatus.coordinatorStatus, null);
  });

  it('handles paused coordinator and session execution', () => {
    const bridge = createRuntimeBridge({
      instanceId: 'runtime-edge-paused',
      orchestrationOnly: true,
    });

    const coordinator = bridge.getFacade().getCoordinator();
    coordinator.start({
      organizationId: TEST_ORG_ID,
      employeeId: TEST_EMPLOYEE_ID,
      runId: 'run-edge-paused-001',
      traceId: 'trace-edge-paused-001',
    });

    coordinator.pause('awaiting_approval');
    assert.equal(coordinator.status().status, 'paused');
    assert.equal(coordinator.status().paused, true);

    coordinator.resume();
    assert.equal(coordinator.status().status, 'running');
    assert.equal(coordinator.status().paused, false);

    const session = bridge.getFacade().getSession();
    session.start({
      roadmap: createRoadmapInput(),
      runtimeContext: createRuntimeContext({
        runId: 'run-edge-paused-roadmap',
        traceId: 'trace-edge-paused-roadmap',
      }),
      skipRuntime: true,
    });
    session.pause('manual_pause');
    assert.equal(session.status().status, 'paused');

    session.resume();
    assert.equal(session.status().status, 'running');

    bridge.reset();
  });

  it('supports repeated reset without throwing', () => {
    const bridge = createRuntimeBridge({
      instanceId: 'runtime-edge-repeated-reset',
      orchestrationOnly: true,
    });

    bridge.executeRoadmap({
      roadmap: createRoadmapInput(),
      runtimeContext: createRuntimeContext(),
      skipRuntime: true,
    });

    bridge.reset();
    bridge.reset();
    bridge.reset();

    const status = bridge.status();
    assert.equal(status.mode, 'idle');
    assert.equal(status.agentStatus, null);
    assert.equal(status.facadeStatus.mode, 'idle');
  });

  it('supports repeated serialize without mutation side effects', () => {
    const bridge = createRuntimeBridge({
      instanceId: 'runtime-edge-repeated-serialize',
      orchestrationOnly: true,
    });

    bridge.executeRoadmap({
      roadmap: createRoadmapInput(),
      runtimeContext: createRuntimeContext({
        runId: 'run-edge-serialize-001',
        traceId: 'trace-edge-serialize-001',
      }),
      skipRuntime: true,
    });

    const first = bridge.serialize();
    const second = bridge.serialize();

    assert.equal(first.mode, second.mode);
    assert.equal(first.facade.status.mode, second.facade.status.mode);
    assert.ok(first.updatedAt);
    assert.ok(second.updatedAt);

    const api = bridge.getApi();
    const apiFirst = api.serialize();
    const apiSecond = api.serialize();
    assert.equal(apiFirst.bridgeMode, apiSecond.bridgeMode);
    assert.equal(apiFirst.facadeMode, apiSecond.facadeMode);

    bridge.reset();
  });

  it('isolates multiple runtime bridge instances', async () => {
    const provider = new MockRuntimeBridgeProvider();

    const bridgeA = createRuntimeBridge({
      instanceId: 'runtime-edge-instance-a',
      provider,
      orchestrationOnly: true,
    });

    const bridgeB = createRuntimeBridge({
      instanceId: 'runtime-edge-instance-b',
      provider,
      orchestrationOnly: true,
    });

    bridgeA.executeRoadmap({
      roadmap: { ...createRoadmapInput(), id: 'roadmap-instance-a' },
      runtimeContext: createRuntimeContext({
        runId: 'run-instance-a',
        traceId: 'trace-instance-a',
      }),
      skipRuntime: true,
    });

    bridgeB.executeSprint({
      sprint: { ...createSprintInput(), id: 'sprint-instance-b' },
      runtimeContext: createRuntimeContext({
        runId: 'run-instance-b',
        traceId: 'trace-instance-b',
      }),
      skipRuntime: true,
    });

    assert.equal(bridgeA.status().mode, 'roadmap');
    assert.equal(bridgeB.status().mode, 'sprint');
    assert.notEqual(bridgeA.serialize().facade.status.mode, bridgeB.serialize().facade.status.mode);

    bridgeA.reset();
    assert.equal(bridgeA.status().mode, 'idle');
    assert.equal(bridgeB.status().mode, 'sprint');

    bridgeB.reset();
    assert.equal(bridgeB.status().mode, 'idle');
  });

  it('rejects invalid bridge and facade instance ids', () => {
    assert.throws(() => createRuntimeBridge({ instanceId: '   ' }), RuntimeBridgeValidationError);

    assert.throws(
      () =>
        createRuntimeBridge({
          instanceId: 'runtime-edge-invalid-facade',
          facadeOptions: { instanceId: '   ' },
        }),
      RuntimeFacadeValidationError,
    );
  });
});
