import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createRuntimeBridge } from '@/services/runtime/runtime-bridge';
import { createRuntimeMemoryAdapter } from '@/services/runtime/runtime-memory-adapter';
import { createMockMemoryProvider } from '@/services/runtime/memory/providers/mock-memory-provider';

import { createMemoryReadRequest, TEST_EMPLOYEE_ID, TEST_ORG_ID } from './helpers';

describe('Runtime memory adapter integration', () => {
  it('reads, searches, serializes, and resets without cross-test leakage', () => {
    const bridge = createRuntimeBridge({
      instanceId: 'runtime-memory-bridge',
      orchestrationOnly: true,
    });

    const memoryAdapter = bridge.getMemoryAdapter();
    const isolated = createRuntimeMemoryAdapter({
      provider: createMockMemoryProvider(),
    });

    const readRequest = createMemoryReadRequest();
    const memoryPackage = memoryAdapter.read(readRequest);

    assert.equal(memoryPackage.organizationId, readRequest.scope.organizationId);
    assert.equal(memoryPackage.employeeId, readRequest.employeeId);
    assert.ok(memoryPackage.entryCount > 0);
    assert.ok(memoryPackage.entries.length > 0);

    const searchAll = memoryAdapter.search({ query: 'lead', limit: 5 });
    assert.ok(searchAll.entryCount >= 0);
    assert.ok(Array.isArray(searchAll.entries));

    const searchSemantic = memoryAdapter.search({
      query: 'campaign',
      kind: 'semantic',
      limit: 3,
    });
    assert.ok(searchSemantic.entryCount >= 0);

    const snapshot = memoryAdapter.serialize();
    assert.ok(snapshot.lastOperation === 'read' || snapshot.lastOperation === 'search');
    assert.ok(snapshot.updatedAt);

    memoryAdapter.reset();
    assert.equal(memoryAdapter.serialize().lastOperation, null);

    const isolatedPackage = isolated.read({
      ...readRequest,
      trace: {
        ...readRequest.trace,
        runId: 'run-memory-iso-0008-0000-4000-8000-000000000008',
      },
    });
    assert.ok(isolatedPackage.entryCount > 0);

    const writeResult = isolated.write({
      kind: 'working',
      scope: 'ai_employee',
      content: 'Integration memory write check',
      importance: 0.5,
    });
    assert.equal(writeResult.organizationId, TEST_ORG_ID);
    assert.equal(writeResult.employeeId, TEST_EMPLOYEE_ID);

    const deleteResult = isolated.delete(writeResult.id);
    assert.equal(deleteResult.id, writeResult.id);
    assert.equal(typeof deleteResult.deleted, 'boolean');

    isolated.reset();
  });
});
