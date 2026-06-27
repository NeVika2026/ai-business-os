import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  getRuntimeCheckpoint,
  listExecutionHistory,
  recordExecutionStart,
  recordExecutionStatus,
  resetRuntimeExecutionStore,
  saveRuntimeCheckpoint,
} from '@/services/runtime/execution/checkpoint-store';

describe('Runtime execution checkpoint store', () => {
  it('saves checkpoints and records execution history', () => {
    resetRuntimeExecutionStore();

    recordExecutionStart('run-001', 'org-001');
    saveRuntimeCheckpoint({
      runId: 'run-001',
      organizationId: 'org-001',
      stage: 'planner',
      payload: { taskCount: 3 },
    });

    const checkpoint = getRuntimeCheckpoint('run-001', 'planner');
    assert.ok(checkpoint);
    assert.equal(checkpoint?.payload.taskCount, 3);

    recordExecutionStatus('run-001', 'completed');
    const history = listExecutionHistory('org-001');
    assert.equal(history.length, 1);
    assert.equal(history[0]?.status, 'completed');
    assert.equal(history[0]?.checkpointCount, 1);
  });
});
