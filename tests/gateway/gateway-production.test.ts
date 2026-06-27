import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { setGatewayMockMode } from '@/services/runtime/gateway/registry';
import { resolveProviderCredentials } from '@/services/runtime/gateway/credential-resolver';
import { ProviderAuthError } from '@/services/runtime/gateway/provider-errors';
import { executeWithGatewayRetry } from '@/services/runtime/gateway/gateway-retry';
import { ProviderRateLimitError } from '@/services/runtime/gateway/provider-errors';
import {
  checkGatewayRateLimit,
  resetGatewayRateLimits,
} from '@/services/runtime/gateway/gateway-rate-limiter';
import { ProviderTimeoutError } from '@/services/runtime/gateway/provider-errors';
import { ProviderError } from '@/services/runtime/gateway/provider-errors';
import { fetchWithTimeout } from '@/services/runtime/gateway/http-client';
import { aiGateway } from '@/services/runtime/gateway/ai-gateway';

import { createContextBuildRequest, TEST_ORG_ID } from '../runtime/helpers';
import { buildContext } from '@/services/runtime/context/context-builder';
import { compilePrompt } from '@/services/runtime/prompt/prompt-compiler';
import { toCompilePromptInput, toGatewayRequest } from '@/services/runtime/pipeline';

describe('Gateway credential resolver', () => {
  it('reads environment credentials for openai', () => {
    const previous = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = 'test-openai-key';

    try {
      const credentials = resolveProviderCredentials('openai', TEST_ORG_ID);
      assert.equal(credentials.apiKey, 'test-openai-key');
      assert.match(credentials.baseUrl ?? '', /api\.openai\.com/);
    } finally {
      process.env.OPENAI_API_KEY = previous;
    }
  });

  it('throws when required credentials are missing', () => {
    const previous = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      assert.throws(
        () => resolveProviderCredentials('openai', TEST_ORG_ID),
        (error: unknown) => error instanceof ProviderAuthError,
      );
    } finally {
      process.env.OPENAI_API_KEY = previous;
    }
  });
});

describe('Gateway retry policy', () => {
  it('retries retryable provider errors', async () => {
    let attempts = 0;
    const result = await executeWithGatewayRetry(async () => {
      attempts += 1;
      if (attempts < 2) {
        throw new ProviderRateLimitError('openai');
      }
      return 'ok';
    });

    assert.equal(result, 'ok');
    assert.equal(attempts, 2);
  });
});

describe('Gateway rate limiter', () => {
  it('blocks requests after the configured limit', () => {
    resetGatewayRateLimits();

    for (let index = 0; index < 120; index += 1) {
      checkGatewayRateLimit('openai', TEST_ORG_ID, { requestsPerMinute: 120 });
    }

    assert.throws(
      () => checkGatewayRateLimit('openai', TEST_ORG_ID, { requestsPerMinute: 120 }),
      (error: unknown) => error instanceof ProviderRateLimitError,
    );
  });
});

describe('Gateway timeout client', () => {
  it('maps fetch failures to provider errors', async () => {
    await assert.rejects(
      () => fetchWithTimeout('http://127.0.0.1:1', { method: 'GET' }, 50, 'openai'),
      (error: unknown) => error instanceof ProviderError || error instanceof ProviderTimeoutError,
    );
  });
});

describe('Gateway mock integration', () => {
  it('completes through mock adapters when GATEWAY_USE_MOCK=true', async () => {
    setGatewayMockMode(true);
    resetGatewayRateLimits();

    const contextRequest = createContextBuildRequest();
    const contextPackage = buildContext(contextRequest);
    const promptRequest = compilePrompt(toCompilePromptInput(contextPackage));
    const gatewayRequest = toGatewayRequest(promptRequest, contextPackage);

    const response = await aiGateway.complete(gatewayRequest);
    assert.ok(response.content.includes('[mock:'));
  });
});
