# ADR-003: Universal AI Gateway

> **Status:** Accepted (architecture phase)  
> **Date:** 2026-06-29  
> **Supersedes:** Partial overlap with intelligent router (Phase 1) — this ADR formalizes the full gateway contract.

---

## Context

AI Business OS must:

1. Never depend on a single AI vendor.
2. Route all execution through one gateway decision point.
3. Hide provider/model names from end users.
4. Support organization policies (Auto, Russia-only, International-only, Local-only, Custom allowlist).
5. Onboard new providers (GigaChat, YandexGPT, Ollama, OpenAI-compatible APIs) by adding one adapter file.

Current state (2026-06-29):

- `ProviderAdapter` interface and registry exist (`services/runtime/gateway/`).
- Intelligent task router exists (`lib/ai/model-router.ts`) with configurable routing table.
- Pipeline sends `providerCode: 'auto'` — user-facing flows already avoid manual model pickers.
- Organization policies and Russian providers are **not wired** yet.
- Admin UI still shows catalog provider/model names — out of scope for this ADR (runtime opacity only).

---

## Decision

Formalize **Universal AI Gateway** as a three-stage pipeline inside the existing gateway entry point:

```text
GatewayRequest (auto + routing hints)
  → 1. Task Router      (lib/ai/*)           — what kind of work?
  → 2. Policy Filter    (gateway/policy/*)   — what is org allowed to use?
  → 3. Execution Engine (ai-gateway.ts)       — retry, fallback, metrics
       → ProviderAdapter (one per vendor)
```

### Hard rules

| Rule | Enforcement |
|------|-------------|
| Only Gateway selects models | Pipeline never sends explicit provider/model in production |
| Only Gateway calls adapters | ADR-001 boundary preserved |
| Policies resolved server-side | `OrganizationModelPolicy` loaded from org settings, never from client |
| User-facing errors are generic | `ExecutionUnavailableError`, no vendor names |
| New provider = adapter + metadata + capabilities JSON | No UI changes |

### Organization policy modes

| Mode | Russian label (admin) | Filter |
|------|----------------------|--------|
| `auto` | Авто | No jurisdiction filter |
| `russia_only` | Только российские модели | `jurisdiction === 'russia'` |
| `international_only` | Только международные | `jurisdiction === 'international'` |
| `local_only` | Только локальные | `jurisdiction === 'local'` |
| `custom` | Пользовательский список | Explicit `{ providerCode, modelCode? }[]` |

Policy filter runs **after** task routing, **before** credential/capability checks.

### Adapter onboarding checklist

1. Implement `ProviderAdapter` (or reuse `HttpOpenAiCompatibleAdapter` for OpenAI-compatible APIs).
2. Register in `adapter-factory.ts`.
3. Add entry to `provider-metadata.ts` (jurisdiction + transport).
4. Add models to `model-capabilities.json` and `model-pricing.json`.
5. Add credential env keys to `credential-resolver.ts`.
6. Optionally add routes to `routing-config.ts` default table.

GigaChat and YandexGPT are catalogued in metadata as `implemented: false` until adapters ship.

---

## Consequences

### Positive

- Single extension point for vendors and org compliance.
- Task routing and compliance routing stay orthogonal and testable in isolation.
- OpenAI-compatible transport covers most future Russian and self-hosted providers.

### Negative / deferred

- DB table for org policy (`organization_model_policy`) not created in architecture phase.
- `ProviderCode` union grows when GigaChat/YandexGPT adapters land — typed migration required.
- Admin employee provider pickers remain until separate UI ADR.

### Non-goals (this phase)

- No runtime wiring of policy filter into `model-router.ts`.
- No UI for policy configuration.
- No new HTTP adapters beyond metadata stubs.

---

## References

- [UNIVERSAL_AI_GATEWAY.md](../UNIVERSAL_AI_GATEWAY.md) — full design
- [ADR-001](./ADR-001-ai-runtime-layering.md) — runtime boundaries
- [GATEWAY.md](../../api/GATEWAY.md) — API surface
