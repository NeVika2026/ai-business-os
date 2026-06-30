import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildProviderRoutes,
  collectMergedRoutes,
  loadOrganizationModelPolicy,
  resetOrganizationModelPolicies,
  resetRoutingTable,
  resolveRoutingPlan,
  setOrganizationModelPolicy,
  setRoutingTable,
} from '@/lib/ai/model-router';
import { USER_FACING_EXECUTION_ERROR } from '@/lib/ai/router-messages';
import { DEFAULT_ROUTING_TABLE } from '@/lib/ai/routing-config';
import { NoAllowedModelProviderError } from '@/services/runtime/gateway/errors';
import { filterRoutesByOrgPolicy } from '@/services/runtime/gateway/policy/filter-routes';
import type { OrganizationModelPolicy } from '@/services/runtime/gateway/policy/types';
import type { GatewayRequest } from '@/types/runtime/dto';

const ORG_ID = 'org-policy-routing';

function routerInput() {
  return {
    intent: 'implement_api',
    taskCategory: 'coding' as const,
    estimatedContextLength: 1200,
    reasoningComplexity: 'medium' as const,
    latencyTarget: 'balanced' as const,
    costTarget: 'balanced' as const,
    toolUsage: false,
    organizationId: ORG_ID,
    runId: 'run-policy',
  };
}

function buildAutoRequest(): GatewayRequest {
  return {
    scope: {
      organizationId: ORG_ID,
      userId: 'user-policy',
    },
    trace: {
      runId: 'run-policy',
      traceId: 'trace-policy',
      correlationId: 'corr-policy',
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
  };
}

function setPolicy(mode: OrganizationModelPolicy['mode'], customAllowlist?: OrganizationModelPolicy['customAllowlist']) {
  setOrganizationModelPolicy({
    organizationId: ORG_ID,
    mode,
    customAllowlist,
    updatedAt: '2026-06-29T00:00:00.000Z',
  });
}

describe('Organization policy in intelligent router', () => {
  it('defaults to auto policy when no org policy exists', () => {
    resetRoutingTable();
    resetOrganizationModelPolicies();

    const policy = loadOrganizationModelPolicy(ORG_ID);
    assert.equal(policy.mode, 'auto');

    const routes = buildProviderRoutes(buildAutoRequest());
    assert.equal(routes[0]?.providerCode, 'anthropic');
    assert.equal(routes[0]?.modelCode, 'claude-sonnet-4');
  });

  it('preserves existing routing under auto policy', () => {
    resetRoutingTable();
    resetOrganizationModelPolicies();
    setPolicy('auto');

    const before = buildProviderRoutes(buildAutoRequest());
    resetOrganizationModelPolicies();

    const after = buildProviderRoutes(buildAutoRequest());
    assert.deepEqual(after, before);
  });

  it('removes international providers under russia_only policy', () => {
    resetRoutingTable();
    resetOrganizationModelPolicies();
    setPolicy('russia_only');

    setRoutingTable({
      ...DEFAULT_ROUTING_TABLE,
      coding: [
        { providerCode: 'openai', modelCode: 'gpt-4o-mini' },
        { providerCode: 'anthropic', modelCode: 'claude-sonnet-4' },
      ],
    });

    assert.throws(() => resolveRoutingPlan(buildAutoRequest()), NoAllowedModelProviderError);

    const { routes } = collectMergedRoutes(routerInput());
    const filtered = filterRoutesByOrgPolicy(routes, loadOrganizationModelPolicy(ORG_ID));
    assert.equal(filtered.length, 0);
  });

  it('removes russian and local providers under international_only policy', () => {
    resetRoutingTable();
    resetOrganizationModelPolicies();
    setPolicy('international_only');

    setRoutingTable({
      ...DEFAULT_ROUTING_TABLE,
      coding: [
        { providerCode: 'openai', modelCode: 'gpt-4o-mini' },
        { providerCode: 'ollama', modelCode: 'llama3.2' },
        { providerCode: 'gigachat', modelCode: 'GigaChat-Pro' },
      ],
    });

    const plan = resolveRoutingPlan(buildAutoRequest());
    assert.ok(plan.routes.length > 0);
    assert.equal(
      plan.routes.some((route) => route.providerCode === 'ollama' || route.providerCode === 'gigachat'),
      false,
    );
  });

  it('keeps only local providers under local_only policy', () => {
    resetRoutingTable();
    resetOrganizationModelPolicies();
    setPolicy('local_only');

    setRoutingTable({
      ...DEFAULT_ROUTING_TABLE,
      coding: [
        { providerCode: 'openai', modelCode: 'gpt-4o-mini' },
        { providerCode: 'ollama', modelCode: 'llama3.2' },
      ],
    });

    const plan = resolveRoutingPlan(buildAutoRequest());
    assert.deepEqual(plan.routes.map((route) => route.providerCode), ['ollama']);
  });

  it('supports custom allowlist by provider', () => {
    resetRoutingTable();
    resetOrganizationModelPolicies();
    setPolicy('custom', [{ providerCode: 'openai' }]);

    setRoutingTable({
      ...DEFAULT_ROUTING_TABLE,
      coding: [
        { providerCode: 'openai', modelCode: 'gpt-4o-mini' },
        { providerCode: 'openai', modelCode: 'gpt-4o' },
        { providerCode: 'anthropic', modelCode: 'claude-sonnet-4' },
      ],
    });

    const plan = resolveRoutingPlan(buildAutoRequest());
    assert.ok(plan.routes.every((route) => route.providerCode === 'openai'));
    assert.equal(plan.routes.length, 2);
  });

  it('supports custom allowlist by provider and model', () => {
    resetRoutingTable();
    resetOrganizationModelPolicies();
    setPolicy('custom', [{ providerCode: 'openai', modelCode: 'gpt-4o-mini' }]);

    setRoutingTable({
      ...DEFAULT_ROUTING_TABLE,
      coding: [
        { providerCode: 'openai', modelCode: 'gpt-4o-mini' },
        { providerCode: 'openai', modelCode: 'gpt-4o' },
        { providerCode: 'anthropic', modelCode: 'claude-sonnet-4' },
      ],
    });

    const plan = resolveRoutingPlan(buildAutoRequest());
    assert.deepEqual(plan.routes, [{ providerCode: 'openai', modelCode: 'gpt-4o-mini' }]);
  });

  it('returns controlled error when policy removes all routes', () => {
    resetRoutingTable();
    resetOrganizationModelPolicies();
    setPolicy('custom', []);

    setRoutingTable({
      ...DEFAULT_ROUTING_TABLE,
      coding: [{ providerCode: 'openai', modelCode: 'gpt-4o-mini' }],
    });

    assert.throws(() => resolveRoutingPlan(buildAutoRequest()), (error: unknown) => {
      assert.ok(error instanceof NoAllowedModelProviderError);
      assert.equal(error.message, USER_FACING_EXECUTION_ERROR);
      assert.equal(error.message.includes('openai'), false);
      assert.equal(error.message.includes('Claude'), false);
      return true;
    });
  });
});
