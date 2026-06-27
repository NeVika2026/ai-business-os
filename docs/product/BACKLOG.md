# Product Backlog — EPIC C and beyond

> **Format:** Ready for sprint planning. Priority: P0 (next) → P2 (later).

---

## EPIC C — AI Runtime

### C1 — AI Gateway (P0)

| ID | Story | Acceptance |
|----|-------|------------|
| C1-1 | Provider adapter interface + registry | `ProviderAdapter` implemented per PROVIDER_API.md |
| C1-2 | OpenAI adapter | Chat completion via fetch, tool_calls parsed |
| C1-3 | Anthropic adapter | Messages API, system param split |
| C1-4 | Gemini adapter | generateContent mapped to normalized response |
| C1-5 | Groq adapter | OpenAI-compatible endpoint |
| C1-6 | OpenRouter adapter | OpenAI-compatible + model routing |
| C1-7 | Ollama adapter | Local chat API for dev |
| C1-8 | Gateway retry + timeout | 3 attempts, backoff, ProviderError taxonomy |
| C1-9 | Wire gateway into executeAgent | Replace B6 simulation with one gateway call |
| C1-10 | Env vars documented | `.env.example` updated |

### C2 — Prompt Compiler (P0)

| ID | Story | Acceptance |
|----|-------|------------|
| C2-1 | Compiler pure function | No DB/fetch in module |
| C2-2 | System prompt isolation | Only employee system_prompt in system role |
| C2-3 | Knowledge block injection | Labeled user message, token budget |
| C2-4 | Memory block injection | Labeled user message |
| C2-5 | Tool definitions passthrough | Enabled tools → ToolDefinition[] |
| C2-6 | Compiler unit tests | Message order + injection blocks |

### C3 — Context Builder (P0)

| ID | Story | Acceptance |
|----|-------|------------|
| C3-1 | Load ai_employee + provider + model | ContextPackage.employee populated |
| C3-2 | Knowledge retrieval | Top N chunks by source, org scoped |
| C3-3 | User intent mapping | AgentExecution.input → ContextPackage.userIntent |
| C3-4 | Injection sanitization | Blocklist patterns, HTML strip |
| C3-5 | Context build event | `context.built` emitted |

### C4 — Tool Executor (P0)

| ID | Story | Acceptance |
|----|-------|------------|
| C4-1 | Tool registry | crm_read, knowledge_search, web_search stubs |
| C4-2 | JSON Schema validation | Reject invalid ToolCall.arguments |
| C4-3 | Permission check | ai_employees.tools + permissions jsonb |
| C4-4 | Idempotency key | `{runId}:{toolName}:{hash(args)}` |
| C4-5 | Tool loop in orchestrator | Max 5 rounds |
| C4-6 | Audit events | tool.executed / tool.failed per call |
| C4-7 | crm_read implementation | Read crm_leads scoped by org |
| C4-8 | knowledge_search implementation | Query knowledge_chunks |

### C5 — Memory Manager (P1)

| ID | Story | Acceptance |
|----|-------|------------|
| C5-1 | Memory retrieve | agent_memories by employee + scope |
| C5-2 | Respect memory.enabled | Skip if disabled on employee |
| C5-3 | Importance ordering | Top 10 by importance desc |
| C5-4 | Persist policy stub | Interface only; no auto-write in MVP |
| C5-5 | memory.retrieved event | Payload with entry count |

### C6 — Runtime Observability (P1)

| ID | Story | Acceptance |
|----|-------|------------|
| C6-1 | Tracer spans | context, gateway, tool stages |
| C6-2 | Granular events | gateway.request/response, tool.* |
| C6-3 | output.observability blob | gatewayCallCount, latencies, retries |
| C6-4 | credits_consumed estimate | Static price map |
| C6-5 | Run detail UI enrichment | Timeline shows new event types |
| C6-6 | Orchestrator avg duration stat | Dashboard computed field |

---

## EPIC D — Deferred

| ID | Story | Priority |
|----|-------|----------|
| D-1 | Background queue for agent runs | P2 |
| D-2 | Tool approval UI + resume run | P2 |
| D-3 | SSE streaming gateway | P2 |
| D-4 | Multi-agent orchestration (parent_run_id) | P2 |
| D-5 | Provider cost dashboard | P2 |
| D-6 | Knowledge import pipeline | P1 |
| D-7 | Real web_search via HTTP | P2 |

---

## EPIC B — Remaining (from master architecture)

| ID | Story | Priority |
|----|-------|----------|
| B-7 | Projects MVP | P1 |
| B-8 | Settings / org management | P2 |
| B-9 | Content Factory shell | P2 |

---

## Technical debt

| ID | Item | Priority |
|----|------|----------|
| TD-1 | Replace orchestrator simulation remnants | C1 |
| TD-2 | deleteEmployee UI on AI employees | P2 |
| TD-3 | Knowledge import queue implementation | D-6 |
| TD-4 | Middleware → proxy migration (Next.js 16 warning) | P2 |
