# Universal AI Gateway — Architecture

> **Status:** Architecture (Phase 1 — design + types, no runtime wiring)  
> **Module roots:** `services/runtime/gateway/`, `lib/ai/`  
> **ADR:** [ADR-003-universal-ai-gateway.md](./ADR/ADR-003-universal-ai-gateway.md)

---

## 1. Purpose

Universal AI Gateway is the **only execution path** from runtime to LLM providers. It guarantees:

- **Vendor independence** — no single provider is required for the product to function.
- **Opaque execution** — end users never see model or provider names.
- **Org compliance** — tenant policies constrain which backends may run.
- **Plug-in providers** — new vendors require one adapter, not UI changes.

---

## 2. Layer diagram

```text
┌──────────────────────────────────────────────────────────────────────┐
│  UI / Server Actions / Orchestrator                                   │
│  Sends: intent, messages, tools — never provider/model               │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ GatewayRequest
                                │  providerCode: "auto"
                                │  routing: { taskCategory, latency, … }
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│  UNIVERSAL AI GATEWAY (services/runtime/gateway/ai-gateway.ts)        │
│                                                                       │
│  ┌─────────────┐   ┌──────────────────┐   ┌─────────────────────┐  │
│  │ Task Router │ → │ Policy Filter    │ → │ Execution Engine    │  │
│  │ lib/ai/*    │   │ gateway/policy/* │   │ retry + fallback    │  │
│  └─────────────┘   └──────────────────┘   └──────────┬──────────┘  │
│                                                       │              │
│  Internal metrics only (UniversalGatewayExecutionMeta) │              │
└───────────────────────────────────────────────────────┼──────────────┘
                                                        ▼
                              ┌─────────────────────────────────────┐
                              │  Provider Registry                   │
                              │  getAdapter(code) → ProviderAdapter  │
                              └─────────────────┬───────────────────┘
                                                │
           ┌────────────┬───────────┬───────────┼───────────┬──────────┐
           ▼            ▼           ▼           ▼           ▼          ▼
        OpenAI      Anthropic    Gemini      Ollama     GigaChat*  YandexGPT*
        compatible  native       native      local      (planned)  (planned)
           │            │           │           │           │          │
           └────────────┴───────────┴───────────┴───────────┴──────────┘
                                    HTTP / local API

* Catalogued in provider-metadata.ts; adapter not shipped yet.
```

---

## 3. Unified Adapter Interface

Existing contract (`services/runtime/gateway/types.ts`) — **unchanged**:

```typescript
interface ProviderAdapter {
  readonly code: ProviderCode;
  complete(request: NormalizedProviderRequest): Promise<NormalizedProviderResponse>;
  stream(request: NormalizedProviderRequest): AsyncGenerator<StreamChunk>;
  health(): Promise<ProviderHealthResult>;
  capabilities(model: string): ModelCapabilities | null;
}
```

### Adapter families

| Transport | Base class / factory | Use when |
|-----------|---------------------|----------|
| `openai-compatible` | `HttpOpenAiCompatibleAdapter` | OpenAI, Groq, OpenRouter, Fugu, **GigaChat**, **YandexGPT**, custom proxies |
| `anthropic-native` | `HttpAnthropicAdapter` | Claude API |
| `gemini-native` | `HttpGeminiAdapter` | Google Gemini |
| `ollama-native` | `HttpOllamaAdapter` | Local Ollama |
| `custom` | New class implementing `ProviderAdapter` | Non-compatible APIs only |

**Rule:** Prefer `openai-compatible` for new vendors. One file per provider:

```text
services/runtime/gateway/adapters/http-gigachat-adapter.ts   (future)
lib/ai/providers/gigachat.ts                                 (optional config helper)
```

Register once in `adapter-factory.ts`. No other modules change.

---

## 4. Provider metadata catalog

`services/runtime/gateway/provider-metadata.ts` defines every known provider:

| Field | Purpose |
|-------|---------|
| `code` | Registry key |
| `jurisdiction` | `russia` \| `international` \| `local` — used by org policy filter |
| `transport` | Which adapter family to use |
| `implemented` | Whether adapter is registered today |
| `credentialEnvKeys` | Env var mapping (until tenant DB credentials ship) |

### Current catalog

| Code | Jurisdiction | Transport | Implemented |
|------|-------------|-------------|-------------|
| `openai` | international | openai-compatible | yes |
| `anthropic` | international | anthropic-native | yes |
| `gemini` | international | gemini-native | yes |
| `groq` | international | openai-compatible | yes |
| `openrouter` | international | openai-compatible | yes |
| `ollama` | local | ollama-native | yes |
| `fugu` | international | openai-compatible | yes |
| `gigachat` | russia | openai-compatible | **planned** |
| `yandexgpt` | russia | openai-compatible | **planned** |

---

## 5. Organization model policies

Types: `services/runtime/gateway/policy/types.ts`

```typescript
type OrganizationModelPolicyMode =
  | 'auto'
  | 'russia_only'
  | 'international_only'
  | 'local_only'
  | 'custom';
```

Filter: `services/runtime/gateway/policy/filter-routes.ts` → `filterRoutesByOrgPolicy()`

### Resolution flow (future wiring)

```text
organizationId from GatewayRequest.scope
  → load OrganizationModelPolicy (DB or default 'auto')
  → filter ranked routes from Task Router
  → if empty: try policy-safe global fallback chain
  → if still empty: ExecutionUnavailableError (generic message)
```

### Future persistence (not implemented)

```sql
-- organization_model_policy (proposed)
organization_id uuid primary key,
mode text not null check (mode in ('auto','russia_only',...)),
custom_allowlist jsonb,
updated_at timestamptz not null
```

