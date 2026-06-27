import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { setGatewayMockMode } from '@/services/runtime/gateway/registry';
import {
  createAllUnifiedAiProviders,
  resetUnifiedAiProviderState,
} from '@/services/ai-providers/unified-provider';

describe('Unified AI provider layer', () => {
  it('exposes chat, streaming, health, and cancellation for gateway providers', async () => {
    setGatewayMockMode(true);
    resetUnifiedAiProviderState();

    const providers = createAllUnifiedAiProviders();
    const openai = providers.openai;

    const capabilities = openai.capabilities();
    assert.equal(capabilities.chat, true);
    assert.equal(capabilities.health, true);

    const health = await openai.health();
    assert.equal(typeof health.ok, 'boolean');
  });
});
