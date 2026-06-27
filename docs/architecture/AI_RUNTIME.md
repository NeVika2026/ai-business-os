# AI Runtime — Architecture Freeze (EPIC C)

> **Status:** Frozen before implementation  
> **Version:** 1.0.0  
> **Depends on:** A1–A3 (schema), B1–B6 (app shell, modules, orchestrator MVP)  
> **Scope:** Server-side execution engine only. No UI changes required for C1–C6 core.

---

## 1. Purpose

AI Runtime is the **execution engine** that turns an `ai_employee` configuration into a traceable, tenant-safe agent run.

It is **not a chat UI**. It is a pipeline that:

1. Loads employee + tenant context
2. Retrieves knowledge and memory
3. Compiles a provider-agnostic prompt
4. Calls LLM through a single gateway
5. Executes tools with audit
6. Persists runs, events, and observability data

Current state (B6): `executeAgent` in `app/(dashboard)/orchestrator/actions.ts` simulates the pipeline and writes to `agent_runs` + `events`. EPIC C replaces simulation with real runtime services.

---

## 2. Runtime components (EPIC C)

| Component | Sprint | Responsibility |
|-----------|--------|----------------|
| **AI Gateway** | C1 | Single entry for all LLM calls. Routing, retries, rate limits, provider selection. |
| **Prompt Compiler** | C2 | Pure function: DTOs → `PromptRequest`. No DB access. |
| **Context Builder** | C3 | Loads employee, task, project, user intent → `ContextPackage`. No provider knowledge. |
| **Tool Executor** | C4 | Registry, validation, permissions, approval, audit, side effects. |
| **Memory Manager** | C5 | Read/write `agent_memories`. Retrieval + post-run persistence policy. |
| **Runtime Observability** | C6 | Trace, timeline, tokens, cost, errors, tool audit. |
| **Provider Adapters** | C1 (with Gateway) | OpenAI, Anthropic, Gemini, Groq, OpenRouter, Ollama, future. |

---

## 3. Pipeline

```text
User
  → AI Employee          (ai_employees row + permissions + tools config)
  → Context Builder      (ContextPackage)
  → Knowledge Retrieval  (knowledge_sources → knowledge_items → knowledge_chunks)
  → Memory Retrieval     (agent_memories via Memory Manager)
  → Prompt Compiler      (PromptRequest)
  → AI Gateway           (GatewayRequest → Provider Adapter → LLM)
  → Tool Executor        (ToolCall → ToolResult, loop if model requests tools)
  → Event Bus            (events table)
  → Agent Run            (agent_runs table)
  → Memory               (optional write via Memory Manager)
  → UI                   (orchestrator / ai-employees pages)
```

### 3.1 Orchestrator entry point

**Current:** `executeAgent(formData)` — Next.js Server Action.  
**Target (C1+):** Server Action remains thin; delegates to `RuntimeOrchestrator.execute(AgentExecution)`.

```text
app/(dashboard)/orchestrator/actions.ts   # thin boundary (auth, org scope)
  → services/runtime/orchestrator.ts      # pipeline coordinator
  → services/runtime/context-builder/
  → services/runtime/memory-manager/
  → services/runtime/prompt-compiler/
  → services/runtime/gateway/
  → services/runtime/tool-executor/
  → services/runtime/observability/
```

### 3.2 Execution loop (with tools)

```text
1. Create agent_run (status: running), correlation_id = run.id
2. Emit event: run_started
3. Context Builder → ContextPackage
4. Memory Manager.retrieve → MemoryPackage
5. Knowledge retrieval → KnowledgePackage
6. Prompt Compiler → PromptRequest
7. LOOP (max N tool rounds, default 5):
   a. AI Gateway.complete(GatewayRequest) → GatewayResponse
   b. If response has tool_calls:
      - Tool Executor.execute each ToolCall → ToolResult
      - Append results to prompt messages
      - Continue loop
   c. Else: break with final text
8. Update agent_run (completed | failed)
9. Emit event: run_completed | run_failed
10. Memory Manager.persist (if policy allows)
11. Observability.flush(trace)
```

