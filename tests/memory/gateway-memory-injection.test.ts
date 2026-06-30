import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import {
  applyGatewayMemoryInjection,
  captureGatewayMemoryFromResponse,
} from '@/lib/memory/gateway-memory';
import { captureGatewayMemory, findMemory, resetMemoryStore } from '@/lib/memory/memory-engine';
import { resetExecutiveState } from '@/lib/executive/executive-state';
import { resetProjectRuntimeStore } from '@/lib/project-runtime/project-runtime-store';
import { ensureProject } from '@/lib/memory/memory-projects';
import { setGatewayMockMode } from '@/services/runtime/gateway/registry';
import { resetGatewayRateLimits } from '@/services/runtime/gateway/gateway-rate-limiter';
import { aiGateway } from '@/services/runtime/gateway/ai-gateway';
import type { GatewayRequest } from '@/types/runtime/dto';

function buildGatewayRequest(overrides: Partial<GatewayRequest> = {}): GatewayRequest {
  return {
    scope: {
      organizationId: 'org-memory-test',
      userId: 'user-memory-test',
    },
    trace: {
      runId: crypto.randomUUID(),
      traceId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
    },
    providerCode: 'auto',
    modelCode: 'auto',
    messages: [
      {
        role: 'user',
        content: 'Подготовить план запуска продукта',
      },
    ],
    tools: [],
    parameters: {
      temperature: 0.3,
      maxTokens: 256,
    },
    timeoutMs: 30_000,
    retryPolicy: {
      maxAttempts: 1,
      backoffMs: [100],
    },
    routing: {
      intent: 'product_launch',
      taskCategory: 'planning',
      reasoningComplexity: 'medium',
      latencyTarget: 'balanced',
      costTarget: 'balanced',
      toolUsage: false,
    },
    ...overrides,
  };
}

describe('OSA Gateway Memory Injection', () => {
  beforeEach(() => {
    resetMemoryStore();
    resetProjectRuntimeStore();
    resetExecutiveState();
    resetGatewayRateLimits();
    setGatewayMockMode(true);
  });

  it('does not change request when memory is empty', () => {
    const request = buildGatewayRequest();
    const injected = applyGatewayMemoryInjection(request);

    assert.equal(injected.messages.length, request.messages.length);
    assert.deepEqual(injected.messages, request.messages);
  });

  it('injects a system context message when memory exists', () => {
    captureGatewayMemory({
      task: 'Создать Navigator',
      result: 'Navigator готов',
      intent: 'navigator',
      routingCategory: 'planning',
      organizationId: 'org-memory-test',
      userId: 'user-memory-test',
    });

    const request = buildGatewayRequest();
    const injected = applyGatewayMemoryInjection(request);

    assert.equal(injected.messages.length, request.messages.length + 1);
    assert.equal(injected.messages[0]?.role, 'system');
    assert.match(injected.messages[0]?.content ?? '', /Context/);
    assert.match(injected.messages[0]?.content ?? '', /Recent Progress:/);
    assert.match(injected.messages[0]?.content ?? '', /Continue from previous work\./);
  });

  it('uses project memory when projectId is set', () => {
    const project = ensureProject({
      organizationId: 'org-memory-test',
      name: 'AI Business OS',
      userId: 'user-memory-test',
    });

    captureGatewayMemory({
      task: 'Задача в другом проекте',
      result: 'Не должно попасть в контекст',
      intent: 'other_project',
      routingCategory: 'planning',
      organizationId: 'org-memory-test',
      userId: 'user-memory-test',
      projectName: 'Other Project',
    });

    captureGatewayMemory({
      task: 'Подключить Memory Injection',
      result: 'Injection готов',
      intent: 'memory_injection',
      routingCategory: 'planning',
      organizationId: 'org-memory-test',
      userId: 'user-memory-test',
      projectId: project.id,
    });

    const injected = applyGatewayMemoryInjection(
      buildGatewayRequest({
        scope: {
          organizationId: 'org-memory-test',
          userId: 'user-memory-test',
          projectId: project.id,
        },
      }),
    );

    const systemContent = injected.messages[0]?.content ?? '';
    assert.match(systemContent, /AI Business OS/);
    assert.match(systemContent, /Memory Injection/);
    assert.doesNotMatch(systemContent, /другом проекте/);
  });

  it('captures memory after gateway response', () => {
    const request = buildGatewayRequest();
    const response = {
      trace: request.trace,
      providerCode: 'openai',
      modelCode: 'gpt-4o-mini',
      content: '1. Запуск\n2. Продвижение\n3. Анализ',
      toolCalls: [],
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
      latencyMs: 12,
      finishReason: 'stop',
    };

    const entry = captureGatewayMemoryFromResponse(request, response);

    assert.ok(entry);
    assert.equal(entry?.task, 'Подготовить план запуска продукта');
    assert.equal(entry?.result, response.content);
    assert.equal(entry?.intent, 'product_launch');
    assert.equal(entry?.routingCategory, 'planning');
    assert.equal(entry?.runId, request.trace.runId);
    assert.equal(entry?.correlationId, request.trace.correlationId);
  });

  it('completes through gateway without regression when memory is empty', async () => {
    const request = buildGatewayRequest();
    const response = await aiGateway.complete(request);

    assert.ok(response.content?.includes('[mock:'));
    assert.equal(findMemory({ organizationId: 'org-memory-test' }).length, 1);
  });

  it('injects memory and captures new entry on subsequent gateway complete', async () => {
    captureGatewayMemory({
      task: 'Создать Memory Engine',
      result: 'Foundation готов',
      intent: 'memory_foundation',
      routingCategory: 'planning',
      organizationId: 'org-memory-test',
      userId: 'user-memory-test',
    });

    const firstRequest = buildGatewayRequest({
      messages: [{ role: 'user', content: 'Продолжить разработку Runtime' }],
    });

    const injected = applyGatewayMemoryInjection(firstRequest);
    assert.equal(injected.messages[0]?.role, 'system');

    const firstResponse = await aiGateway.complete(firstRequest);
    assert.ok(firstResponse.content);

    const entries = findMemory({ organizationId: 'org-memory-test' });
    assert.ok(entries.length >= 2);
  });
});
