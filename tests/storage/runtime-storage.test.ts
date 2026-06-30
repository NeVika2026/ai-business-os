import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, it } from 'node:test';

import {
  loadExecutiveDecision,
  saveExecutiveDecision,
} from '@/lib/storage/executive-storage';
import {
  listMemoryEntries,
  saveMemoryEntry,
} from '@/lib/storage/memory-storage';
import {
  loadNavigatorState,
  saveNavigatorState,
} from '@/lib/storage/navigator-storage';
import {
  loadProjectRuntime,
  saveProjectRuntime,
} from '@/lib/storage/project-storage';
import { MemoryStorageProvider } from '@/lib/storage/storage-provider';
import { createRuntimeStorage, resetRuntimeStorage } from '@/lib/storage/storage-factory';
import { STORAGE_NAMESPACES } from '@/lib/storage/storage-types';

describe('OSA Runtime Storage', () => {
  beforeEach(() => {
    resetRuntimeStorage();
  });

  it('implements RuntimeStorage CRUD contract', () => {
    const storage = new MemoryStorageProvider({ persistent: false });

    storage.save('test:items', 'a', { value: 1 });
    assert.equal(storage.exists('test:items', 'a'), true);
    assert.deepEqual(storage.load<{ value: number }>('test:items', 'a'), { value: 1 });

    storage.update('test:items', 'a', (current) => ({
      value: (current?.value ?? 0) + 1,
    }));

    assert.equal(storage.load<{ value: number }>('test:items', 'a')?.value, 2);
    assert.equal(storage.listIds('test:items').length, 1);
    assert.equal(storage.delete('test:items', 'a'), true);
    assert.equal(storage.exists('test:items', 'a'), false);
  });

  it('persists memory entries across provider instances', () => {
    const dir = mkdtempSync(join(tmpdir(), 'osa-runtime-'));
    const persistPath = join(dir, 'runtime-storage.json');

    try {
      const writer = new MemoryStorageProvider({ persistent: true, persistPath });

      saveMemoryEntry(writer, {
        id: 'entry-1',
        scope: 'project',
        importance: 'normal',
        category: 'gateway_outcome',
        task: 'Persist memory',
        result: 'Saved',
        intent: 'persist',
        routingCategory: 'planning',
        summary: 'Persist memory → Saved',
        occurredAt: '2026-06-30T12:00:00.000Z',
        projectId: null,
        organizationId: 'org-storage',
        userId: 'user-storage',
        sessionId: null,
        runId: null,
        correlationId: null,
        archived: false,
        createdAt: '2026-06-30T12:00:00.000Z',
        updatedAt: '2026-06-30T12:00:00.000Z',
      });

      assert.equal(existsSync(persistPath), true);

      const reader = new MemoryStorageProvider({ persistent: true, persistPath });
      const entries = listMemoryEntries(reader);

      assert.equal(entries.length, 1);
      assert.equal(entries[0]?.task, 'Persist memory');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('stores project, executive, and navigator domains', () => {
    const storage = createRuntimeStorage({ isolated: true, persistent: false });

    saveProjectRuntime(storage, {
      id: 'project-1',
      title: 'AI Business OS',
      description: '',
      status: 'active',
      createdAt: '2026-06-30T12:00:00.000Z',
      updatedAt: '2026-06-30T12:00:00.000Z',
      active: true,
      summary: 'Runtime',
      mission: 'Ship',
      lastActivity: null,
      nextStep: 'Next',
      memorySummary: '',
      navigatorState: {
        selectedStepId: null,
        lastSuggestedStepId: 'scale',
        updatedAt: '2026-06-30T12:00:00.000Z',
      },
      organizationId: 'org-storage',
      userId: 'user-storage',
      sourceProjectId: null,
    });

    saveExecutiveDecision(storage, { organizationId: 'org-storage', userId: 'user-storage' }, {
      goal: 'design',
      workingMode: 'continuation',
      projectDecision: 'continue_active',
      projectId: 'project-1',
      memoryMode: 'project',
      navigatorMode: 'scale',
      summary: 'design · continuation',
      reasoning: ['test'],
      confidence: 0.9,
    });

    saveNavigatorState(storage, {
      organizationId: 'org-storage',
      userId: 'user-storage',
      navigatorMode: 'scale',
      lastSuggestedStepId: 'scale',
    });

    assert.equal(loadProjectRuntime(storage, 'project-1')?.title, 'AI Business OS');
    assert.equal(
      loadExecutiveDecision(storage, { organizationId: 'org-storage', userId: 'user-storage' })
        ?.goal,
      'design',
    );
    assert.equal(
      loadNavigatorState(storage, 'org-storage', 'user-storage')?.lastSuggestedStepId,
      'scale',
    );
  });

  it('clears namespaces independently', () => {
    const storage = new MemoryStorageProvider({ persistent: false });

    storage.save(STORAGE_NAMESPACES.MEMORY_ENTRIES, 'e1', { id: 'e1' });
    storage.save(STORAGE_NAMESPACES.PROJECT_RUNTIMES, 'p1', { id: 'p1' });

    storage.clear(STORAGE_NAMESPACES.MEMORY_ENTRIES);

    assert.equal(storage.listIds(STORAGE_NAMESPACES.MEMORY_ENTRIES).length, 0);
    assert.equal(storage.listIds(STORAGE_NAMESPACES.PROJECT_RUNTIMES).length, 1);
  });

  it('factory creates isolated non-persistent storage for tests', () => {
    const isolated = createRuntimeStorage({ isolated: true, persistent: false });
    isolated.save('factory:test', 'id', { ok: true });

    resetRuntimeStorage();

    const fresh = createRuntimeStorage({ isolated: true, persistent: false });
    assert.equal(fresh.load('factory:test', 'id'), null);
  });
});
