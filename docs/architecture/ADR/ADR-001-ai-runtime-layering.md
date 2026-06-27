# ADR-001: AI Runtime Layering

> **Status:** Accepted  
> **Date:** 2026-06-27  
> **Epic:** C — AI Runtime  
> **Deciders:** Architecture freeze before C1–C6 implementation

---

## Context

AI Business OS has:

- `ai_employees` with provider/model config, tools, memory settings (B5)
- Simulated orchestrator writing to `agent_runs` + `events` (B6)
- Knowledge Hub with chunks for RAG (B4)
- Global provider catalog `ai_providers` / `ai_models` (A3)

We need a real LLM execution pipeline without:

- Provider SDKs scattered across UI and actions
- Knowledge injected into system prompts (injection risk)
- Side effects bypassing audit
- Cross-tenant leaks

---

## Decision

Implement AI Runtime as **layered services** under `services/runtime/` with strict DTO boundaries (see [DTO_SPEC.md](../DTO_SPEC.md)).

### Layer diagram

```text
┌─────────────────────────────────────────────────────────┐
│  Boundary: Server Action / API (auth + org scope)        │
└───────────────────────────┬─────────────────────────────┘
                            │ AgentExecution
┌───────────────────────────▼─────────────────────────────┐
│  Orchestrator                                            │
└───┬─────────┬──────────┬──────────┬──────────┬──────────┘
    │         │          │          │          │
    ▼         ▼          ▼          ▼          ▼
 Context   Memory    Prompt     Gateway    Tool
 Builder   Manager   Compiler              Executor
    │         │          │          │          │
    └────┬────┘          │          │          │
         ▼               ▼          ▼          ▼
    Knowledge        PromptRequest  Provider  Side effects
    Retrieval                     Adapters   + audit
```

### Hard boundaries

1. **Only Gateway talks to providers.**
2. **Only Tool Executor performs side effects.**
3. **Prompt Compiler is pure** (no DB, no fetch).
4. **Context Builder is provider-agnostic.**
5. **Knowledge and memory never enter system prompt role.**

---

## Alternatives considered

### A. Monolithic `executeAgent` with inline OpenAI calls

**Rejected.** Provider lock-in, untestable, no tool audit, security boundaries blur.

### B. Direct provider calls from `ai_employees` config in UI

**Rejected.** Violates tenant safety and makes observability impossible.

### C. External orchestration service (separate microservice)

**Deferred.** Premature for current scale. Next.js server + `services/runtime/` sufficient for C1–C6.

### D. LangChain / Vercel AI SDK

**Rejected.** Project rule: no new libraries without necessity. Native fetch + thin adapters preferred.

---

## Consequences

### Positive

- C1–C6 can be implemented independently with clear interfaces
- Provider swap requires adapter change only
- Security and observability enforced at known choke points
- B6 Server Action becomes thin wrapper — minimal UI churn

### Negative

- More files and DTO mapping boilerplate
- Tool loop adds latency vs single-shot chat
- Synchronous MVP may block Server Action until run completes (acceptable for C1)

### Migration

Replace simulation body in `app/(dashboard)/orchestrator/actions.ts`:

```text
// Before (B6)
insert agent_run → simulate → update → events

// After (C1+)
import { runtimeOrchestrator } from '@/services/runtime/orchestrator';
const result = await runtimeOrchestrator.execute(supabase, execution);
redirect(`/orchestrator/runs/${result.trace.runId}`);
```

No DB migration required for EPIC C.

---

## Compliance

Implementation PRs for C1–C6 must reference this ADR. Review checklist: [REVIEW_CHECKLIST.md](../../engineering/REVIEW_CHECKLIST.md).
