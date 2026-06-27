import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createRuntimeBridge } from '@/services/runtime/runtime-bridge';
import { auditRecorder } from '@/services/runtime/tools/audit/audit-recorder';
import { idempotencyStore } from '@/services/runtime/tools/idempotency/idempotency-store';

describe('RuntimeBridge resetRuntime cascade', () => {
  it('resets adapters and clears tool caches', () => {
    const bridge = createRuntimeBridge({
      instanceId: 'runtime-bridge-reset',
      orchestrationOnly: true,
    });

    bridge.getGatewayAdapter().serialize();
    bridge.getToolAdapter().listTools();
    idempotencyStore.set('reset-test-key', {
      success: true,
      output: null,
      audit: {
        traceId: 'trace-reset',
        runId: 'run-reset',
        toolId: 'noop',
        toolCallId: 'call-reset',
        status: 'success',
        durationMs: 0,
        idempotencyKey: 'reset-test-key',
        cached: false,
        retryAttempts: 0,
        executedAt: new Date().toISOString(),
      },
    });
    auditRecorder.record({
      traceId: 'trace-reset',
      runId: 'run-reset',
      toolId: 'noop',
      toolCallId: 'call-reset',
      status: 'success',
      durationMs: 0,
      idempotencyKey: 'reset-test-key',
    });

    assert.equal(idempotencyStore.has('reset-test-key'), true);
    assert.equal(auditRecorder.list().length, 1);

    bridge.resetRuntime();

    assert.equal(bridge.readStatus().mode, 'idle');
    assert.equal(idempotencyStore.has('reset-test-key'), false);
    assert.equal(auditRecorder.list().length, 0);
    assert.equal(bridge.getGatewayAdapter().serialize().lastOperation, null);
    assert.equal(bridge.getToolAdapter().serialize().lastOperation, null);
    assert.equal(bridge.getPromptAdapter().serialize().lastOperation, null);
    assert.equal(bridge.getContextAdapter().serialize().lastOperation, null);
  });
});
