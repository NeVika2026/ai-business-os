import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildOrchestratorAgentExecution,
  executeOrchestratorRuntimeAgent,
  isRuntimeBridgeEnabled,
} from '@/services/runtime/runtime-orchestrator-execution';

import { TEST_EMPLOYEE_ID, TEST_ORG_ID, TEST_RUN_ID } from './helpers';

describe('Runtime orchestrator bridge integration', () => {
  it('builds agent execution with trace metadata', () => {
    const execution = buildOrchestratorAgentExecution({
      organizationId: TEST_ORG_ID,
      employeeId: TEST_EMPLOYEE_ID,
      runId: TEST_RUN_ID,
      action: 'execute',
    });

    assert.equal(execution.scope.organizationId, TEST_ORG_ID);
    assert.equal(execution.employeeId, TEST_EMPLOYEE_ID);
    assert.equal(execution.input.action, 'execute');
    assert.equal(execution.input.payload.trace?.runId, TEST_RUN_ID);
  });

  it('executes through runtime bridge and returns structured result', async () => {
    const execution = buildOrchestratorAgentExecution({
      organizationId: TEST_ORG_ID,
      employeeId: TEST_EMPLOYEE_ID,
      runId: 'run-orchestrator-bridge-001',
      action: 'summarize_leads',
    });

    const result = await executeOrchestratorRuntimeAgent(execution);

    assert.equal(result.simulated, false);
    assert.ok(['completed', 'failed'].includes(result.status));
    assert.ok(result.result || result.error);
  });

  it('defaults runtime bridge feature flag to disabled', () => {
    const previous = process.env.RUNTIME_BRIDGE_ENABLED;
    delete process.env.RUNTIME_BRIDGE_ENABLED;
    assert.equal(isRuntimeBridgeEnabled(), false);
    process.env.RUNTIME_BRIDGE_ENABLED = previous;
  });
});
