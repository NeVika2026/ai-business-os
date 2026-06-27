import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createMemoryService } from '@/services/memory/memory-service';
import { MemoryServiceValidationError } from '@/services/memory/memory-service-errors';

describe('MemoryService', () => {
  it('processes text into persisted memory', () => {
    const service = createMemoryService({ instanceId: 'memory-service-process' });

    const result = service.process({
      text: 'My name is Alex. I prefer email for updates.',
      source: 'test',
    });

    assert.equal(result.input, 'My name is Alex. I prefer email for updates.');
    assert.ok(result.statistics.factsSaved >= 1);
    assert.ok(service.facts().length >= 1);
    assert.equal(result.errors.length, 0);
  });

  it('preview extracts without persisting', () => {
    const service = createMemoryService({ instanceId: 'memory-service-preview' });

    const preview = service.preview({ text: 'My goal is to ship the memory layer.' });
    assert.ok(preview.facts.length >= 1);
    assert.equal(service.facts().length, 0);
  });

  it('remember and search stored facts', () => {
    const service = createMemoryService({ instanceId: 'memory-service-search' });

    const remembered = service.remember({
      type: 'business_fact',
      text: 'Company uses Supabase for storage',
      confidence: 0.95,
    });

    const search = service.search('supabase storage');
    assert.ok(search.facts.some((entry) => entry.fact.id === remembered.id));

    const retrieved = service.retrieve('supabase');
    assert.ok(retrieved.selectedFacts.some((entry) => entry.fact.id === remembered.id));
  });

  it('rejects invalid service input', () => {
    const service = createMemoryService({ instanceId: 'memory-service-validation' });

    assert.throws(
      () => service.process({ text: '   ' }),
      (error: unknown) => error instanceof MemoryServiceValidationError,
    );
  });

  it('serializes and resets service state', () => {
    const service = createMemoryService({ instanceId: 'memory-service-serialize' });

    service.process({ text: 'We decided to consolidate memory modules.' });
    const snapshot = service.serialize();

    assert.equal(snapshot.instanceId, 'memory-service-serialize');
    assert.ok(snapshot.lastProcess);
    assert.ok(snapshot.engine.facts.length >= 1);

    service.reset();
    assert.equal(service.facts().length, 0);
    assert.equal(service.serialize().lastProcess, null);
    assert.equal(service.snapshot().factCount, 0);
  });
});
