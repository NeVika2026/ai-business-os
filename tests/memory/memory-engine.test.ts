import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createMemoryEngine } from '@/services/memory/memory-engine';
import { MemoryNotFoundError, MemoryValidationError } from '@/services/memory/memory-engine-errors';

describe('MemoryEngine', () => {
  it('remembers, searches, and forgets facts', () => {
    const engine = createMemoryEngine({ instanceId: 'memory-engine-remember' });

    const fact = engine.remember({
      type: 'user_fact',
      text: 'User prefers morning standups',
      confidence: 0.9,
    });

    assert.equal(fact.type, 'user_fact');
    assert.equal(fact.text, 'User prefers morning standups');
    assert.equal(engine.facts().length, 1);

    const search = engine.search('morning standups');
    assert.equal(search.facts.length, 1);
    assert.equal(search.facts[0]?.fact.id, fact.id);

    engine.forget(fact.id);
    assert.equal(engine.facts().length, 0);
  });

  it('links entities and relations when remembering', () => {
    const engine = createMemoryEngine({ instanceId: 'memory-engine-relations' });

    engine.remember({
      type: 'business_fact',
      text: 'Victoria works on AI Business OS',
      entities: [{ name: 'Victoria', type: 'person' }],
      relations: [
        {
          subject: 'Victoria',
          predicate: 'works_on',
          object: 'AI Business OS',
        },
      ],
    });

    assert.ok(engine.entities().some((entity) => entity.name === 'Victoria'));
    assert.equal(engine.relations().length, 1);
    assert.equal(engine.relations()[0]?.predicate, 'works_on');
  });

  it('rejects invalid remember input', () => {
    const engine = createMemoryEngine({ instanceId: 'memory-engine-validation' });

    assert.throws(
      () => engine.remember({ type: 'user_fact', text: '   ' }),
      (error: unknown) => error instanceof MemoryValidationError,
    );
  });

  it('throws when forgetting unknown id', () => {
    const engine = createMemoryEngine({ instanceId: 'memory-engine-forget' });

    assert.throws(
      () => engine.forget('missing-fact-id'),
      (error: unknown) => error instanceof MemoryNotFoundError,
    );
  });

  it('serializes and resets engine state', () => {
    const engine = createMemoryEngine({ instanceId: 'memory-engine-serialize' });

    engine.remember({
      type: 'goal',
      text: 'Ship memory consolidation sprint',
    });

    const snapshot = engine.serialize();
    assert.equal(snapshot.instanceId, 'memory-engine-serialize');
    assert.equal(snapshot.facts.length, 1);
    assert.equal(engine.snapshot().factCount, 1);

    engine.reset();
    assert.equal(engine.snapshot().factCount, 0);
    assert.equal(engine.serialize().facts.length, 0);
  });
});
