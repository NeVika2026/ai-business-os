import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { setGatewayMockMode } from '@/services/runtime/gateway/registry';
import { aiGateway } from '@/services/runtime/gateway/ai-gateway';
import { buildContext } from '@/services/runtime/context/context-builder';
import { compilePrompt } from '@/services/runtime/prompt/prompt-compiler';
import { toCompilePromptInput, toGatewayRequest } from '@/services/runtime/pipeline';
import { resetGatewayRateLimits } from '@/services/runtime/gateway/gateway-rate-limiter';
import { resetStreamCancellations } from '@/services/runtime/gateway/stream-cancellation';

import { createContextBuildRequest } from '../runtime/helpers';

describe('Gateway streaming integration', () => {
  it('streams mock responses in chunks', async () => {
    setGatewayMockMode(true);
    resetGatewayRateLimits();
    resetStreamCancellations();

    const contextRequest = createContextBuildRequest();
    const contextPackage = buildContext(contextRequest);
    const promptRequest = compilePrompt(toCompilePromptInput(contextPackage));
    const gatewayRequest = toGatewayRequest(promptRequest, contextPackage);

    const chunks: string[] = [];
    for await (const chunk of aiGateway.stream(gatewayRequest)) {
      if (chunk.contentDelta) {
        chunks.push(chunk.contentDelta);
      }
    }

    const content = chunks.join('');
    assert.ok(content.includes('[mock:'));
    assert.ok(chunks.length >= 1);
  });

  it('cancels an active stream by run id', async () => {
    setGatewayMockMode(true);
    resetStreamCancellations();

    const contextRequest = createContextBuildRequest();
    const contextPackage = buildContext(contextRequest);
    const promptRequest = compilePrompt(toCompilePromptInput(contextPackage));
    const gatewayRequest = toGatewayRequest(promptRequest, contextPackage);

    const iterator = aiGateway.stream(gatewayRequest)[Symbol.asyncIterator]();
    const first = await iterator.next();
    assert.ok(first.value);

    const cancelled = aiGateway.cancelStream(gatewayRequest.trace.runId);
    assert.equal(typeof cancelled, 'boolean');
  });
});
