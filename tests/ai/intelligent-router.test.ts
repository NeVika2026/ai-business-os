import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildProviderRoutes,
  classifyTaskCategory,
  getRouterMetrics,
  rankProviderRoutes,
  resetRouterMetrics,
  resetRouterStats,
  resetRoutingTable,
  resolveRoutingProfileForInput,
  setRoutingTable,
} from '@/lib/ai/model-router';
import { getLearningBoost, recordRouterOutcome } from '@/lib/ai/router-stats';
import { DEFAULT_ROUTING_TABLE } from '@/lib/ai/routing-config';
import type { GatewayRequest } from '@/types/runtime/dto';

function buildAutoRequest(overrides: Partial<GatewayRequest> = {}): GatewayRequest {
  return {
    scope: {
      organizationId: 'org-router',
      userId: 'user-router',
    },
    trace: {
      runId: 'run-router',
      traceId: 'trace-router',
      correlationId: 'corr-router',
    },
    providerCode: 'auto',
    modelCode: 'auto',
    messages: [{ role: 'user', content: 'Implement a TypeScript API endpoint' }],
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
    routing: {
      intent: 'implement_api',
      taskCategory: 'coding',
      estimatedContextLength: 1200,
      reasoningComplexity: 'medium',
      latencyTarget: 'balanced',
      costTarget: 'balanced',
      toolUsage: false,
    },
    ...overrides,
  };
}

describe('Intelligent model router', () => {
  it('classifies task categories deterministically', () => {
    assert.equal(classifyTaskCategory('implement_api', 'debug typescript endpoint'), 'coding');
    assert.equal(classifyTaskCategory('find_clients', 'client acquisition plan'), 'business_strategy');
    assert.equal(classifyTaskCategory('write_newsletter', 'draft marketing copy'), 'writing');
  });

  it('routes coding tasks to anthropic by default', () => {
    resetRoutingTable();

    const plan = rankProviderRoutes({
      intent: 'implement_api',
      taskCategory: 'coding',
      estimatedContextLength: 1200,
      reasoningComplexity: 'medium',
      latencyTarget: 'balanced',
      costTarget: 'balanced',
      toolUsage: false,
      organizationId: 'org-router',
      runId: 'run-router',
    });

    assert.equal(plan.profile, 'coding');
    assert.equal(plan.routes[0]?.providerCode, 'anthropic');
    assert.equal(plan.routes[0]?.modelCode, 'claude-sonnet-4');
  });

  it('routes long documents to gemini', () => {
    resetRoutingTable();

    const profile = resolveRoutingProfileForInput({
      intent: 'summarize_report',
      taskCategory: 'summarization',
      estimatedContextLength: 40_000,
      reasoningComplexity: 'low',
      latencyTarget: 'balanced',
      costTarget: 'balanced',
      toolUsage: false,
      organizationId: 'org-router',
      runId: 'run-router',
    });

    assert.equal(profile, 'long_document');

    const plan = rankProviderRoutes({
      intent: 'summarize_report',
      taskCategory: 'summarization',
      estimatedContextLength: 40_000,
      reasoningComplexity: 'low',
      latencyTarget: 'balanced',
      costTarget: 'balanced',
      toolUsage: false,
      organizationId: 'org-router',
      runId: 'run-router',
    });

    assert.equal(plan.routes[0]?.providerCode, 'gemini');
  });

  it('uses configurable routing table overrides', () => {
    resetRoutingTable();
    setRoutingTable({
      ...DEFAULT_ROUTING_TABLE,
      coding: [{ providerCode: 'openai', modelCode: 'gpt-4o-mini' }],
    });

    const routes = buildProviderRoutes(buildAutoRequest());
    assert.equal(routes[0]?.providerCode, 'openai');
    assert.equal(routes[0]?.modelCode, 'gpt-4o-mini');
  });

  it('records internal router metrics without exposing provider names to callers', () => {
    resetRouterMetrics();
    resetRouterStats();

    const routes = buildProviderRoutes(buildAutoRequest());
    assert.ok(routes.length > 0);

    const metrics = getRouterMetrics();
    assert.equal(metrics.length, 0);
  });

  it('keeps legacy single-route behavior for explicit providers', () => {
    const routes = buildProviderRoutes({
      ...buildAutoRequest(),
      providerCode: 'openai',
      modelCode: 'gpt-4o-mini',
      routing: undefined,
    });

    assert.deepEqual(routes, [{ providerCode: 'openai', modelCode: 'gpt-4o-mini' }]);
  });

  it('boosts providers with stronger rolling performance', () => {
    resetRoutingTable();
    resetRouterStats();

    const route = { providerCode: 'openai' as const, modelCode: 'gpt-4o-mini' };

    for (let attempt = 0; attempt < 6; attempt += 1) {
      recordRouterOutcome({
        taskCategory: 'coding',
        route,
        success: attempt < 5,
        latencyMs: 800,
        estimatedCost: 0.001,
      });
    }

    const boost = getLearningBoost('coding', route);
    assert.ok(boost > 0);
  });
});
