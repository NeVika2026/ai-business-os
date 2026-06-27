import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createDefaultImportanceFields } from '@/services/memory/memory-importance';
import { createMemoryRetriever } from '@/services/memory/memory-retriever';
import { MemoryRetrieverValidationError } from '@/services/memory/memory-retriever-errors';
import type {
  MemoryEntity,
  MemoryFact,
  MemoryRelation,
} from '@/services/memory/memory-engine-types';

const timestamp = '2026-06-28T12:00:00.000Z';

function buildFact(overrides: Partial<MemoryFact> & Pick<MemoryFact, 'id' | 'text'>): MemoryFact {
  return {
    type: 'user_fact',
    entityIds: [],
    confidence: 0.9,
    source: 'test',
    createdAt: timestamp,
    updatedAt: timestamp,
    metadata: {},
    ...createDefaultImportanceFields(),
    ...overrides,
  };
}

function buildEntity(
  overrides: Partial<MemoryEntity> & Pick<MemoryEntity, 'id' | 'name'>,
): MemoryEntity {
  return {
    type: 'person',
    aliases: [],
    factIds: [],
    relationIds: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    metadata: {},
    ...overrides,
  };
}

function buildRelation(
  overrides: Partial<MemoryRelation> &
    Pick<MemoryRelation, 'id' | 'subjectEntityId' | 'objectEntityId' | 'predicate'>,
): MemoryRelation {
  return {
    factIds: [],
    confidence: 0.85,
    createdAt: timestamp,
    updatedAt: timestamp,
    metadata: {},
    ...overrides,
  };
}

describe('MemoryRetriever', () => {
  it('ranks and retrieves matching facts', () => {
    const retriever = createMemoryRetriever({ instanceId: 'memory-retriever-rank' });
    const entity = buildEntity({ id: 'entity-1', name: 'Victoria' });
    const fact = buildFact({
      id: 'fact-1',
      text: 'Victoria prefers Telegram communication',
      entityIds: [entity.id],
    });

    const ranked = retriever.rank({
      query: 'telegram victoria',
      facts: [fact],
      entities: [entity],
      relations: [],
    });

    assert.equal(ranked.facts.length, 1);
    assert.ok(ranked.facts[0]?.score > 0);

    const result = retriever.retrieve({
      query: 'telegram victoria',
      facts: [fact],
      entities: [entity],
      relations: [],
    });

    assert.equal(result.selectedFacts.length, 1);
    assert.equal(result.selectedFacts[0]?.fact.id, fact.id);
    assert.ok(result.score > 0);
    assert.ok(result.reason.length > 0);
  });

  it('returns empty rank for blank query tokens', () => {
    const retriever = createMemoryRetriever({ instanceId: 'memory-retriever-empty' });

    const ranked = retriever.rank({
      query: '!!!',
      facts: [buildFact({ id: 'fact-2', text: 'Some memory' })],
      entities: [],
      relations: [],
    });

    assert.deepEqual(ranked.facts, []);
    assert.deepEqual(ranked.entities, []);
    assert.deepEqual(ranked.relations, []);
  });

  it('explains retrieval results', () => {
    const retriever = createMemoryRetriever({ instanceId: 'memory-retriever-explain' });
    const relation = buildRelation({
      id: 'relation-1',
      subjectEntityId: 'entity-a',
      objectEntityId: 'entity-b',
      predicate: 'uses',
    });

    const result = retriever.retrieve({
      query: 'uses',
      facts: [],
      entities: [],
      relations: [relation],
    });

    const lines = retriever.explain(result);
    assert.ok(lines.some((line) => line.startsWith('Query:')));
    assert.ok(lines.some((line) => line.includes('uses')));
  });

  it('rejects missing query', () => {
    const retriever = createMemoryRetriever({ instanceId: 'memory-retriever-validation' });

    assert.throws(
      () => retriever.retrieve({ query: '   ', facts: [], entities: [], relations: [] }),
      (error: unknown) => error instanceof MemoryRetrieverValidationError,
    );
  });

  it('serializes and resets retriever state', () => {
    const retriever = createMemoryRetriever({ instanceId: 'memory-retriever-serialize' });
    const fact = buildFact({ id: 'fact-3', text: 'Launch memory consolidation sprint' });

    retriever.retrieve({
      query: 'memory consolidation',
      facts: [fact],
      entities: [],
      relations: [],
    });

    const snapshot = retriever.serialize();
    assert.equal(snapshot.instanceId, 'memory-retriever-serialize');
    assert.ok(snapshot.lastResult);
    assert.equal(snapshot.lastResult?.selectedFacts.length, 1);

    retriever.reset();
    assert.equal(retriever.getLastResult(), null);
    assert.equal(retriever.serialize().lastResult, null);
  });
});
