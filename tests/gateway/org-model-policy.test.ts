import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { dedupeRoutes, filterRoutesByOrgPolicy } from '@/services/runtime/gateway/policy/filter-routes';
import type { OrganizationModelPolicy } from '@/services/runtime/gateway/policy/types';

function policy(mode: OrganizationModelPolicy['mode'], customAllowlist?: OrganizationModelPolicy['customAllowlist']): OrganizationModelPolicy {
  return {
    organizationId: 'org-policy-test',
    mode,
    customAllowlist,
    updatedAt: '2026-06-29T00:00:00.000Z',
  };
}

const SAMPLE_ROUTES = [
  { providerCode: 'openai', modelCode: 'gpt-4o' },
  { providerCode: 'anthropic', modelCode: 'claude-sonnet-4' },
  { providerCode: 'ollama', modelCode: 'llama3.2' },
  { providerCode: 'gigachat', modelCode: 'GigaChat-Pro' },
  { providerCode: 'yandexgpt', modelCode: 'yandexgpt/latest' },
] as const;

describe('Organization model policy filter', () => {
  it('passes all routes through in auto mode', () => {
    const filtered = filterRoutesByOrgPolicy([...SAMPLE_ROUTES], policy('auto'));
    assert.equal(filtered.length, SAMPLE_ROUTES.length);
  });

  it('keeps only russian providers in russia_only mode', () => {
    const filtered = filterRoutesByOrgPolicy([...SAMPLE_ROUTES], policy('russia_only'));
    assert.deepEqual(
      filtered.map((route) => route.providerCode),
      ['gigachat', 'yandexgpt'],
    );
  });

  it('keeps only international providers in international_only mode', () => {
    const filtered = filterRoutesByOrgPolicy([...SAMPLE_ROUTES], policy('international_only'));
    assert.deepEqual(
      filtered.map((route) => route.providerCode),
      ['openai', 'anthropic'],
    );
  });

  it('keeps only local providers in local_only mode', () => {
    const filtered = filterRoutesByOrgPolicy([...SAMPLE_ROUTES], policy('local_only'));
    assert.deepEqual(filtered.map((route) => route.providerCode), ['ollama']);
  });

  it('filters by custom allowlist', () => {
    const filtered = filterRoutesByOrgPolicy(
      [...SAMPLE_ROUTES],
      policy('custom', [
        { providerCode: 'ollama', modelCode: 'llama3.2' },
        { providerCode: 'gigachat', modelCode: 'GigaChat-Pro' },
      ]),
    );

    assert.deepEqual(filtered, [
      { providerCode: 'ollama', modelCode: 'llama3.2' },
      { providerCode: 'gigachat', modelCode: 'GigaChat-Pro' },
    ]);
  });

  it('deduplicates routes while preserving order', () => {
    const deduped = dedupeRoutes([
      { providerCode: 'openai', modelCode: 'gpt-4o' },
      { providerCode: 'openai', modelCode: 'gpt-4o' },
      { providerCode: 'anthropic', modelCode: 'claude-haiku-4' },
    ]);

    assert.deepEqual(deduped, [
      { providerCode: 'openai', modelCode: 'gpt-4o' },
      { providerCode: 'anthropic', modelCode: 'claude-haiku-4' },
    ]);
  });
});
