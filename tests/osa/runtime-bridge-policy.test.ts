import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import {
  isRuntimeBridgeEnabled,
  isRuntimeBridgeEnabledForGoal,
  isSprintGoal,
} from '@/utils/osa/runtime-bridge-policy';

const previous = process.env.RUNTIME_BRIDGE_ENABLED;

afterEach(() => {
  if (previous === undefined) {
    delete process.env.RUNTIME_BRIDGE_ENABLED;
  } else {
    process.env.RUNTIME_BRIDGE_ENABLED = previous;
  }
});

describe('OSA RuntimeBridge policy', () => {
  it('enables runtime for every goal when the global bridge flag is enabled', () => {
    process.env.RUNTIME_BRIDGE_ENABLED = 'true';

    assert.equal(isRuntimeBridgeEnabled(), true);
    assert.equal(isRuntimeBridgeEnabledForGoal('find_clients'), true);
    assert.equal(isRuntimeBridgeEnabledForGoal('create_content'), true);
    assert.equal(isRuntimeBridgeEnabledForGoal(null), true);
  });

  it('keeps the sprint-goal helper only as specialized routing metadata', () => {
    assert.equal(isSprintGoal('find_clients'), true);
    assert.equal(isSprintGoal('create_content'), false);
  });
});
