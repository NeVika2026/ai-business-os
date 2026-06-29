import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createEmptyConcierge } from '@/utils/home/concierge-mappers';
import { resolveHomePageLoadResult } from '@/utils/home/concierge-loader';

describe('home page concierge loader', () => {
  const context = {
    email: 'user@example.com',
    organizationName: 'Acme AI',
    userName: 'Victoria',
  };

  it('requires authentication before rendering Today', () => {
    const result = resolveHomePageLoadResult(false, createEmptyConcierge(context));

    assert.equal(result.status, 'unauthorized');
  });

  it('falls back when concierge data is unavailable for an authenticated user', () => {
    const result = resolveHomePageLoadResult(true, null);

    assert.equal(result.status, 'fallback');
  });

  it('returns concierge data when load succeeds', () => {
    const data = createEmptyConcierge(context);
    const result = resolveHomePageLoadResult(true, data);

    assert.equal(result.status, 'ok');
    assert.equal(result.status === 'ok' ? result.data.smartGreeting.userName : null, 'Victoria');
  });
});