Policy is **never** passed from the browser. Server loads it when building the gateway request.

---

## 6. Decision pipeline (detailed)

### Stage A — Task Router (`lib/ai/model-router.ts`)

**Inputs:** intent, task category, context length, latency/cost targets, tool usage, rolling stats.

**Output:** Ordered `ProviderRoute[]` from routing table + scoring + learning boost.

Already implemented. Uses `MODEL_ROUTING_CONFIG` env override for platform defaults.

### Stage B — Policy Filter (`gateway/policy/filter-routes.ts`)

**Inputs:** Routes from Stage A, `OrganizationModelPolicy`.

**Output:** Policy-compliant subset, order preserved.

Pure function — unit tested in `tests/gateway/org-model-policy.test.ts`.

### Stage C — Availability Filter (`lib/ai/router-scoring.ts`)

**Inputs:** Policy-filtered routes.

**Checks:** `hasModel()`, `hasProviderCredentials()`, mock mode bypass.

### Stage D — Execution (`ai-gateway.ts`)

For each route in order:

1. Same-provider retry (`executeWithGatewayRetry`, 3 attempts).
2. On eligible failure → next route (cross-provider fallback).
3. Record `UniversalGatewayExecutionMeta` (internal only).
4. Update rolling stats for learning.

User receives content or generic error — never vendor names.

---

## 7. User-facing opacity

| Surface | Rule |
|---------|------|
| In-progress UI | `USER_FACING_EXECUTION_STATUS` only — «Preparing your result…» |
| Errors | `ExecutionUnavailableError` — no provider in message |
| GatewayResponse to UI | Strip or map `providerCode`/`modelCode` before result pages (future hardening) |
| Diagnostics / admin | May show internals — not end-user flows |

Runtime pipeline already sends `auto`. Result DTOs may still carry internal codes — Phase 2 will add a presentation mapper.

---

## 8. Adding a new provider (playbook)

Example: **GigaChat**

1. **Metadata** — already in `provider-metadata.ts` (`jurisdiction: russia`).
2. **Adapter** — `HttpOpenAiCompatibleAdapter('gigachat')` or validate against real API; or dedicated adapter if auth differs (OAuth).
3. **Extend `ProviderCode`** union + `PROVIDER_CODES` array.
4. **Credentials** — `GIGACHAT_API_KEY`, `GIGACHAT_BASE_URL` in `credential-resolver.ts`.
5. **Capabilities / pricing JSON** — model codes exposed by Sber API.
6. **Routing table** — add routes for relevant task categories (e.g. `business_strategy` → gigachat for RU orgs).
7. **Tests** — adapter health mock, policy filter includes gigachat in `russia_only`.

**Zero UI files touched.**

---

## 9. OpenAI-compatible custom APIs

Any vendor exposing `/v1/chat/completions` (or compatible variant):

```typescript
// adapter-factory.ts (future pattern)
custom_proxy: new HttpOpenAiCompatibleAdapter('custom_proxy'),
```

With env:

```env
CUSTOM_PROXY_API_KEY=
CUSTOM_PROXY_BASE_URL=https://internal-llm.company.ru/v1
```

Metadata entry with `jurisdiction: 'local'` or `'russia'` as appropriate.

---

## 10. File map

| Path | Role |
|------|------|
| `services/runtime/gateway/ai-gateway.ts` | Execution entry — wraps model router |
| `services/runtime/gateway/types.ts` | `ProviderAdapter`, DTO re-exports |
| `services/runtime/gateway/registry.ts` | Adapter singleton map |
| `services/runtime/gateway/adapter-factory.ts` | Production + mock adapter wiring |
| `services/runtime/gateway/provider-metadata.ts` | Jurisdiction + transport catalog |
| `services/runtime/gateway/policy/types.ts` | Org policy + internal execution meta |
| `services/runtime/gateway/policy/filter-routes.ts` | Pure policy filter |
| `lib/ai/model-router.ts` | Task routing orchestration |
| `lib/ai/routing-config.ts` | Default routing table |
| `lib/ai/router-scoring.ts` | Scoring + availability |
| `lib/ai/router-metrics.ts` | Internal metrics |
| `services/runtime/pipeline.ts` | Builds `auto` gateway requests |

---

## 11. Implementation phases

| Phase | Scope | Status |
|-------|-------|--------|
| **0** | Architecture doc + policy types + metadata catalog | **This document** |
| **1** | Wire `filterRoutesByOrgPolicy` into `resolveRoutingPlan` | Pending |
| **2** | DB-backed org policy + tenant credentials | Pending |
| **3** | GigaChat + YandexGPT adapters | Pending |
| **4** | Strip provider/model from user-facing result DTOs | Pending |

Phases 1–4 must not break existing tests; feature-flag policy filter defaulting to `auto` preserves current behavior.

---

## 12. Testing strategy

| Layer | Test file |
|-------|-----------|
| Policy filter | `tests/gateway/org-model-policy.test.ts` |
| Task router | `tests/ai/intelligent-router.test.ts` |
| Adapters | `tests/gateway/fugu-provider.test.ts`, gateway production tests |
| End-to-end | Runtime pipeline smoke — must keep passing with `auto` |

---

## 13. Related documents

- [GATEWAY.md](../api/GATEWAY.md) — API reference
- [PROVIDER_API.md](./PROVIDER_API.md) — adapter contract (v1, pre-Fugu)
- [AI_RUNTIME.md](./AI_RUNTIME.md) — full runtime layering
- [REASONING_ARCHITECTURE.md](./REASONING_ARCHITECTURE.md) — task intelligence above gateway
