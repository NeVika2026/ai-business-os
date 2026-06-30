/**
 * One-off diagnostic — do not import in app code.
 * Run: npx tsx scripts/diagnose-first-plan.mjs
 */
import { readFileSync } from 'node:fs';

for (const line of readFileSync('.env', 'utf8').split('\n')) {
  const trimmedLine = line.trim();
  if (!trimmedLine || trimmedLine.startsWith('#')) continue;
  const eq = trimmedLine.indexOf('=');
  if (eq === -1) continue;
  const key = trimmedLine.slice(0, eq);
  const value = trimmedLine.slice(eq + 1);
  if (!process.env[key]) process.env[key] = value;
}

const trimmed = 'Хочу увеличить продажи новостроек';

const request = {
  scope: { organizationId: 'org-login-preview', userId: 'user-login-preview' },
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
      content: `Ты — член моей команды в AI Business OS. Помоги мне сделать первый шаг.\n\nМоя задача:\n\"${trimmed}\"\n\nОтветь коротким планом действий в 4–6 пунктов, на русском языке, без технических терминов и без ссылок на модели ИИ.`,
    },
  ],
  tools: [],
  parameters: { temperature: 0.3, maxTokens: 512 },
  timeoutMs: 30_000,
  retryPolicy: { maxAttempts: 3, backoffMs: [500, 1000, 2000] },
  routing: {
    intent: 'login_first_result',
    taskCategory: 'planning',
    estimatedContextLength: trimmed.length,
    reasoningComplexity: 'medium',
    latencyTarget: 'balanced',
    costTarget: 'balanced',
    toolUsage: false,
  },
};

console.log('=== ENV ===');
console.log('GATEWAY_USE_MOCK:', process.env.GATEWAY_USE_MOCK ?? '(unset)');
for (const key of [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GOOGLE_AI_API_KEY',
  'FUGU_API_KEY',
  'FUGU_BASE_URL',
  'GROQ_API_KEY',
  'OLLAMA_BASE_URL',
]) {
  const v = process.env[key];
  console.log(`${key}:`, v ? `${v.slice(0, 4)}...` : '(unset)');
}

const { resolveRoutingPlan } = await import('../lib/ai/model-router.ts');
const { hasProviderCredentials } = await import(
  '../services/runtime/gateway/credential-resolver.ts'
);
const { collectMergedRoutes } = await import('../lib/ai/router-scoring.ts');
const { loadOrganizationModelPolicy } = await import(
  '../services/runtime/gateway/policy/load-policy.ts'
);
const { buildRouterInputFromGatewayRequest } = await import('../lib/ai/routing-context.ts');
const { aiGateway } = await import('../services/runtime/gateway/ai-gateway.ts');
const { getAdapter } = await import('../services/runtime/gateway/registry.ts');
const { isGatewayMockMode } = await import('../services/runtime/gateway/adapter-factory.ts');

console.log('\n=== GATEWAY REQUEST ===');
console.log(JSON.stringify(request, null, 2));

const input = buildRouterInputFromGatewayRequest(request);
const policy = loadOrganizationModelPolicy(input.organizationId);
const merged = collectMergedRoutes(input);
let plan;

try {
  plan = resolveRoutingPlan(request);
} catch (routingError) {
  console.log('\n=== ROUTING PLAN ERROR ===');
  console.log(routingError);
  if (routingError instanceof Error) {
    console.log('name:', routingError.name);
    console.log('message:', routingError.message);
    console.log('stack:', routingError.stack);
  }
  process.exit(1);
}

console.log('\n=== ROUTING PLAN ===');
console.log('profile:', plan.profile);
console.log('policy:', policy.mode);
console.log('merged routes (before availability):', merged.routes);
console.log(
  'credential check per merged route:',
  merged.routes.map((r) => ({
    ...r,
    hasCredentials: hasProviderCredentials(r.providerCode),
  })),
);
console.log('final ranked routes:', plan.routes);
console.log('isGatewayMockMode:', isGatewayMockMode());

if (plan.routes.length > 0) {
  const first = plan.routes[0];
  console.log('\n=== FIRST ROUTE ADAPTER ===');
  console.log('provider:', first.providerCode, 'model:', first.modelCode);
  const adapter = getAdapter(first.providerCode);
  console.log('adapter code:', adapter.code);
  const health = await adapter.health();
  console.log('adapter health:', health);
}

console.log('\n=== GATEWAY COMPLETE ===');
try {
  const response = await aiGateway.complete(request);
  console.log('SUCCESS');
  console.log('resolved provider:', response.providerCode);
  console.log('resolved model:', response.modelCode);
  console.log('content length:', (response.content ?? '').length);
  console.log('content preview:', (response.content ?? '').slice(0, 200));
} catch (error) {
  console.log('FAILED');
  console.log('error type:', error?.constructor?.name);
  console.log('error message:', error?.message);
  if (error?.stack) {
    console.log('\n=== FULL STACK TRACE ===');
    console.log(error.stack);
  }
  if (error?.cause) {
    console.log('cause:', error.cause);
  }
}
