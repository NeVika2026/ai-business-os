import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createRuntimeBridge } from '@/services/runtime/runtime-bridge';
import type { AgentExecution } from '@/types/runtime/dto';

function createSmokeExecution(): AgentExecution {
  return {
    scope: {
      organizationId: 'org000001-0000-4000-8000-000000000001',
    },
    employeeId: 'c1000001-0000-4000-8000-000000000001',
    input: {
      action: 'summarize_leads',
      payload: {
        trace: {
          runId: 'run000001-0000-4000-8000-000000000001',
          correlationId: 'corr00001-0000-4000-8000-000000000001',
          traceId: 'trace0001-0000-4000-8000-000000000001',
        },
      },
    },
  };
}

describe('Runtime end-to-end smoke', () => {
  it('runs full runtime cycle through RuntimeApi without legacy path', async () => {
    const bridge = createRuntimeBridge({
      instanceId: 'runtime-e2e-smoke',
      orchestrationOnly: true,
    });

    const api = bridge.getApi();
    const executionEngine = bridge.getExecution();
    const validator = bridge.getValidator();

    assert.ok(bridge.getContextAdapter(), 'context adapter is wired');
    assert.ok(bridge.getMemoryAdapter(), 'memory adapter is wired');
    assert.ok(bridge.getPromptAdapter(), 'prompt adapter is wired');
    assert.ok(bridge.getPipelineAdapter(), 'pipeline adapter is wired');
    assert.ok(bridge.getToolAdapter(), 'tool adapter is wired');
    assert.ok(bridge.getGatewayAdapter(), 'gateway adapter is wired');
    assert.ok(executionEngine, 'runtime execution is wired');
    assert.ok(bridge.getFacade(), 'runtime facade is wired');

    const validationReport = validator.validateRuntime();
    assert.equal(validationReport.valid, true, validationReport.errors.join('; '));

    const apiValidation = api.validate();
    assert.equal(apiValidation.valid, true, apiValidation.errors.join('; '));

    const execution = createSmokeExecution();
    const result = await api.execute({
      execution,
      useFullExecution: true,
      useLegacyPipeline: false,
    });

    assert.equal(result.status, 'completed');
    assert.equal(result.error, undefined);
    assert.ok(result.output);
    assert.ok(result.trace.runId);

    const serialized = api.serialize();
    assert.equal(serialized.version, api.version());
    assert.equal(serialized.executionStatus, 'completed');
    assert.equal(serialized.validationValid, true);
    assert.ok(serialized.updatedAt);

    const report = api.report();
    assert.equal(report.agentStatus, 'completed');
    assert.equal(report.executionStatus, 'completed');
    assert.equal(report.validationValid, true);
    assert.ok(report.updatedAt);

    const status = api.status();
    assert.equal(status.agentStatus, 'completed');
    assert.equal(status.executionStatus, 'completed');
    assert.equal(status.validationValid, true);
    assert.ok(status.updatedAt);

    const capabilities = api.capabilities();
    assert.equal(capabilities.fullExecution, true);
    assert.ok(capabilities.components.includes('gateway'));
    assert.ok(capabilities.components.includes('tool'));

    const executionReport = executionEngine.report();
    assert.equal(executionReport.status, 'completed');
    assert.ok(executionReport.runId);

    api.reset();
    bridge.reset();

    const resetStatus = api.status();
    assert.equal(resetStatus.agentStatus, null);
    assert.equal(resetStatus.executionStatus, null);
  });
});
