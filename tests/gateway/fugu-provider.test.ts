import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  FUGU_PROVIDER_CODE,
  isFuguConfigured,
  resolveFuguConfig,
  resolveFuguDefaultModel,
} from '@/lib/ai/providers/fugu';
import { buildProviderRoutes } from '@/lib/ai/model-router';
import { resolveProviderCredentials } from '@/services/runtime/gateway/credential-resolver';
import { getAdapter } from '@/services/runtime/gateway/registry';
import { setGatewayMockMode } from '@/services/runtime/gateway/registry';
import { aiGateway } from '@/services/runtime/gateway/ai-gateway';
import type { GatewayRequest } from '@/types/runtime/dto';

function buildGatewayRequest(providerCode: string, modelCode: string): GatewayRequest {
  return {
    scope: {
      organizationId: 'org-fugu',
      userId: 'user-fugu',
    },
    trace: {
      runId: 'run-fugu',
      traceId: 'trace-fugu',
      correlationId: 'corr-fugu',
    },
    providerCode,
    modelCode,
    messages: [{ role: 'user', content: 'Hello' }],
    tools: [],
    parameters: {
      temperature: 0.2,
      maxTokens: 256,
    },
    timeoutMs: 5000,
    retryPolicy: {
      maxAttempts: 3,
      backoffMs: [500, 1000, 2000],
    },
  };
}

describe('Fugu provider config', () => {
  it('reads configuration from environment variables', () => {
    const previous = {
      key: process.env.FUGU_API_KEY,
      baseUrl: process.env.FUGU_BASE_URL,
      model: process.env.FUGU_MODEL,
    };

    process.env.FUGU_API_KEY = 'test-fugu-key';
    process.env.FUGU_BASE_URL = 'https://fugu.example.com/v1';
    process.env.FUGU_MODEL = 'fugu';

    try {
      assert.equal(isFuguConfigured(), true);
      assert.deepEqual(resolveFuguConfig(), {
        apiKey: 'test-fugu-key',
        baseUrl: 'https://fugu.example.com/v1',
        defaultModel: 'fugu',
      });
      assert.equal(resolveFuguDefaultModel(), 'fugu');
    } finally {
      process.env.FUGU_API_KEY = previous.key;
      process.env.FUGU_BASE_URL = previous.baseUrl;
      process.env.FUGU_MODEL = previous.model;
    }
  });

  it('reports unconfigured when credentials are missing', () => {
    const previous = {
      key: process.env.FUGU_API_KEY,
      baseUrl: process.env.FUGU_BASE_URL,
    };

    delete process.env.FUGU_API_KEY;
    delete process.env.FUGU_BASE_URL;

    try {
      assert.equal(isFuguConfigured(), false);
      assert.equal(resolveFuguConfig(), null);
    } finally {
      process.env.FUGU_API_KEY = previous.key;
      process.env.FUGU_BASE_URL = previous.baseUrl;
    }
  });

  it('resolves gateway credentials for fugu', () => {
    const previous = {
      key: process.env.FUGU_API_KEY,
      baseUrl: process.env.FUGU_BASE_URL,
    };

    process.env.FUGU_API_KEY = 'test-fugu-key';
    process.env.FUGU_BASE_URL = 'https://fugu.example.com/v1/';

    try {
      const credentials = resolveProviderCredentials(FUGU_PROVIDER_CODE, 'org-fugu');
      assert.equal(credentials.apiKey, 'test-fugu-key');
      assert.equal(credentials.baseUrl, 'https://fugu.example.com/v1');
    } finally {
      process.env.FUGU_API_KEY = previous.key;
      process.env.FUGU_BASE_URL = previous.baseUrl;
    }
  });
});

describe('Model router', () => {
  it('returns a single route for non-fugu providers', () => {
    const routes = buildProviderRoutes(buildGatewayRequest('openai', 'gpt-4o-mini'));
    assert.deepEqual(routes, [{ providerCode: 'openai', modelCode: 'gpt-4o-mini' }]);
  });

  it('builds fugu fallback routes when backup credentials exist', () => {
    const previous = {
      fuguKey: process.env.FUGU_API_KEY,
      fuguBase: process.env.FUGU_BASE_URL,
      anthropicKey: process.env.ANTHROPIC_API_KEY,
      openaiKey: process.env.OPENAI_API_KEY,
    };

    process.env.FUGU_API_KEY = 'fugu-key';
    process.env.FUGU_BASE_URL = 'https://fugu.example.com/v1';
    process.env.ANTHROPIC_API_KEY = 'anthropic-key';
    process.env.OPENAI_API_KEY = 'openai-key';

    try {
      const routes = buildProviderRoutes(buildGatewayRequest('fugu', 'fugu'));
      assert.deepEqual(routes, [
        { providerCode: 'fugu', modelCode: 'fugu' },
        { providerCode: 'anthropic', modelCode: 'claude-haiku-4' },
        { providerCode: 'openai', modelCode: 'gpt-4o-mini' },
      ]);
    } finally {
      process.env.FUGU_API_KEY = previous.fuguKey;
      process.env.FUGU_BASE_URL = previous.fuguBase;
      process.env.ANTHROPIC_API_KEY = previous.anthropicKey;
      process.env.OPENAI_API_KEY = previous.openaiKey;
    }
  });
});

describe('Fugu gateway integration', () => {
  it('registers the fugu adapter and completes in mock mode', async () => {
    setGatewayMockMode(true);

    const adapter = getAdapter('fugu');
    const health = await adapter.health();

    assert.equal(health.ok, true);
    assert.equal(health.providerCode, 'fugu');

    const response = await aiGateway.complete(buildGatewayRequest('fugu', 'fugu'));
    assert.match(response.content ?? '', /\[mock:fugu\]/);
    assert.equal(response.providerCode, 'fugu');
    assert.ok(response.usage.totalTokens > 0);
  });
});
