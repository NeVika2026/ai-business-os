import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createMemoryExtractor } from '@/services/memory/memory-extractor';
import { MemoryExtractorValidationError } from '@/services/memory/memory-extractor-errors';

describe('MemoryExtractor', () => {
  it('extracts facts and entities from text', () => {
    const extractor = createMemoryExtractor({ instanceId: 'memory-extractor-basic' });

    const result = extractor.extract({
      text: 'My name is Alex. I work at Acme Corp.',
      source: 'test',
    });

    assert.ok(result.facts.length >= 1);
    assert.ok(result.facts.some((fact) => fact.type === 'user_fact'));
    assert.ok(result.statistics.sentencesProcessed >= 1);
    assert.equal(result.input, 'My name is Alex. I work at Acme Corp.');
  });

  it('preview does not update extraction counters', () => {
    const extractor = createMemoryExtractor({ instanceId: 'memory-extractor-preview' });

    const preview = extractor.preview({ text: 'My goal is to launch the product.' });
    assert.ok(preview.facts.length >= 1);

    const snapshotBefore = extractor.serialize();
    assert.equal(snapshotBefore.extractionCount, 0);

    extractor.extract({ text: 'My goal is to launch the product.' });
    const snapshotAfter = extractor.serialize();
    assert.equal(snapshotAfter.extractionCount, 1);
  });

  it('extracts helper methods return typed slices', () => {
    const extractor = createMemoryExtractor({ instanceId: 'memory-extractor-slices' });
    const input = { text: 'I prefer Telegram for client communication.' };

    const facts = extractor.extractFacts(input);
    const entities = extractor.extractEntities(input);
    const relations = extractor.extractRelations(input);

    assert.ok(Array.isArray(facts));
    assert.ok(Array.isArray(entities));
    assert.ok(Array.isArray(relations));
  });

  it('rejects empty input text', () => {
    const extractor = createMemoryExtractor({ instanceId: 'memory-extractor-validation' });

    assert.throws(
      () => extractor.extract({ text: '   ' }),
      (error: unknown) => error instanceof MemoryExtractorValidationError,
    );
  });

  it('serializes and resets extractor state', () => {
    const extractor = createMemoryExtractor({ instanceId: 'memory-extractor-serialize' });

    extractor.extract({ text: 'We decided to migrate to Supabase.' });
    const snapshot = extractor.serialize();

    assert.equal(snapshot.instanceId, 'memory-extractor-serialize');
    assert.ok(snapshot.lastResult);
    assert.equal(snapshot.lastResult?.statistics.factCount, snapshot.statistics.factCount);

    extractor.reset();
    const resetSnapshot = extractor.serialize();
    assert.equal(resetSnapshot.extractionCount, 0);
    assert.equal(resetSnapshot.lastResult, null);
  });
});
