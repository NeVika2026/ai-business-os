import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createRuntimeBridge } from '@/services/runtime/runtime-bridge';
import { createRuntimeGatewayAdapter } from '@/services/runtime/runtime-gateway-adapter';
import { buildContext } from '@/services/runtime/context/context-builder';
import { toGatewayRequest } from '@/services/runtime/pipeline';
import { toCompilePromptInput } from '@/services/runtime/pipeline';

import { createContextBuildRequest } from './helpers';

describe('Runtime gateway adapter integration', () => {
  it('lists models, completes mock requests, serializes, and resets', async () => {
    const bridge = createRuntimeBridge({
      instanceId: 'runtime-gateway-bridge',
      orchestrationOnly: true,
    });

    const gateway = bridge.getGatewayAdapter();
    const standalone = createRuntimeGatewayAdapter();

    const bridgeModels = await gateway.models();
    assert.ok(bridgeModels.models.length > 0);
    assert.ok(bridgeModels.models.every((entry) => entry.id !== null));
    assert.ok(bridgeModels.models.every((entry) => entry.modelCode.length > 0));

    const standaloneModels = await standalone.models();
    assert.ok(standaloneModels.models.length > 0);

    const contextRequest = createContextBuildRequest();
    const contextPackage = buildContext(contextRequest);
    const compileInput = toCompilePromptInput(contextPackage);
    const compiledPrompt = bridge.getPromptAdapter().compile(compileInput);
    const gatewayRequest = toGatewayRequest(compiledPrompt, contextPackage);

    const response = await gateway.complete(gatewayRequest);
    assert.equal(response.error, undefined);
    assert.ok(response.content.length > 0);
    assert.ok(response.usage.inputTokens >= 0);

    const snapshot = gateway.serialize();
    assert.ok(snapshot.lastOperation === 'complete' || snapshot.lastOperation === 'models');
    assert.ok(snapshot.updatedAt);

    gateway.reset();
    const resetSnapshot = gateway.serialize();
    assert.equal(resetSnapshot.lastOperation, null);
    assert.equal(resetSnapshot.lastRunId, null);

    standalone.reset();
  });
});
