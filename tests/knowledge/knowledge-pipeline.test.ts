import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createKnowledgePipeline } from '@/services/knowledge/knowledge-pipeline';
import { KnowledgePipelineValidationError } from '@/services/knowledge/knowledge-pipeline-errors';

const SAMPLE_MARKDOWN = `---
title: Sales Playbook
tags: [sales, playbook]
---

# Sales Playbook

Qualify leads using BANT before proposing a demo.

## Discovery

Ask about budget, authority, need, and timeline.
`;

describe('KnowledgePipeline', () => {
  it('ingests markdown, indexes chunks, and supports search', () => {
    const pipeline = createKnowledgePipeline({ instanceId: 'test-pipeline' });

    const result = pipeline.ingestMarkdown({
      content: SAMPLE_MARKDOWN,
      source: 'test-sales-playbook',
      tags: ['crm'],
    });

    assert.ok(result.documentId);
    assert.equal(result.title, 'Sales Playbook');
    assert.ok(result.chunkCount > 0);
    assert.equal(result.indexedChunkCount, result.chunkCount);

    const searchResults = pipeline.search('BANT demo', 5);
    assert.ok(searchResults.length > 0);
    assert.ok(searchResults.some((entry) => entry.text.includes('BANT')));

    const stats = pipeline.statistics();
    assert.equal(stats.documentCount, 1);
    assert.equal(stats.chunkCount, result.chunkCount);
    assert.ok(stats.indexEntryCount > 0);
    assert.ok(stats.lastIngestAt);

    const metrics = pipeline.getIngestMetrics();
    assert.ok(metrics.headings > 0);
    assert.ok(metrics.tags > 0);

    const snapshot = pipeline.serialize();
    assert.equal(snapshot.instanceId, 'test-pipeline');
    assert.equal(snapshot.importer.documentCount, 1);
  });

  it('finds related and similar chunks after ingest', () => {
    const pipeline = createKnowledgePipeline({ instanceId: 'test-pipeline-related' });

    pipeline.ingestMarkdown({ content: SAMPLE_MARKDOWN, source: 'playbook-a' });
    pipeline.ingestMarkdown({
      content: '# Product FAQ\n\nAI Business OS supports CRM and Knowledge Hub.',
      source: 'faq-a',
    });

    const firstChunkId = pipeline.serialize().chunks.chunks[0]?.id;
    assert.ok(firstChunkId);

    const related = pipeline.related(firstChunkId, 3);
    assert.ok(Array.isArray(related));

    const similar = pipeline.similar(firstChunkId, 3);
    assert.ok(Array.isArray(similar));
  });

  it('batch ingests documents and collects per-document errors', () => {
    const pipeline = createKnowledgePipeline({ instanceId: 'test-pipeline-batch' });

    const batch = pipeline.ingestDocuments([
      { content: '# Valid Doc\n\nSome content here.', source: 'valid' },
      { content: '   ', source: 'empty' },
    ]);

    assert.equal(batch.results.length, 1);
    assert.equal(batch.errors.length, 1);
    assert.match(batch.errors[0].message, /content is required/i);
  });

  it('rejects empty search queries', () => {
    const pipeline = createKnowledgePipeline({ instanceId: 'test-pipeline-search' });

    assert.throws(
      () => pipeline.search('   '),
      (error: unknown) => error instanceof KnowledgePipelineValidationError,
    );
  });

  it('resets without cross-test leakage', () => {
    const pipeline = createKnowledgePipeline({ instanceId: 'test-pipeline-reset' });

    pipeline.ingestMarkdown({ content: '# Reset Test\n\nTemporary content.', source: 'reset' });
    assert.equal(pipeline.statistics().documentCount, 1);

    pipeline.reset();
    assert.equal(pipeline.statistics().documentCount, 0);
    assert.equal(pipeline.statistics().chunkCount, 0);
  });
});
