import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { RoadmapValidationError } from '@/services/runtime/orchestrator/roadmap/roadmap-errors';
import { validateRoadmapInput } from '@/services/runtime/orchestrator/roadmap/roadmap-validator';
import { RuntimeBridgeValidationError } from '@/services/runtime/runtime-bridge-errors';
import { createRuntimeBridge } from '@/services/runtime/runtime-bridge';
import { RuntimeExecutionValidationError } from '@/services/runtime/runtime-execution-errors';
import { createRuntimeExecution } from '@/services/runtime/runtime-execution';
import { createRuntimeGatewayAdapter } from '@/services/runtime/runtime-gateway-adapter';
import { createRuntimeMemoryAdapter } from '@/services/runtime/runtime-memory-adapter';
import { createRuntimePipelineAdapter } from '@/services/runtime/runtime-pipeline-adapter';
import { createRuntimeToolAdapter } from '@/services/runtime/runtime-tool-adapter';

import { createAgentExecution, createExecutionWithToolCall, createRuntimeContext } from './helpers';

function createGatewayFailureBridge(instanceId: string) {
  const gatewayAdapter = createRuntimeGatewayAdapter({
    dependencies: {
      complete: async (request) => ({
        content: '',
        finishReason: 'stop',
        providerCode: request.providerCode,
        modelCode: request.modelCode,
        usage: { inputTokens: 0, outputTokens: 0 },
        error: {
          code: 'MOCK_GATEWAY_FAILURE',
          message: 'Simulated gateway failure',
          retryable: false,
        },
      }),
    },
  });

  return createRuntimeBridge({
    instanceId,
    orchestrationOnly: true,
    gatewayAdapter,
    execution: createRuntimeExecution({ adapters: { gateway: gatewayAdapter } }),
  });
}

