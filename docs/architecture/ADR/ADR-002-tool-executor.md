# ADR-002: Tool Executor as Sole Side-Effect Boundary

> **Status:** Accepted  
> **Date:** 2026-06-27  
> **Epic:** C — AI Runtime (C5.0 architecture freeze)  
> **Supersedes:** Informal tool notes in [TOOLS.md](../../api/TOOLS.md) for C5.1+  
> **Depends on:** [ADR-001-ai-runtime-layering.md](./ADR-001-ai-runtime-layering.md)

---

## Context

After C4, AI Runtime executes a full pipeline:

```text
AgentExecution → Context Builder → Prompt Compiler → AI Gateway → AgentResult
```

The Gateway can return `toolCalls` from the LLM, but no component yet **executes** those calls. B6 orchestrator simulated tool steps without audit or permission enforcement.

We need a design for Tool Executor before C5.1 implementation that:

1. Makes Tool Executor the **only** side-effect boundary
2. Supports CRM, Knowledge, Web, and future MCP tools
3. Enforces tenant isolation and human approval for risky operations
4. Produces audit-grade execution records
5. Does not require DB schema changes in C5.0

Existing DTOs (`ToolCall`, `ToolResult`, `ToolDefinition`) are already consumed by Gateway and orchestrator. Any extension must not break them.

---

## Decision

### 1. Tool Executor owns all side effects

No runtime layer other than `services/runtime/tool-executor/` may:

- Write to Supabase (except audit via executor's audit module)
- Call external HTTP APIs
- Send email/SMS
- Mutate files or storage

Context Builder uses mock providers (C3). Gateway uses mock adapters (C1). Memory Manager (future C5+) will write `agent_memories` through its own service — not Tool Executor — but tool-triggered memory writes go through Tool Executor handlers if exposed as tools.

### 2. Mandatory execution pipeline

Every tool call passes through fixed stages:

```text
ToolCall → Validator → Permission → Approval → Registry → Execute → Audit → ToolResult
```

Skipping stages is forbidden. Early failure returns `ToolResult { success: false }` with structured error.

### 3. Tool Registry with rich metadata

Registry entries include: `id`, `name`, `description`, `version`, `category`, input/output schema, permissions, timeout, retry policy, approval policy.

LLM sees only `ToolDefinition` (existing DTO). Registry metadata is internal.

**Categories:** `crm`, `knowledge`, `ai`, `communication`, `files`, `web`, `storage`, `integrations`, `system`, `mcp`.

### 4. Four-level permission model

Checks run in order: **organization → employee → role → user**. All must pass.

Employee tools and permissions come from `ai_employees` (loaded by Context Builder). Organization and user context come from `AgentExecution.scope`.

### 5. Approval gates for high-risk operations

Default approval required for:

- Data deletion
- Email/SMS send
- External publish
- External API writes
- Financial operations
- CRM writes (MVP)

Approval returns `ToolResult` with `audit.approvalRequired: true` without executing handler. Re-invocation after human approval uses same idempotency key.

### 6. Idempotency within run scope

```text
idempotencyKey = hash(runId + toolName + stableStringify(validatedArgs))
```

Duplicate key in same run returns cached `ToolResult`. Cross-run idempotency deferred.

### 7. Retry policy split

- **Retryable:** transient network, timeout, rate limit (per tool policy)
- **Non-retryable:** validation, permission, approval, schema errors, write failures

Write tools default to `maxAttempts: 1`.

### 8. Audit as mandatory stage

Every execution emits audit record with: trace id, run id, tool id, input, output summary, duration, status, error.

C5.1 persists to existing `events` table. No new migrations in C5.0.

### 9. New DTOs without breaking existing ones

| New type | Purpose |
|----------|---------|
| `ToolRequest` | Tenant-scoped envelope wrapping `ToolCall` |
| `ToolExecution` | Immutable handler invocation context |
| `ToolError` | Structured error with `retryable` and `stage` |

Existing `ToolResult.error` stays `{ code, message }`. Executor maps `ToolError` → `ToolResult.error` for compatibility.

Location: `types/runtime/tool-dto.ts` in C5.1 PR.

### 10. MCP as registry category (future)

MCP tools use `category: 'mcp'`, same pipeline, adapter implements `ToolHandler`. No separate execution path. No implementation in C5.0.

---

## Alternatives considered

### A. Tools executed inline in orchestrator

**Rejected.** Duplicates permission/audit logic; violates ADR-001 layering.

### B. Gateway executes tools

**Rejected.** Gateway must remain provider-only. Mixing LLM routing with CRM writes creates untestable coupling.

### C. Each module exposes its own tool endpoint (CRM action, Knowledge action)

**Rejected.** Bypasses audit, permission, and idempotency. AI Employees would call CRM directly.

### D. LangChain tool abstraction

**Rejected.** Project rule: no new libraries without necessity. Native registry + handlers sufficient.

### E. Extend ToolCall / ToolResult DTOs in place

**Rejected.** Would break Gateway and C4 runtime. New companion types preferred.

---

## Consequences

### Positive

- C5.1 implementation can proceed without further architecture work
- Security choke point is explicit and reviewable
- MCP integration path defined without premature implementation
- Audit and observability align with existing `events` + `agent_runs` tables

### Negative

- Additional DTO mapping (`ToolCall` → `ToolRequest` → `ToolExecution` → `ToolResult`)
- Approval flow adds orchestrator complexity and UI work (C5.2)
- Run-scoped idempotency cache lost on serverless cold start — acceptable for MVP

### Migration from TOOLS.md v1

| v1 (TOOLS.md) | v2 (C5.0) |
|---------------|-----------|
| `ToolHandler.riskLevel` | `category` + `approvalPolicy` |
| Single permission check | Four-level model |
| Inline idempotency note | Formal idempotency module |
| Audit via events example | Full `ToolAuditRecord` schema |
| No MCP | MCP category + adapter spec |

C5.1 implementation references [TOOL_EXECUTOR.md](../TOOL_EXECUTOR.md) and [TOOLS_V2.md](../../api/TOOLS_V2.md).

---

## Compliance

- [ ] C5.1 PR references ADR-002
- [ ] No side effects outside `tool-executor/`
- [ ] Existing `ToolCall` / `ToolResult` DTOs unchanged
- [ ] Review checklist updated in C5.1 PR

---

## Related docs

- [TOOL_EXECUTOR.md](../TOOL_EXECUTOR.md)
- [TOOLS_V2.md](../../api/TOOLS_V2.md)
- [ADR-001-ai-runtime-layering.md](./ADR-001-ai-runtime-layering.md)
- [DTO_SPEC.md](../DTO_SPEC.md)
- [SECURITY.md](../SECURITY.md)
