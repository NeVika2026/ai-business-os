import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createKnowledgeIndex } from '@/services/knowledge/knowledge-index';
import { KnowledgeIndexValidationError } from '@/services/knowledge/knowledge-index-errors';

describe('KnowledgeIndex', () => {
  it('builds entries and supports title, tag, and keyword search', () => {
    const index = createKnowledgeIndex({ instanceId: 'test-index' });

    const entries = index.build({
      documentId: 'doc-1',
      title: 'Sales Playbook',
      source: 'vault/sales.md',
      tags: ['sales', 'playbook'],
      chunks: [
        {
          id: 'chunk-1',
          text: 'Qualify leads using BANT before proposing a demo.',
          section: 'Discovery',
        },
        {
          id: 'chunk-2',
          text: 'Follow up within 24 hours after every demo.',
          section: 'Follow Up',
        },
      ],
    });

    assert.equal(entries.length, 2);
    assert.equal(index.getEntries().length, 2);
    assert.equal(index.getDocuments().length, 1);

    const byTitle = index.findByTitle('playbook');
    assert.equal(byTitle.length, 2);

    const byTag = index.findByTag('sales');
    assert.equal(byTag.length, 2);

    const byQuery = index.findBySearchWords('BANT demo');
    assert.ok(byQuery.length > 0);
    assert.equal(byQuery[0].chunkId, 'chunk-1');
    assert.ok(byQuery[0].score > 0);
  });

  it('replaces document entries on rebuild', () => {
    const index = createKnowledgeIndex({ instanceId: 'test-index-rebuild' });

    index.build({
      documentId: 'doc-1',
      title: 'Original',
      source: 'original.md',
      tags: ['old'],
      chunks: [{ id: 'chunk-old', text: 'Old content', section: null }],
    });

    index.build({
      documentId: 'doc-1',
      title: 'Updated',
      source: 'updated.md',
      tags: ['new'],
      chunks: [{ id: 'chunk-new', text: 'Updated content', section: null }],
    });

    assert.equal(index.getEntries().length, 1);
    assert.equal(index.getEntry('chunk-old'), null);
    assert.equal(index.getEntry('chunk-new')?.title, 'Updated');
  });

  it('validates build input', () => {
    const index = createKnowledgeIndex({ instanceId: 'test-index-validate' });

    assert.throws(
      () => index.build({ documentId: '', title: 'Missing id', source: 'x', tags: [], chunks: [] }),
      (error: unknown) => error instanceof KnowledgeIndexValidationError,
    );
  });

  it('serializes and resets cleanly', () => {
    const index = createKnowledgeIndex({ instanceId: 'test-index-serialize' });

    index.build({
      documentId: 'doc-1',
      title: 'FAQ',
      source: 'faq.md',
      tags: ['faq'],
      chunks: [{ id: 'chunk-1', text: 'Answer common questions quickly.', section: null }],
    });

    const snapshot = index.serialize();
    assert.equal(snapshot.entryCount, 1);
    assert.equal(snapshot.documentCount, 1);
    assert.ok(snapshot.updatedAt);

    index.reset();
    assert.equal(index.serialize().entryCount, 0);
  });
});
