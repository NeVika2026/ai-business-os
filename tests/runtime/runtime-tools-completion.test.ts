import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createProductionToolRegistry } from '@/services/runtime/tools/tool-registry';
import { createToolExecutor } from '@/services/runtime/tools/executor/tool-executor-factory';
import { resolveSafePathForTest } from '@/services/runtime/tools/handlers/path-utils';

import {
  TEST_CORRELATION_ID,
  TEST_EMPLOYEE_ID,
  TEST_ORG_ID,
  TEST_RUN_ID,
  TEST_TRACE_ID,
} from '../runtime/helpers';

describe('Tool runtime completion', () => {
  it('executes all production handlers without stub errors', async () => {
    const registry = createProductionToolRegistry();
    const executor = createToolExecutor(registry);
    const toolIds = registry.list().map((tool) => tool.id);

    assert.ok(toolIds.includes('crm.search'));
    assert.ok(toolIds.includes('files.list'));
    assert.ok(toolIds.includes('gateway.health'));
    assert.ok(toolIds.includes('memory.search'));

    for (const toolId of ['runtime.info', 'crm.search', 'gateway.health', 'health.check']) {
      const result = await executor.execute({
        call: {
          id: `call-${toolId}`,
          name: toolId,
          arguments: toolId === 'crm.search' ? { query: 'ivan' } : {},
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
          permissions: {
            can_create_leads: true,
            can_update_leads: true,
            web_search: true,
            can_read_files: true,
          },
          enabledTools: toolIds,
        },
      });

      assert.equal(result.success, true, `tool failed: ${toolId}`);
    }
  });

  it('blocks path traversal in filesystem tools', () => {
    assert.throws(() => resolveSafePathForTest('../../etc/passwd'), /path traversal blocked/);
  });
});
