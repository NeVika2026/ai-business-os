import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createRuntimeBridge } from '@/services/runtime/runtime-bridge';
import { createRuntimePipelineAdapter } from '@/services/runtime/runtime-pipeline-adapter';

import { createAgentExecution } from './helpers';

describe('Runtime pipeline adapter integration', () => {
  it('validates, resolves trace, executes legacy pipeline, serializes, and resets', async () => {
    const bridge = createRuntimeBridge({
      instanceId: 'runtime-pipeline-bridge',
      orchestrationOnly: true,
    });

    const pipeline = bridge.getPipelineAdapter();
    const standalone = createRuntimePipelineAdapter();

    const execution = createAgentExecution({
      input: {
        action: 'summarize_leads',
        payload: {
          trace: {
            runId: 'run-pipeline-0009-0000-4000-8000-000000000009',
            correlationId: 'corr-pipeline-009-0000-4000-8000-000000000009',
            traceId: 'trace-pipeline-009-0000-4000-8000-000000000009',
          },
        },
      },
    });

    const validation = pipeline.validate(execution);
    assert.equal(validation.valid, true, validation.errors.join('; '));

    const trace = pipeline.resolveTrace(execution);
    assert.equal(trace.runId, 'run-pipeline-0009-0000-4000-8000-000000000009');

    const result = await pipeline.execute(execution);
    assert.equal(result.status, 'completed');
    assert.ok(result.output);
    assert.ok(result.timeline.length > 0);

    const serializedResult = pipeline.toSerializedResult(result);
    assert.equal(serializedResult.status, 'completed');
    assert.equal(serializedResult.runId, trace.runId);
    assert.equal(serializedResult.errorCode, null);

    const snapshot = pipeline.serialize();
    assert.equal(snapshot.lastOperation, 'execute');
    assert.equal(snapshot.lastStatus, 'completed');
    assert.ok(snapshot.updatedAt);

    pipeline.reset();
    assert.equal(pipeline.serialize().lastOperation, null);

    const invalidValidation = standalone.validate({
      scope: { organizationId: '' },
      employeeId: '',
      input: { action: '', payload: {} },
    });
    assert.equal(invalidValidation.valid, false);
    assert.ok(invalidValidation.errors.length > 0);

    standalone.reset();
  });

  it('runs legacy pipeline through bridge executeAgent', async () => {
    const bridge = createRuntimeBridge({
      instanceId: 'runtime-pipeline-legacy-bridge',
      orchestrationOnly: false,
    });

    const result = await bridge.executeAgent(
      createAgentExecution({
        input: {
          action: 'summarize_leads',
          payload: {
            trace: {
              runId: 'run-pipeline-0010-0000-4000-8000-000000000010',
              correlationId: 'corr-pipeline-010-0000-4000-8000-000000000010',
              traceId: 'trace-pipeline-010-0000-4000-8000-000000000010',
            },
          },
        },
      }),
      { useLegacyPipeline: true },
    );

    assert.equal(result.status, 'completed');
    assert.ok(result.timeline.some((entry) => entry.stage.includes('context')));
    assert.ok(result.timeline.some((entry) => entry.stage.includes('gateway')));

    bridge.reset();
  });
});
