# API — AI Gateway

> **Module:** `services/runtime/gateway/`  
> **Sprint:** C1  
> **Visibility:** Internal server-only. Not exposed as public HTTP API in EPIC C.

---

## 1. Facade

```typescript
// services/runtime/gateway/gateway.ts

interface AIGateway {
  complete(request: GatewayRequest): Promise<GatewayResponse>;
  ping(providerCode: string): Promise<{ ok: boolean; latencyMs: number }>;
}

export const aiGateway: AIGateway;
```

---

## 2. complete()

### Input: `GatewayRequest`

See [DTO_SPEC.md](../architecture/DTO_SPEC.md#7-gatewayrequest).

Required fields:

| Field | Type | Notes |
|-------|------|-------|
| `scope.organizationId` | UUID | Tenant scope |
| `trace.runId` | UUID | For logging |
| `providerCode` | string | From `ai_providers.code` |
| `modelCode` | string | From `ai_models.code` |
| `messages` | PromptMessage[] | Normalized roles |
| `parameters.maxTokens` | number | Hard cap enforced |
| `timeoutMs` | number | Default 60000 |

### Output: `GatewayResponse`

| Field | Type | Notes |
|-------|------|-------|
| `content` | string \| null | Final text if no tool calls |
| `toolCalls` | ToolCall[] | Parsed tool invocations |
| `usage.inputTokens` | number | Billable input |
| `usage.outputTokens` | number | Billable output |
| `latencyMs` | number | End-to-end adapter time |
| `finishReason` | string | Provider-native mapped |
| `error` | optional | Set on failure after retries exhausted |

### Errors

Throws `GatewayError` (wraps `ProviderError`):

| Code | HTTP-like | Retryable |
|------|-----------|-----------|
| `rate_limit` | 429 | yes |
| `timeout` | 408 | yes |
| `auth_error` | 401 | no |
| `invalid_request` | 400 | no |
| `provider_error` | 5xx | yes |

---

## 3. Retry behavior

```typescript
defaultRetryPolicy = {
  maxAttempts: 3,
  backoffMs: [500, 1500, 3000],
  retryableCodes: ['rate_limit', 'timeout', 'provider_error'],
};
```

Gateway emits observability events on each retry (C6).

---

## 4. Rate limiting (C1 basic)

In-memory per-org sliding window (MVP):

```text
Key: gateway:{organizationId}
Limit: 60 requests / minute (configurable)
Exceeded: throw GatewayError('rate_limit', retryable=true)
```

Future: Redis / Supabase table — not EPIC C.

---

## 5. Credential resolution

```typescript
function resolveCredentials(providerCode: ProviderCode): ProviderCredentials {
  switch (providerCode) {
    case 'openai':
      return { apiKey: process.env.OPENAI_API_KEY };
    case 'anthropic':
      return { apiKey: process.env.ANTHROPIC_API_KEY };
    case 'google':
      return { apiKey: process.env.GOOGLE_AI_API_KEY };
    case 'groq':
      return { apiKey: process.env.GROQ_API_KEY, baseUrl: 'https://api.groq.com/openai/v1' };
    case 'openrouter':
      return { apiKey: process.env.OPENROUTER_API_KEY, baseUrl: 'https://openrouter.ai/api/v1' };
    case 'ollama':
      return { baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434' };
  }
}
```

Missing key → `auth_error` before HTTP call.

---

## 6. Usage by orchestrator

```typescript
const gatewayRequest = toGatewayRequest(promptRequest, contextPackage);
const gatewayResponse = await aiGateway.complete(gatewayRequest);

if (gatewayResponse.toolCalls.length > 0) {
  // delegate to Tool Executor — see TOOLS.md
}

if (gatewayResponse.error) {
  throw new RuntimeError('gateway_failed', gatewayResponse.error.message);
}
```

---

## 7. Mapping helpers

```typescript
// services/runtime/gateway/mappers.ts

toGatewayRequest(prompt: PromptRequest, ctx: ContextPackage): GatewayRequest;
toPromptResponse(response: GatewayResponse): PromptResponse;
```

---

## 8. Non-goals (EPIC C)

- Public REST endpoint `/api/gateway`
- Streaming / SSE
- Embeddings endpoint (knowledge uses existing pgvector queries)
- Image / audio multimodal

---

## 9. Related docs

- [PROVIDER_API.md](../architecture/PROVIDER_API.md)
- [DTO_SPEC.md](../architecture/DTO_SPEC.md)
- [TOOLS.md](./TOOLS.md)
