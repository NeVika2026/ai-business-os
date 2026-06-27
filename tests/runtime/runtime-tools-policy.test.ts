import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { knowledgeSearchHandler } from '@/services/runtime/tools/handlers/knowledge-handler';
import { permissionEngine } from '@/services/runtime/tools/permissions/permission-engine';
import { executeWithRetry } from '@/services/runtime/tools/retry/retry-policy';
import { RetryExhaustedError } from '@/services/runtime/tools/retry/retry-errors';

describe('Tool handler and policy coverage', () => {
  it('executes knowledge search handler', async () => {
    const result = await knowledgeSearchHandler.execute(
      { query: 'runtime architecture', limit: 3 },
      {
        organizationId: 'org-test-001',
        runId: 'run-test-001',
        traceId: 'trace-test-001',
        employeeId: 'emp-test-001',
      },
    );

    assert.equal(typeof result.count, 'number');
    assert.ok(Array.isArray(result.chunks));
  });

  it('evaluates permission engine for enabled tools', () => {
    const allowed = permissionEngine.check({
      organizationId: 'org-1',
      employeeId: 'emp-1',
      role: 'Admin',
      toolId: 'runtime.info',
      category: 'system',
      permissions: {},
      enabledTools: ['runtime.info'],
      toolPermissions: { requiredFlags: [], categoryDefault: true },
      orgFeatures: {},
      employeeActive: true,
    });

    assert.equal(allowed.allowed, true);
  });

  it('retries retryable tool errors', async () => {
    let attempts = 0;
    const result = await executeWithRetry(
      async () => {
        attempts += 1;
        if (attempts < 2) {
          const error = new Error('temporary');
          (error as Error & { code: string }).code = 'EXECUTION_TIMEOUT';
          throw error;
        }
        return 'ok';
      },
      { maxAttempts: 3, backoffMs: [1], retryableErrors: ['EXECUTION_TIMEOUT'] },
    );

    assert.equal(result.value, 'ok');
    assert.equal(attempts, 2);
  });

  it('throws when retry attempts are exhausted', async () => {
    await assert.rejects(
      () =>
        executeWithRetry(
          async () => {
            const error = new Error('temporary');
            (error as Error & { code: string }).code = 'EXECUTION_TIMEOUT';
            throw error;
          },
          { maxAttempts: 2, backoffMs: [1], retryableErrors: ['EXECUTION_TIMEOUT'] },
        ),
      RetryExhaustedError,
    );
  });
});
