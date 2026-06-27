# AI Runtime — Provider Adapter API

> **Version:** 1.0.0  
> **Sprint:** C1 (AI Gateway + Provider Adapters)  
> **Location:** `services/runtime/providers/`

---

## 1. Design principle

All LLM providers implement **one interface**. AI Gateway is the only caller of adapters.

```text
Prompt Compiler → GatewayRequest
AI Gateway      → ProviderAdapter.complete()
Provider Adapter → native SDK / HTTP
                → GatewayResponse
```

No other module imports `@anthropic-ai/sdk`, `openai`, etc.

---

## 2. ProviderAdapter interface

```typescript
interface ProviderAdapter {
  /** Must match ai_providers.code */
  readonly code: ProviderCode;

  /** Health check for observability dashboard */
  ping(): Promise<{ ok: boolean; latencyMs: number }>;

  /**
   * Single completion call (including tool calls in response).
   * Gateway handles retries; adapter throws ProviderError on failure.
   */
  complete(request: NormalizedProviderRequest): Promise<NormalizedProviderResponse>;
}

type ProviderCode =
  | 'openai'
  | 'anthropic'
  | 'google'      // Gemini
  | 'groq'
  | 'openrouter'
  | 'ollama';
```

---

## 3. Normalized request (adapter input)

Gateway converts `GatewayRequest` → `NormalizedProviderRequest`:

```typescript
interface NormalizedProviderRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    toolCallId?: string;
    name?: string;
  }>;
  tools?: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
  temperature: number;
  maxTokens: number;
  topP?: number;
  timeoutMs: number;
  /** Injected by gateway — adapter must not read env directly in tests */
  credentials: ProviderCredentials;
}

interface ProviderCredentials {
  apiKey?: string;
  baseUrl?: string;       // Ollama, OpenRouter custom
  extraHeaders?: Record<string, string>;
}
```

---

## 4. Normalized response (adapter output)

```typescript
interface NormalizedProviderResponse {
  content: string | null;
  toolCalls: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  finishReason: string;
  providerRequestId?: string;
  latencyMs: number;
  raw?: unknown;          // stripped before persist; debug only
}
```

Gateway maps this → `GatewayResponse` (adds trace, scope).

---

## 5. Provider registry

```typescript
// services/runtime/gateway/provider-registry.ts

const adapters: Record<ProviderCode, ProviderAdapter> = {
  openai: openAiAdapter,
  anthropic: anthropicAdapter,
  google: geminiAdapter,
  groq: groqAdapter,
  openrouter: openRouterAdapter,
  ollama: ollamaAdapter,
};

function getAdapter(code: string): ProviderAdapter {
  const adapter = adapters[code as ProviderCode];
  if (!adapter) throw new ProviderError('unsupported_provider', code);
  return adapter;
}
```

Mapping from DB:

```text
ai_employees.provider_id → ai_providers.code → adapter
ai_employees.model_id    → ai_models.code    → model string in request
```

---

## 6. Provider-specific notes

### 6.1 OpenAI (`openai`)

- API: Chat Completions / Responses (use Chat Completions for C1 MVP)
- Tools: `tools` + `tool_choice: auto`
- Env: `OPENAI_API_KEY`
- Tool call parsing: `choices[0].message.tool_calls`

### 6.2 Anthropic (`anthropic`)

- API: Messages API
- System message: separate `system` param, not in messages array
- Tools: `tools` array with `input_schema`
- Env: `ANTHROPIC_API_KEY`

### 6.3 Gemini (`google`)

- API: Google AI `generateContent`
- Tools: `functionDeclarations`
- Env: `GOOGLE_AI_API_KEY`
- Maps to `ai_providers.code = 'google'`

### 6.4 Groq (`groq`)

- OpenAI-compatible API
- Reuse OpenAI adapter with `baseUrl: https://api.groq.com/openai/v1`
- Env: `GROQ_API_KEY`

### 6.5 OpenRouter (`openrouter`)

- OpenAI-compatible API
- `baseUrl: https://openrouter.ai/api/v1`
- Model code: `{provider}/{model}` format in `ai_models.code`
- Env: `OPENROUTER_API_KEY`

### 6.6 Ollama (`ollama`)

- Local HTTP: `{OLLAMA_BASE_URL}/api/chat`
- No API key; `credentials.baseUrl` required
- Default model from `ai_models.code`
- For dev / self-hosted only in MVP

---

## 7. Error type

```typescript
class ProviderError extends Error {
  constructor(
    public readonly code: ProviderErrorCode,
    message: string,
    public readonly retryable: boolean,
    public readonly statusCode?: number,
    public readonly providerRequestId?: string,
  ) {}
}

type ProviderErrorCode =
  | 'rate_limit'
  | 'timeout'
  | 'auth_error'
  | 'invalid_request'
  | 'content_filter'
  | 'provider_error'
  | 'unsupported_provider';
```

Gateway catches `ProviderError` and applies retry policy.

---

## 8. Gateway responsibilities (not adapter)

| Concern | Owner |
|---------|-------|
| Retry / backoff | AI Gateway |
| Rate limiting per org | AI Gateway |
| Timeout enforcement | AI Gateway |
| Credential loading | AI Gateway |
| Token/cost aggregation | AI Gateway + Observability |
| Request/response logging | AI Gateway (sanitized) |
| Provider selection | AI Gateway (from ContextPackage) |

Adapters are **thin translators**.

---

## 9. Testing strategy

Each adapter gets:

```text
services/runtime/providers/__tests__/openai.test.ts
```

- Mock HTTP / SDK
- Fixture: normalized request → expected normalized response
- No live API calls in CI

Integration tests (manual): `scripts/runtime-smoke.ts` behind env flag.

---

## 10. Adding a new provider

1. Add row to `ai_providers` + `ai_models` (seed/migration — outside EPIC C code)
2. Implement `ProviderAdapter`
3. Register in `provider-registry.ts`
4. Add env var to `.env.example`
5. Document in this file
6. No changes to Prompt Compiler or Tool Executor

---

## 11. HTTP client rule

Use native `fetch` only (no new libraries per project rules). SDK wrappers allowed only if already in project — **currently none**; use raw HTTP for C1.

If SDK becomes necessary later: requires explicit approval + ADR.
