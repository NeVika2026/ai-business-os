import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getAdapter } from '@/services/runtime/gateway/registry';
import { setGatewayMockMode } from '@/services/runtime/gateway/registry';

describe('Mock gateway adapter streaming', () => {
  it('streams content in multiple chunks from mock adapters', async () => {
    setGatewayMockMode(true);
    const adapter = getAdapter('openai');
    const chunks: string[] = [];

    for await (const chunk of adapter.stream({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'stream test message' }],
      temperature: 0.2,
      maxTokens: 100,
      timeoutMs: 5000,
      credentials: {},
    })) {
      if (chunk.contentDelta) {
        chunks.push(chunk.contentDelta);
      }
    }

    assert.ok(chunks.length >= 1);
    assert.ok(chunks.join('').includes('[mock:openai]'));
  });
});
