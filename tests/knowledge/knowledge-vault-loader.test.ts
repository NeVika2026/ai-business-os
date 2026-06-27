import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';

import { createKnowledgeVaultLoader } from '@/services/knowledge/knowledge-vault-loader';
import { KnowledgeVaultLoaderValidationError } from '@/services/knowledge/knowledge-vault-loader-errors';

function createTempVault(prefix: string): string {
  const vaultPath = mkdtempSync(path.join(tmpdir(), prefix));
  writeFileSync(
    path.join(vaultPath, 'playbook.md'),
    `---
title: Sales Playbook
tags: [sales, playbook]
---

# Sales Playbook

Qualify leads using #BANT before proposing a demo.

Related note: [[Product FAQ]]
`,
    'utf8',
  );
  writeFileSync(
    path.join(vaultPath, 'faq.mdx'),
    '# Product FAQ\n\nAI Business OS supports CRM and Knowledge Hub.',
    'utf8',
  );
  mkdirSync(path.join(vaultPath, 'node_modules'), { recursive: true });
  writeFileSync(path.join(vaultPath, 'node_modules', 'ignored.md'), '# Ignored', 'utf8');
  return vaultPath;
}

describe('KnowledgeVaultLoader', () => {
  it('loads markdown vault files with tags, titles, and wikilinks', async () => {
    const vaultPath = createTempVault('knowledge-vault-load-');
    const loader = createKnowledgeVaultLoader({ instanceId: 'test-vault-loader' });

    try {
      const result = await loader.loadVault(vaultPath);
      assert.equal(result.documents.length, 2);
      assert.equal(result.statistics.files, 2);
      assert.equal(result.errors.length, 0);

      const playbook = result.documents.find((doc) => doc.relativePath === 'playbook.md');
      assert.ok(playbook);
      assert.equal(playbook.title, 'Sales Playbook');
      assert.ok(playbook.tags.includes('sales'));
      assert.ok(playbook.tags.includes('BANT'));
      assert.deepEqual(playbook.wikilinks, ['Product FAQ']);
      assert.equal(playbook.extension, 'md');

      const faq = result.documents.find((doc) => doc.relativePath === 'faq.mdx');
      assert.ok(faq);
      assert.equal(faq.title, 'Product FAQ');
      assert.equal(faq.extension, 'mdx');
    } finally {
      rmSync(vaultPath, { recursive: true, force: true });
    }
  });

  it('scans vault files and skips ignored directories', async () => {
    const vaultPath = createTempVault('knowledge-vault-scan-');
    const loader = createKnowledgeVaultLoader({ instanceId: 'test-vault-scan' });

    try {
      const scan = await loader.scanMarkdownFiles(vaultPath);
      assert.equal(scan.files.length, 2);
      assert.ok(scan.files.some((file) => file.relativePath === 'playbook.md'));
      assert.ok(scan.skipped.some((entry) => entry.reason === 'ignored directory'));
    } finally {
      rmSync(vaultPath, { recursive: true, force: true });
    }
  });

  it('validates vault paths and unsupported files', async () => {
    const vaultPath = createTempVault('knowledge-vault-validate-');
    const loader = createKnowledgeVaultLoader({ instanceId: 'test-vault-validate' });

    try {
      const validation = await loader.validateVault(vaultPath);
      assert.equal(validation.valid, true);
      assert.equal(validation.errors.length, 0);

      await assert.rejects(
        () => loader.loadFile(path.join(vaultPath, 'missing.txt')),
        (error: unknown) => error instanceof KnowledgeVaultLoaderValidationError,
      );
    } finally {
      rmSync(vaultPath, { recursive: true, force: true });
    }
  });

  it('serializes and resets loaded documents', async () => {
    const vaultPath = createTempVault('knowledge-vault-reset-');
    const loader = createKnowledgeVaultLoader({ instanceId: 'test-vault-reset' });

    try {
      await loader.loadVault(vaultPath);
      assert.equal(loader.listDocuments().length, 2);

      const snapshot = loader.serialize();
      assert.equal(snapshot.documentCount, 2);
      assert.ok(snapshot.lastVaultPath);

      loader.reset();
      assert.equal(loader.listDocuments().length, 0);
      assert.equal(loader.serialize().documentCount, 0);
    } finally {
      rmSync(vaultPath, { recursive: true, force: true });
    }
  });
});
