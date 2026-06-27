import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createProductionToolRegistry } from '@/services/runtime/tools/tool-registry';
import { createToolExecutor } from '@/services/runtime/tools/executor/tool-executor-factory';
import { createRuntimeBridge } from '@/services/runtime/runtime-bridge';

import {
  TEST_CORRELATION_ID,
  TEST_EMPLOYEE_ID,
  TEST_ORG_ID,
  TEST_RUN_ID,
  TEST_TRACE_ID,
} from '../runtime/helpers';

describe('Tool runtime production', () => {
  it('executes runtime.info through production handlers', async () => {
    const registry = createProductionToolRegistry();
    const executor = createToolExecutor(registry);

    const result = await executor.execute({
      call: {
        id: 'tool-call-runtime-info',
        name: 'runtime.info',
        arguments: {},
        audit: {
          runId: TEST_RUN_ID,
          employeeId: TEST_EMPLOYEE_ID,
          organizationId: TEST_ORG_ID,
          requestedAt: new Date().toISOString(),
        },
      },
      scope: { organizationId: TEST_ORG_ID },
      trace: {
        runId: TEST_RUN_ID,
        correlationId: TEST_CORRELATION_ID,
        traceId: TEST_TRACE_ID,
      },
      employee: {
        id: TEST_EMPLOYEE_ID,
        roleTitle: 'Tester',
        permissions: {},
        enabledTools: ['runtime.info'],
      },
    });

    assert.equal(result.success, true);
    assert.equal((result.output as { runId: string }).runId, TEST_RUN_ID);
  });

  it('uses scoped registries per runtime bridge instance', () => {
    const bridgeA = createRuntimeBridge({ instanceId: 'tool-scope-a' });
    const bridgeB = createRuntimeBridge({ instanceId: 'tool-scope-b' });

    const listA = bridgeA.getToolAdapter().listTools();
    const listB = bridgeB.getToolAdapter().listTools();

    assert.ok(listA.tools.length > 0);
    assert.equal(listA.tools.length, listB.tools.length);
  });
});