describe('Runtime failure and recovery (S10.3)', () => {
  it('rejects invalid runtime input before execution', async () => {
    const bridge = createRuntimeBridge({
      instanceId: 'runtime-failure-invalid-input',
      orchestrationOnly: true,
    });

    const invalidExecution = {
      scope: { organizationId: '' },
      employeeId: '',
      input: { action: '', payload: {} },
    };

    const pipelineValidation = bridge.getPipelineAdapter().validate(invalidExecution);
    assert.equal(pipelineValidation.valid, false);
    assert.ok(pipelineValidation.errors.length > 0);

    await assert.rejects(
      () => bridge.runAgent(invalidExecution, { useFullExecution: true }),
      RuntimeBridgeValidationError,
    );
  });

  it('rejects invalid roadmap input', () => {
    const bridge = createRuntimeBridge({
      instanceId: 'runtime-failure-invalid-roadmap',
      orchestrationOnly: true,
    });

    assert.throws(
      () =>
        validateRoadmapInput({
          id: '',
          title: '',
          sprints: [],
        }),
      RoadmapValidationError,
    );

    assert.throws(
      () =>
        bridge.executeRoadmap({
          roadmap: {
            id: '',
            title: '',
            sprints: [],
          },
          runtimeContext: createRuntimeContext(),
          skipRuntime: true,
        }),
      /roadmap/i,
    );
  });

  it('returns failed result when gateway stage fails', async () => {
    const bridge = createGatewayFailureBridge('runtime-failure-gateway');
    const api = bridge.getApi();

    const result = await api.execute({
      execution: createAgentExecution({
        input: {
          action: 'summarize_leads',
          payload: {
            trace: {
              runId: 'run-failure-gateway-001',
              correlationId: 'corr-failure-gateway-001',
              traceId: 'trace-failure-gateway-001',
            },
          },
        },
      }),
      useFullExecution: true,
    });

    assert.equal(result.status, 'failed');
    assert.equal(result.error?.stage, 'gateway');
    assert.match(result.error?.message ?? '', /gateway/i);
  });

  it('returns failed result when tool execution fails', async () => {
    const bridge = createRuntimeBridge({
      instanceId: 'runtime-failure-tool',
      orchestrationOnly: true,
      toolAdapter: createRuntimeToolAdapter({
        dependencies: {
          execute: async () => {
            throw new Error('Simulated tool execution failure');
          },
        },
      }),
    });

    const toolId = bridge.getToolAdapter().listTools().tools[0]?.id;
    assert.ok(toolId);

    const result = await bridge.getApi().execute({
      execution: createExecutionWithToolCall(toolId, 'run-failure-tool-001'),
      useFullExecution: true,
    });

    assert.equal(result.status, 'failed');
    assert.equal(result.error?.stage, 'tool');
  });

  it('surfaces failed pipeline validation at execution and bridge boundaries', async () => {
    const pipelineAdapter = createRuntimePipelineAdapter({
      dependencies: {
        validateAgentExecution: () => {
          throw new Error('Simulated pipeline validation failure');
        },
      },
    });

    const invalidExecution = createAgentExecution({
      input: {
        action: 'summarize_leads',
        payload: {
          trace: {
            runId: 'run-failure-pipeline-001',
            correlationId: 'corr-failure-pipeline-001',
            traceId: 'trace-failure-pipeline-001',
          },
        },
      },
    });

    const validation = pipelineAdapter.validate(invalidExecution);
    assert.equal(validation.valid, false);
    assert.match(validation.errors.join('; '), /pipeline validation failure/i);

    const execution = createRuntimeExecution({ adapters: { pipeline: pipelineAdapter } });
    await assert.rejects(
      () => execution.run({ execution: invalidExecution }),
      RuntimeExecutionValidationError,
    );

    const bridge = createRuntimeBridge({
      instanceId: 'runtime-failure-pipeline-bridge',
      orchestrationOnly: true,
      pipelineAdapter,
      execution,
    });

    await assert.rejects(
      () => bridge.runAgent(invalidExecution, { useFullExecution: true }),
      RuntimeBridgeValidationError,
    );
  });

  it('returns failed result when memory load fails', async () => {
    const memoryAdapter = createRuntimeMemoryAdapter({
      dependencies: {
        load: () => {
          throw new Error('Simulated memory load failure');
        },
      },
    });

    const bridge = createRuntimeBridge({
      instanceId: 'runtime-failure-memory',
      orchestrationOnly: true,
      memoryAdapter,
      execution: createRuntimeExecution({ adapters: { memory: memoryAdapter } }),
    });

    const result = await bridge.getApi().execute({
      execution: createAgentExecution({
        input: {
          action: 'summarize_leads',
          payload: {
            trace: {
              runId: 'run-failure-memory-001',
              correlationId: 'corr-failure-memory-001',
              traceId: 'trace-failure-memory-001',
            },
          },
        },
      }),
      useFullExecution: true,
    });

    assert.equal(result.status, 'failed');
    assert.equal(result.error?.stage, 'memory');
  });

  it('serializes, reports, and resets cleanly after failure', async () => {
    const bridge = createGatewayFailureBridge('runtime-failure-recovery-lifecycle');
    const api = bridge.getApi();
    const executionEngine = bridge.getExecution();

    const result = await api.execute({
      execution: createAgentExecution({
        input: {
          action: 'summarize_leads',
          payload: {
            trace: {
              runId: 'run-failure-lifecycle-001',
              correlationId: 'corr-failure-lifecycle-001',
              traceId: 'trace-failure-lifecycle-001',
            },
          },
        },
      }),
      useFullExecution: true,
    });

    assert.equal(result.status, 'failed');

    const snapshot = api.serialize();
    assert.equal(snapshot.executionStatus, 'failed');
    assert.ok(snapshot.updatedAt);

    const bridgeSnapshot = bridge.serialize();
    assert.equal(bridgeSnapshot.agentResult?.status, 'failed');
    assert.ok(bridgeSnapshot.updatedAt);

    const report = api.report();
    assert.equal(report.agentStatus, 'failed');
    assert.equal(report.executionStatus, 'failed');
    assert.ok(report.updatedAt);

    const bridgeReport = bridge.report();
    assert.equal(bridgeReport.agentResult?.status, 'failed');
    assert.ok(bridgeReport.nextRecommendedAction);

    const executionReport = executionEngine.report();
    assert.equal(executionReport.status, 'failed');
    assert.equal(executionReport.errorStage, 'gateway');

    api.reset();
    bridge.reset();

    const resetStatus = api.status();
    assert.equal(resetStatus.agentStatus, null);
    assert.equal(resetStatus.executionStatus, null);
    assert.equal(resetStatus.bridgeMode, 'idle');

    const resetSnapshot = api.serialize();
    assert.equal(resetSnapshot.executionStatus, null);
    assert.equal(resetSnapshot.agentStatus, null);
  });

  it('recovers to successful execution after reset', async () => {
    const bridge = createGatewayFailureBridge('runtime-failure-recover-success');
    const api = bridge.getApi();

    const failed = await api.execute({
      execution: createAgentExecution({
        input: {
          action: 'summarize_leads',
          payload: {
            trace: {
              runId: 'run-failure-recover-001',
              correlationId: 'corr-failure-recover-001',
              traceId: 'trace-failure-recover-001',
            },
          },
        },
      }),
      useFullExecution: true,
    });
    assert.equal(failed.status, 'failed');

    api.reset();
    bridge.reset();

    const healthyBridge = createRuntimeBridge({
      instanceId: 'runtime-failure-recover-success-healthy',
      orchestrationOnly: true,
    });

    const recovered = await healthyBridge.getApi().execute({
      execution: createAgentExecution({
        input: {
          action: 'summarize_leads',
          payload: {
            trace: {
              runId: 'run-failure-recover-002',
              correlationId: 'corr-failure-recover-002',
              traceId: 'trace-failure-recover-002',
            },
          },
        },
      }),
      useFullExecution: true,
    });

    assert.equal(recovered.status, 'completed');
    assert.equal(recovered.error, undefined);
  });
});
