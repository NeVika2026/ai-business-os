# Product Roadmap

> **Last updated:** 2026-06-27  
> **Status:** EPIC C frozen — ready for implementation

---

## Completed (A + B)

| Sprint | Scope | Status |
|--------|-------|--------|
| A1–A2 | Project structure, Supabase SSR | ✅ Done |
| A3 | DB schema, RLS, seed | ✅ Done |
| B1 | Auth, onboarding | ✅ Done |
| B2 | App Shell, navigation | ✅ Done |
| B3 | CRM Leads MVP | ✅ Done |
| B4 | Knowledge Hub MVP | ✅ Done |
| B5 | AI Employees MVP | ✅ Done |
| B6 | Orchestrator MVP (simulated) | ✅ Done |

---

## EPIC C — AI Runtime (current)

Architecture frozen in `docs/architecture/`. Implementation order:

| Sprint | Name | Deliverable | Depends on |
|--------|------|-------------|------------|
| **C1** | AI Gateway | Provider adapters (OpenAI, Anthropic, Gemini, Groq, OpenRouter, Ollama), `GatewayRequest/Response`, retry, env-based credentials | ADR-001, DTO_SPEC |
| **C2** | Prompt Compiler | Pure compiler: `ContextPackage + KnowledgePackage + MemoryPackage → PromptRequest` | C1 types |
| **C3** | Context Builder | Load employee, retrieve knowledge chunks, assemble `ContextPackage` | B4, B5 |
| **C4** | Tool Executor | Registry (`crm_read`, `knowledge_search`, `web_search`), validation, permissions, audit events | C1 |
| **C5** | Memory Manager | Retrieve + optional post-run persist to `agent_memories` | C3 |
| **C6** | Runtime Observability | Trace spans, granular events, token/cost aggregation, timeline UI enrichment | C1–C5 |

### C1 acceptance criteria

- [ ] `services/runtime/gateway/gateway.ts` implements `complete(GatewayRequest): GatewayResponse`
- [ ] At least OpenAI + Anthropic adapters working via `fetch`
- [ ] `executeAgent` calls gateway for one-shot completion (no tools yet)
- [ ] Real tokens written to `agent_runs.tokens_input/output`
- [ ] Provider errors sanitized in `agent_runs.error_message`

### C2 acceptance criteria

- [ ] `services/runtime/prompt-compiler/compiler.ts` — zero DB imports
- [ ] Knowledge in user-role labeled block, not system prompt
- [ ] Unit tests for message ordering

### C3 acceptance criteria

- [ ] `ContextBuilder.build(AgentExecution): ContextPackage`
- [ ] Knowledge retrieval from `knowledge_chunks` with org scope
- [ ] No provider imports in context-builder

### C4 acceptance criteria

- [ ] Tool loop in orchestrator (max 5 rounds)
- [ ] Each tool emits `tool.executed` event
- [ ] Write tools blocked in MVP registry

### C5 acceptance criteria

- [ ] Memory retrieve respects `ai_employees.memory` config
- [ ] No auto-generate memory in C5 — retrieve only (write policy stub)

### C6 acceptance criteria

- [ ] `agent_runs.output.observability` populated
- [ ] Orchestrator run detail shows gateway latency + tool audit
- [ ] Dashboard stats include avg duration

---

## EPIC D — Post-runtime (planned, not frozen)

| Area | Description |
|------|-------------|
| D1 | Async job queue for long runs |
| D2 | Tool approval UI |
| D3 | Streaming responses |
| D4 | Multi-agent chains (parent_run_id) |
| D5 | Cost billing per org |
| D6 | Knowledge import pipeline (B4 stubs) |

---

## EPIC E — Business modules (planned)

| Module | Notes |
|--------|-------|
| Projects | Placeholder exists |
| Content Factory | Master architecture defined |
| Marketplace | Placeholder exists |
| Integrations | Event-driven |
| Academy | Placeholder exists |

---

## Principles (unchanged)

1. No DB migration without explicit approval
2. No new npm libraries without justification
3. Server Actions = auth boundary; logic in `services/`
4. All tenant data scoped by `organization_id` + RLS

---

## Documentation index

- [AI_RUNTIME.md](../architecture/AI_RUNTIME.md)
- [DTO_SPEC.md](../architecture/DTO_SPEC.md)
- [BACKLOG.md](./BACKLOG.md)
- [USER_JOURNEYS.md](./USER_JOURNEYS.md)
