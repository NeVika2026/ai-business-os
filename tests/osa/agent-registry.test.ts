import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  getCoreOsaAgents,
  getOsaAgentById,
  getOsaAgentByName,
  getOsaAgentsByCategory,
  getOsaAgentsByTags,
  listOsaAgents,
  resolveOsaAgents,
  type OsaAgentId,
} from '@/utils/osa/agent-registry';

describe('OSA agent registry', () => {
  it('lists all canonical OSA agents', () => {
    const agents = listOsaAgents();

    assert.equal(agents.length, 14);
    assert.ok(agents.every((agent) => agent.id && agent.name && agent.title));
  });

  it('resolves agents by id and name', () => {
    const byId = getOsaAgentById('marketing');
    const byName = getOsaAgentByName('AI Marketing');

    assert.ok(byId);
    assert.ok(byName);
    assert.equal(byId?.id, byName?.id);
  });

  it('returns undefined for unknown agents', () => {
    assert.equal(getOsaAgentById('unknown-agent'), undefined);
    assert.equal(getOsaAgentByName('AI Unknown'), undefined);
  });

  it('filters agents by category', () => {
    const salesAgents = getOsaAgentsByCategory('Sales');

    assert.ok(salesAgents.some((agent) => agent.id === 'crm'));
    assert.ok(salesAgents.some((agent) => agent.id === 'sales'));
  });

  it('returns core agents only', () => {
    const coreAgents = getCoreOsaAgents();
    const coreIds = coreAgents.map((agent) => agent.id);

    assert.deepEqual(coreIds, ['business-manager', 'marketing', 'crm', 'analyst']);
    assert.ok(coreAgents.every((agent) => agent.isCore));
  });

  it('filters agents by tags', () => {
    const tagged = getOsaAgentsByTags(['real-estate', 'content']);

    assert.ok(tagged.some((agent) => agent.id === 'estate'));
    assert.ok(tagged.some((agent) => agent.id === 'content'));
  });

  it('resolveOsaAgents ignores unknown values and deduplicates', () => {
    const resolved = resolveOsaAgents([
      'business-manager',
      'AI Marketing',
      'unknown-agent',
      'marketing',
      '  ',
    ]);

    assert.deepEqual(
      resolved.map((agent) => agent.id),
      ['business-manager', 'marketing'],
    );
  });

  it('includes all required initial agent ids', () => {
    const expectedIds: OsaAgentId[] = [
      'business-manager',
      'marketing',
      'crm',
      'analyst',
      'estate',
      'mlm',
      'content',
      'sales',
      'finance',
      'lawyer',
      'support',
      'hr',
      'project-manager',
      'knowledge-manager',
    ];

    const actualIds = listOsaAgents().map((agent) => agent.id);
    assert.deepEqual(actualIds, expectedIds);
  });
});