### 3.3 Data stores (existing — do not change in EPIC C)

| Store | Table(s) | Runtime usage |
|-------|----------|---------------|
| Employee config | `ai_employees`, `ai_providers`, `ai_models` | Context Builder |
| Knowledge | `knowledge_sources`, `knowledge_items`, `knowledge_chunks` | Retrieval in Context Builder |
| Memory | `agent_memories` | Memory Manager |
| Runs | `agent_runs` | Orchestrator write |
| Events | `events` | Event Bus write |
| Prompts (future) | `prompts` | Optional template refs in C2 |

---

## 4. Layering rules (mandatory)

1. **AI Employee never calls provider directly.** Only `services/runtime/gateway/`.
2. **Provider is invoked only through AI Gateway.** Adapters are internal to gateway.
3. **Knowledge never becomes system prompt.** Knowledge goes into `KnowledgePackage` → user/context messages only.
4. **Context Builder does not know about provider.** It outputs `ContextPackage` only.
5. **Prompt Compiler does not access DB.** Input = DTOs only; output = `PromptRequest`.
6. **Tool Executor does not call LLM.** It executes registered tools and returns `ToolResult`.
7. **All side effects go through Tool Executor** (CRM writes, knowledge search API, web fetch, etc.).
8. **All tool calls are audit-friendly** — logged with run id, tool id, input hash, actor, timestamp.
9. **All agent runs have trace/correlation id** — `agent_runs.id` = `events.correlation_id`.
10. **All requests scoped by `organization_id`** — enforced at orchestrator entry and every DB query.

Violations are architecture defects, not style preferences.

---

## 5. Proposed directory layout

```text
services/runtime/
  orchestrator.ts              # pipeline coordinator
  gateway/
    gateway.ts                 # AI Gateway facade
    gateway.types.ts
    retry.ts
    rate-limit.ts
  providers/
    provider-adapter.ts        # interface
    openai.ts
    anthropic.ts
    gemini.ts
    groq.ts
    openrouter.ts
    ollama.ts
  prompt-compiler/
    compiler.ts
  context-builder/
    builder.ts
    knowledge-retrieval.ts
  tool-executor/
    executor.ts
    registry.ts
    tools/                     # crm_read, knowledge_search, web_search, ...
  memory-manager/
    manager.ts
  observability/
    tracer.ts
    metrics.ts

types/runtime/
  dto.ts                       # all internal DTOs (see DTO_SPEC.md)
```

UI layers (`app/`, `components/`) **must not** import provider adapters.

---

## 6. Integration with B6 Orchestrator

| B6 (today) | EPIC C (target) |
|------------|-----------------|
| Simulated `output` jsonb | Real `GatewayResponse` serialized to `agent_runs.output` |
| Hardcoded tokens | From provider adapter usage metadata |
| `run_started` / `run_completed` events | Same event types + granular runtime events (optional C6) |
| No tool loop | Tool Executor loop when model returns tool_calls |
| No memory write | Memory Manager optional persist after run |

Migration path: replace body of `executeAgent` with `RuntimeOrchestrator.execute()`; keep Server Action as auth boundary.

---

## 7. Non-goals (EPIC C)

- Chat streaming UI
- New DB migrations (use existing jsonb fields: `input`, `output`, `metadata`, `configuration`)
- Background job queue (runs are synchronous MVP; async queue is later epic)
- Marketplace / multi-provider billing
- Fine-tuning or custom model hosting

---

## 8. References

- [DTO_SPEC.md](./DTO_SPEC.md) — internal contracts
- [SECURITY.md](./SECURITY.md) — tenant isolation, injection, secrets
- [OBSERVABILITY.md](./OBSERVABILITY.md) — trace, metrics, timeline
- [PROVIDER_API.md](./PROVIDER_API.md) — adapter interface
- [ADR-001](./ADR/ADR-001-ai-runtime-layering.md) — layering decision record
- [../api/GATEWAY.md](../api/GATEWAY.md) — gateway API surface
- [../api/TOOLS.md](../api/TOOLS.md) — tool executor API
- [../api/EVENTS.md](../api/EVENTS.md) — event bus contract
