import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createRuntimeBridge } from '@/services/runtime/runtime-bridge';
import { createRuntimeToolAdapter } from '@/services/runtime/runtime-tool-adapter';

import {
  TEST_CORRELATION_ID,
  TEST_EMPLOYEE_ID,
  TEST_ORG_ID,
  TEST_RUN_ID,
  TEST_TRACE_ID,
} from './helpers';

describe('Runtime tool adapter integration', () => {
  it('lists, validates, executes tools, serializes, and resets', async () => {
    const bridge = createRuntimeBridge({
      instanceId: 'runtime-tools-bridge',
      orchestrationOnly: true,
    });

    const toolAdapter = bridge.getToolAdapter();
    const standalone = createRuntimeToolAdapter();

    const listed = toolAdapter.listTools();
    assert.ok(listed.tools.length > 0);

    const toolId = listed.tools[0]?.id;
    assert.ok(toolId);
    assert.equal(toolAdapter.hasTool(toolId), true);
    assert.equal(toolAdapter.hasTool('missing.tool.id'), false);

    const toolRequest = {
      call: {
        id: 'tool-call-integration-001',
        name: toolId,
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
        roleTitle: 'Integration Tester',
        permissions: {},
        enabledTools: listed.tools.filter((tool) => tool.enabled).map((tool) => tool.id),
      },
    };

    const validation = toolAdapter.validate(toolRequest);
    assert.equal(typeof validation.valid, 'boolean');
    assert.ok(Array.isArray(validation.errors));

    if (validation.valid) {
      const result = await toolAdapter.execute(toolRequest);
      assert.equal(typeof result.success, 'boolean');
      assert.equal(result.name, toolId);
    }

    const snapshot = toolAdapter.serialize();
    assert.ok(snapshot.updatedAt);

    toolAdapter.reset();
    assert.equal(toolAdapter.serialize().lastOperation, null);

    const standaloneList = standalone.listTools();
    assert.ok(standaloneList.tools.length > 0);
    standalone.reset();
  });
});
