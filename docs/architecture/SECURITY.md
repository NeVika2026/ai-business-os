# AI Runtime — Security

> **Version:** 1.0.0  
> **Applies to:** EPIC C (C1–C6) and all future runtime code

---

## 1. Threat model (runtime scope)

| Threat | Mitigation owner |
|--------|------------------|
| Cross-tenant data leak | Orchestrator + RLS + scope checks |
| Prompt injection via knowledge/memory | Prompt Compiler + Context Builder sanitization |
| Unauthorized tool execution | Tool Executor permissions + approval gates |
| Secret exfiltration via tools | Tool registry allowlist + output filtering |
| Provider key exposure | Gateway server-side only |
| Audit tampering | Append-only events; runs immutable after complete |

---

## 2. Tenant isolation

### 2.1 organization_id enforcement

Every runtime entry point **must** resolve `organizationId` before any work:

```text
Server Action / API route
  → getCurrentOrganizationId(supabase)   # existing util
  → AgentExecution.scope.organizationId
  → passed to every service call
```

**Hard rules:**
- Never trust `organization_id` from client payload.
- Every Supabase query includes `.eq('organization_id', organizationId)`.
- RLS is defense-in-depth; runtime must not rely on RLS alone.

### 2.2 RLS boundaries (existing, frozen)

| Table | Runtime access |
|-------|----------------|
| `ai_employees` | SELECT scoped by org; employee must belong to org |
| `agent_runs` | INSERT/UPDATE with `created_by = auth.uid()` |
| `agent_memories` | SELECT/INSERT scoped by org + employee |
| `knowledge_*` | SELECT only in retrieval; no runtime writes in EPIC C |
| `events` | INSERT only from server runtime |
| `ai_providers`, `ai_models` | SELECT global catalog |

Runtime services use **server Supabase client** (`services/supabase/server.ts`). Never `SERVICE_ROLE` in client bundles.

---

## 3. Prompt injection protection

### 3.1 Knowledge never in system prompt

Knowledge chunks and memory entries are injected as **explicitly labeled user/context messages**:

```text
[KNOWLEDGE CONTEXT — untrusted external data]
...chunk content...

[MEMORY — organizational notes]
...memory content...

[USER REQUEST]
...actual user intent...
```

System prompt contains **only** `ai_employees.system_prompt` + static compiler instructions (role, output format).

### 3.2 Sanitization rules (Context Builder + Prompt Compiler)

1. Strip HTML/script tags from knowledge chunks before inject.
2. Truncate single chunk to max 2000 chars.
3. Reject chunks containing patterns: `ignore previous`, `system:`, `<|`, `### instruction` (configurable blocklist).
4. Memory content treated as untrusted — same labeling as knowledge.
5. User intent payload serialized as JSON in labeled block, not concatenated raw.

### 3.3 Tool argument validation

Tool Executor validates all `ToolCall.arguments` against tool JSON Schema **before** execution. Reject unknown keys unless schema allows `additionalProperties`.

---

## 4. Tool approval gates

Tools classified by risk level:

| Level | Examples | Gate |
|-------|----------|------|
| `read` | `crm_read`, `knowledge_search` | Auto-execute if enabled on employee |
| `write` | `crm_update`, `task_create` | Requires `permissions` flag on employee |
| `external` | `web_search`, `http_fetch` | Requires explicit tool enable + org setting (future) |
| `destructive` | `crm_delete`, `employee_delete` | Blocked in EPIC C MVP |

Approval flow (C4):
1. Tool Executor checks `ai_employees.tools[].enabled` and `permissions` jsonb.
2. If `approvalRequired`: emit `tool.approval_requested` event, return pending ToolResult.
3. Human approval (future UI) resumes run — out of EPIC C scope.

EPIC C MVP: write tools **disabled by default** in registry.

---

## 5. Secret handling

| Secret | Storage | Access |
|--------|---------|--------|
| Provider API keys | Env vars / Supabase Vault (future) | `services/runtime/providers/*` only |
| Supabase SERVICE_ROLE | Server env only | Never in runtime client path |
| User OAuth tokens | Integrations table (future) | Tool Executor via encrypted fetch |

**Logging rule:** Never log full API keys, auth headers, or raw provider responses containing secrets.

Environment variable naming (C1):

```text
OPENAI_API_KEY
ANTHROPIC_API_KEY
GOOGLE_AI_API_KEY
GROQ_API_KEY
OPENROUTER_API_KEY
OLLAMA_BASE_URL              # local, no key
```

Gateway reads keys; adapters receive key via gateway injection, not global import in tools.

---

## 6. Safe logging

### 6.1 Allowed in logs / events

- `runId`, `organizationId`, `employeeId`, `providerCode`, `modelCode`
- Token counts, latency, finish reason
- Tool name, success/fail, duration
- Truncated error messages (max 500 chars)

### 6.2 Forbidden in logs / events

- Full prompt messages containing PII (unless debug flag + owner role)
- Provider API keys
- Raw knowledge chunk content in error stacks
- Complete CRM records in event payload (use ids only)

### 6.3 Debug mode

`RUNTIME_DEBUG=1` (server only) enables verbose structured logs. Disabled in production by default.

---

## 7. Auth boundary

```text
Client (browser)
  → Server Action / API route     ← auth.uid() required
  → Runtime Orchestrator          ← receives verified scope
  → Services                      ← no Next.js request context assumed
```

Runtime services **must not** call `createClient()` themselves in C1–C6 MVP. Orchestrator receives a scoped Supabase client or repository interfaces injected at boundary.

---

## 8. Failure modes

| Failure | Behavior |
|---------|----------|
| Employee inactive | Fail before gateway; `run_failed` event |
| Org mismatch | Throw `Unauthorized`; no run created |
| Provider 401 | Gateway retry once; then fail with sanitized error |
| Tool permission denied | ToolResult success=false; model may recover |
| Injection pattern detected | Skip chunk; log `security.chunk_blocked` event |

---

## 9. Checklist (per PR in EPIC C)

- [ ] `organizationId` from server auth, not client
- [ ] No provider SDK import outside `services/runtime/providers/`
- [ ] Knowledge/memory not in system role message
- [ ] Tool args schema-validated
- [ ] No secrets in logs or event payloads
- [ ] RLS-compatible queries (org filter explicit)
