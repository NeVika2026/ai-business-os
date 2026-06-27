import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createKnowledgeChunkEngine } from '@/services/knowledge/knowledge-chunk-engine';
import { createKnowledgeIndex } from '@/services/knowledge/knowledge-index';
import { createKnowledgeSearchEngine } from '@/services/knowledge/knowledge-search-engine';
import {
  KnowledgeSearchEngineNotFoundError,
  KnowledgeSearchEngineValidationError,
} from '@/services/knowledge/knowledge-search-engine-errors';

function createTestSearchEngine() {
  const chunkEngine = createKnowledgeChunkEngine({ instanceId: 'test-search-chunks' });
  const index = createKnowledgeIndex({ instanceId: 'test-search-index' });

  const chunks = chunkEngine.chunkDocument({
    documentId: 'doc-1',
    source: 'playbook.md',
    title: 'Sales Playbook',
    tags: ['sales'],
    sections: [
      { heading: 'Discovery', level: 2, text: 'Qualify leads using BANT before proposing a demo.' },
      {
        heading: 'Follow Up',
        level: 2,
        text: 'Send recap notes within 24 hours after every demo.',
      },
    ],
  });

  index.build({
    documentId: 'doc-1',
    title: 'Sales Playbook',
    source: 'playbook.md',
    tags: ['sales'],
    chunks: chunks.map((chunk) => ({
      id: chunk.id,
      text: chunk.text,
      section: chunk.metadata.section,
    })),
  });

  const searchEngine = createKnowledgeSearchEngine({
    instanceId: 'test-search-engine',
    index,
    chunkEngine,
  });

  return { searchEngine, chunks };
}

describe('KnowledgeSearchEngine', () => {
  it('searches indexed chunks by query', () => {
    const { searchEngine } = createTestSearchEngine();

    const results = searchEngine.search({ query: 'BANT demo', limit: 5 });
    assert.ok(results.length > 0);
    assert.ok(results[0].text.includes('BANT'));
    assert.equal(results[0].title, 'Sales Playbook');
  });

  it('searches by tag and title', () => {
    const { searchEngine } = createTestSearchEngine();

    const byTag = searchEngine.searchByTag({ tag: 'sales', limit: 5 });
    assert.equal(byTag.length, 2);

    const byTitle = searchEngine.searchByTitle({ title: 'playbook', limit: 5 });
    assert.equal(byTitle.length, 2);
  });

  it('returns related and similar chunks for a known chunk', () => {
    const { searchEngine, chunks } = createTestSearchEngine();
    const sourceChunkId = chunks[0].id;

    const related = searchEngine.relatedChunks({ chunkId: sourceChunkId, limit: 3 });
    assert.ok(Array.isArray(related));

    const similar = searchEngine.similarChunks({ chunkId: sourceChunkId, limit: 3 });
    assert.ok(Array.isArray(similar));
  });

  it('validates queries and reports missing chunks', () => {
    const { searchEngine } = createTestSearchEngine();

    assert.throws(
      () => searchEngine.search({ query: '   ' }),
      (error: unknown) => error instanceof KnowledgeSearchEngineValidationError,
    );

    assert.throws(
      () => searchEngine.relatedChunks({ chunkId: 'missing-chunk' }),
      (error: unknown) => error instanceof KnowledgeSearchEngineNotFoundError,
    );
  });

  it('serializes and resets without leaking state', () => {
    const { searchEngine } = createTestSearchEngine();

    const snapshot = searchEngine.serialize();
    assert.equal(snapshot.instanceId, 'test-search-engine');
    assert.ok(snapshot.indexedEntries > 0);
    assert.ok(snapshot.indexedChunks > 0);

    searchEngine.reset();
    assert.equal(searchEngine.serialize().indexedEntries, 0);
    assert.equal(searchEngine.search({ query: 'BANT' }).length, 0);
  });
});
