# Tool Executor — Architecture

> **Version:** 1.0.0  
> **Sprint:** C5.0 (architecture freeze)  
> **Implementation target:** C5.1+  
> **Module:** `services/runtime/tool-executor/`  
> **Rule:** Tool Executor is the **only** runtime layer that may perform side effects.

---

## 1. Purpose

Tool Executor is the controlled execution boundary between an LLM and the outside world.

Every action that reads or writes tenant data, calls external APIs, sends messages, or mutates system state **must** pass through Tool Executor. No other runtime component (Context Builder, Prompt Compiler, AI Gateway, Memory Manager) may perform side effects.

```text
┌──────────────────────────────────────────────────────────────────┐
│  AI Gateway — returns ToolCall[] from LLM (no side effects)       │
└───────────────────────────────┬──────────────────────────────────┘
                                │ ToolCall
┌───────────────────────────────▼──────────────────────────────────┐
│  Tool Executor — validate → permission → approval → execute       │
│                    → audit → ToolResult                           │
└───────────────────────────────┬──────────────────────────────────┘
                                │ ToolResult
┌───────────────────────────────▼──────────────────────────────────┐
│  Orchestrator — append tool message → next Gateway round          │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Position in runtime pipeline

Tool Executor sits **after** AI Gateway in the orchestrator tool loop (see [AI_RUNTIME.md](./AI_RUNTIME.md)):

```text
Context Builder → Prompt Compiler → AI Gateway
                                         │
                                         ▼ (tool_calls)
                                    Tool Executor
                                         │
                                         ▼ ToolResult
                                    Prompt messages → AI Gateway (next round)
```

Tool Executor does **not** call LLM. It does **not** compile prompts. It does **not** choose providers.

---

## 3. Execution pipeline (mandatory order)

Every tool invocation follows this pipeline. Stages are sequential; a failure at any stage returns `ToolResult` with `success: false` without executing later stages.

```text
LLM
  ↓
Tool Call                    (GatewayResponse.toolCalls[] → ToolCall DTO)
  ↓
Tool Validator               (schema, allowlist, argument sanitization)
  ↓
Permission Check             (organization, employee, role, user)
  ↓
Approval Check               (human gate for high-risk operations)
  ↓
Tool Registry                (resolve handler by tool id)
  ↓
Tool Executor                (invoke handler with timeout + retry policy)
  ↓
Audit Log                    (append-only record; events table in C5.1+)
  ↓
Tool Result                  (ToolResult DTO → orchestrator)
```

### 3.1 Stage responsibilities

| Stage | Input | Output | Failure code prefix |
|-------|-------|--------|---------------------|
| Tool Validator | `ToolCall` | validated arguments | `VALIDATION_*` |
| Permission Check | `ToolExecution` | allowed / denied | `PERMISSION_*` |
| Approval Check | `ToolExecution` | approved / pending / denied | `APPROVAL_*` |
| Tool Registry | tool id | `RegisteredTool` handler | `REGISTRY_*` |
| Tool Executor | handler + args | raw handler output | `EXECUTION_*` |
| Audit Log | execution metadata | audit record id | never blocks success |
| Tool Result | all above | `ToolResult` | — |

---

## 4. Tool Registry

### 4.1 Registration model

Tools are registered at application startup in `services/runtime/tool-executor/registry.ts`. Registration is **static** in EPIC C; dynamic plugin loading is deferred.

```typescript
interface RegisteredTool {
  id: string;                          // stable registry key, e.g. "crm_read"
  name: string;                        // display name
  description: string;                 // LLM-facing description
  version: string;                     // semver, e.g. "1.0.0"
  category: ToolCategory;
  inputSchema: JSONSchema;             // draft-07 subset
  outputSchema: JSONSchema;            // draft-07 subset
  permissions: ToolPermissionSpec;
  timeoutMs: number;                   // default 30_000
  retryPolicy: ToolRetryPolicy;
  approvalPolicy: ToolApprovalPolicy;
  handler: ToolHandler;
  enabled: boolean;                    // global kill switch
}
```

### 4.2 Registry API

```typescript
interface ToolRegistry {
  register(tool: RegisteredTool): void;
  get(id: string): RegisteredTool | null;
  list(filters?: { category?: ToolCategory; enabled?: boolean }): RegisteredTool[];
  toToolDefinitions(enabledToolIds: string[]): ToolDefinition[];  // existing DTO for Gateway
}
```

`toToolDefinitions()` maps registry entries to the existing `ToolDefinition` DTO (name, description, parameters) for Prompt Compiler / Gateway. Extended metadata stays in registry only.

### 4.3 Tool categories

| Category | Purpose | Examples | Default risk |
|----------|---------|----------|--------------|
| `crm` | CRM reads and writes | `crm_read`, `crm_update`, `lead_qualify` | read / write |
| `knowledge` | Knowledge retrieval and indexing | `knowledge_search`, `knowledge_index` | read |
| `ai` | Internal AI operations | `embed_text`, `classify_intent` | read |
| `communication` | Email, SMS, chat outbound | `email_send`, `slack_post` | external |
| `files` | File read/write in tenant storage | `file_read`, `file_upload` | read / write |
| `web` | HTTP fetch, web search | `web_search`, `http_get` | external |
| `storage` | Object storage, exports | `export_csv`, `archive_run` | write |
| `integrations` | Third-party SaaS connectors | `hubspot_sync`, `notion_page` | external |
| `system` | Platform-internal ops | `task_create`, `run_status` | write |
| `mcp` | MCP server tools (future) | `mcp://server/tool` | external |

Categories drive default approval policy, audit verbosity, and permission templates.

### 4.4 MVP registry (C5.1)

| id | category | version | C5.1 status |
|----|----------|---------|-------------|
| `crm_read` | crm | 1.0.0 | implement |
| `knowledge_search` | knowledge | 1.0.0 | implement |
| `web_search` | web | 1.0.0 | stub |
| `crm_update` | crm | 1.0.0 | registered, disabled |
| `email_send` | communication | 1.0.0 | registered, disabled |

---

## 5. DTO contract

### 5.1 Existing DTOs (frozen — do not modify)

These types live in `types/runtime/dto.ts` and remain unchanged:

| DTO | Role |
|-----|------|
| `ToolDefinition` | LLM schema exposed via Gateway (`name`, `description`, `parameters`) |
| `ToolCall` | Provider-parsed tool invocation from Gateway |
| `ToolResult` | Executor output consumed by orchestrator |

### 5.2 New DTOs (proposed for C5.1)

New types extend the contract without breaking existing interfaces. Location: `types/runtime/tool-dto.ts` (or appended to `dto.ts` in C5.1 implementation PR).

#### ToolRequest

**Why:** `ToolCall` is provider-centric (LLM output). Executor needs a validated, tenant-scoped request envelope before permission checks.

```typescript
interface ToolRequest {
  call: ToolCall;                      // original LLM tool call
  scope: TenantScope;
  trace: TraceContext;
  employee: {
    id: UUID;
    roleTitle: string;
    permissions: Record<string, boolean>;
    enabledTools: string[];
  };
  idempotencyKey: string;              // computed before execution
  requestedAt: ISODateTime;
}
```

#### ToolExecution

**Why:** After validation and permission checks, execution context is immutable for the handler invocation and audit trail.

```typescript
interface ToolExecution {
  request: ToolRequest;
  tool: {
    id: string;
    version: string;
    category: ToolCategory;
  };
  validatedArguments: Record<string, unknown>;
  approval: {
    required: boolean;
    approved: boolean;
    approvedBy?: UUID | null;          // user id if human approved
    approvedAt?: ISODateTime | null;
  };
  startedAt: ISODateTime;
}
```

#### ToolError

**Why:** `ToolResult.error` is a minimal `{ code, message }`. Structured errors enable retry classification, UI display, and observability without parsing strings.

```typescript
interface ToolError {
  code: string;                        // e.g. "PERMISSION_DENIED"
  message: string;
  retryable: boolean;
  stage: 'validation' | 'permission' | 'approval' | 'registry' | 'execution' | 'timeout';
  details?: Record<string, unknown>;
}
```

`ToolResult.error` remains `{ code, message }` for backward compatibility. Executor maps `ToolError` → `ToolResult.error` and stores full `ToolError` in audit payload.

### 5.3 Mapping summary

```text
GatewayResponse.toolCalls[]
  → ToolCall (existing)
  → ToolRequest (new, built by orchestrator/executor entry)
  → ToolExecution (new, after validate + permission + approval)
  → handler output
  → ToolResult (existing)
```

---

## 6. Permission model

Permissions are evaluated at **four levels**. All levels must pass (AND logic).

### 6.1 Organization level

- Tool must be allowed for the tenant (org feature flags / plan limits).
- Query: org settings or `organization_tool_policy` (future table — not EPIC C migration).
- MVP: all registered read tools allowed; write/external tools require explicit org enable flag in employee permissions jsonb.

### 6.2 Employee level

- Tool id must appear in `ai_employees.tools` with `{ id, enabled: true }`.
- Employee must be `status = active` and `is_active = true`.
- Source: Context Builder loads this into `ContextPackage.employee.tools`.

### 6.3 Role level

- Employee `roleTitle` may restrict categories (e.g. Sales vs Support).
- Mapping: `role_tool_policy` config in registry (static JSON in C5.1).
- Example: `Support` role cannot use `crm_update`.

### 6.4 User level

- Human who triggered the run (`scope.userId`) may have additional restrictions.
- Required for approval gates: only `scope.userId` or org admin can approve destructive ops.
- MVP: if `scope.userId` is null (system-triggered run), write tools are denied unless `dryRun = false` and explicit system actor flag.

### 6.5 Permission spec on registry entry

```typescript
interface ToolPermissionSpec {
  requiredFlags: string[];             // keys in employee.permissions jsonb
  allowedRoles?: string[];             // empty = all roles
  deniedRoles?: string[];
  orgFeatureFlag?: string;           // optional org-level gate
  categoryDefault: boolean;            // inherit category policy if true
}
```

### 6.6 Hard rules

1. Tools **must not** accept `organization_id` in arguments — scope comes from `ToolRequest.scope`.
2. Every handler receives `organizationId` via injected context, never from LLM args.
3. Cross-tenant access is a **security incident** — log and fail closed.

---

## 7. Approval gates

### 7.1 Operations requiring approval

| Operation pattern | category | approval | example tools |
|-------------------|----------|----------|---------------|
| Data deletion | any | required | `crm_delete`, `file_delete` |
| Email / SMS send | communication | required | `email_send`, `sms_send` |
| Public publish | integrations | required | `notion_publish`, `webhook_post` |
| External API write | integrations, web | required | `hubspot_update`, `http_post` |
| Financial action | integrations, system | required | `invoice_create`, `payment_initiate` |
| CRM write | crm | configurable | `crm_update` — required in MVP |
| Read-only / search | crm, knowledge, web | not required | `crm_read`, `knowledge_search` |

### 7.2 Approval policy on registry entry

```typescript
interface ToolApprovalPolicy {
  required: boolean;
  reason: string;                      // shown in UI approval prompt
  expiresAfterMs?: number;             // default 300_000 (5 min)
  approverRoles?: ('admin' | 'owner' | 'member')[];
}
```

### 7.3 Approval flow (C5.1 MVP)

```text
1. Approval Check detects approvalRequired = true
2. If no prior approval token in run context:
   → return ToolResult { success: false, audit.approvalRequired: true, audit.approved: false }
   → orchestrator pauses run (status: awaiting_approval) — future UI
3. User approves via Server Action with approval token bound to runId + toolCallId
4. Re-invoke executor with approval.approved = true
5. Handler executes; audit records approver userId
```

C5.1 MVP: approval-required tools return pending result; full UI deferred to C5.2.

---

## 8. Idempotency

### 8.1 Key computation

```typescript
idempotencyKey = sha256(
  trace.runId + '|' +
  toolCall.name + '|' +
  stableStringify(validatedArguments)
)
```

- Computed **after** validation (canonical argument order).
- Same key within one run → return cached `ToolResult` without re-executing handler.
- Cache scope: in-memory per orchestrator run instance (C5.1). Not cross-run.

### 8.2 Rules

| Scenario | Behavior |
|----------|----------|
| Same run, same tool, same args | Return cached result |
| Same run, same tool, different args | New execution |
| Different run | Always new execution |
| Approval pending → approved retry | Same key; execute once approved |
| Handler throws after partial side effect | **Non-idempotent** — mark key as consumed; do not retry automatically |

Write tools with side effects should implement handler-level idempotency (e.g. upsert by client-provided key) in addition to executor-level dedup.

---

## 9. Retry policy

Retry applies to **handler invocation** inside Tool Executor, not to LLM tool loop (orchestrator handles gateway retries separately).

### 9.1 Policy definition

```typescript
interface ToolRetryPolicy {
  maxAttempts: number;                 // default 1 for writes, 3 for reads
  backoffMs: number[];                 // e.g. [200, 500, 1000]
  retryableErrors: string[];           // error codes eligible for retry
}
```

### 9.2 Retryable vs non-retryable

| Retryable | Non-retryable |
|-----------|---------------|
| Network timeout | Validation error |
| Transient DB connection error | Permission denied |
| Rate limit (429) with Retry-After | Approval required / denied |
| External API 503 | Unknown tool id |
| MCP server temporary unavailable | Schema mismatch |
| | Duplicate idempotency conflict (return cache) |
| | Destructive op partial failure |

### 9.3 Default policies by category

| Category | maxAttempts | Notes |
|----------|-------------|-------|
| crm (read) | 3 | DB read retries |
| crm (write) | 1 | No auto-retry |
| knowledge | 3 | Search retries |
| communication | 1 | Never auto-retry send |
| web | 2 | Fetch retries |
| mcp | 2 | Server-dependent |

---

## 10. Audit log

Every tool execution produces an audit record. C5.1 writes to `events` table; structure is stable for future dedicated audit store.

### 10.1 Required fields

| Field | Source |
|-------|--------|
| `traceId` | `ToolRequest.trace.traceId` |
| `runId` | `ToolRequest.trace.runId` |
| `toolId` | registry entry `id` |
| `toolVersion` | registry entry `version` |
| `input` | validated arguments (redacted) |
| `output` | result summary or error (redacted) |
| `durationMs` | wall clock handler time |
| `status` | `success` \| `failed` \| `pending_approval` |
| `error` | `ToolError` if failed |

### 10.2 Additional audit metadata

```typescript
interface ToolAuditRecord {
  traceId: UUID;
  runId: UUID;
  correlationId: UUID;
  organizationId: UUID;
  employeeId: UUID;
  userId: UUID | null;
  toolId: string;
  toolVersion: string;
  toolCallId: string;
  category: ToolCategory;
  input: Record<string, unknown>;      // secrets redacted
  outputSummary: string | null;
  durationMs: number;
  status: 'success' | 'failed' | 'pending_approval';
  error?: ToolError;
  idempotencyKey: string;
  approvalRequired: boolean;
  approved: boolean;
  approvedBy?: UUID | null;
  executedAt: ISODateTime;
  cached: boolean;                     // true if idempotency cache hit
}
```

### 10.3 Event mapping

| status | events.type |
|--------|-------------|
| success | `tool.executed` |
| failed | `tool.failed` |
| pending_approval | `tool.approval_required` |

See [OBSERVABILITY.md](./OBSERVABILITY.md) for timeline reconstruction.

### 10.4 Redaction rules

- Strip API keys, tokens, passwords from audit input/output.
- Truncate output summary to 500 chars.
- Full output stored in `agent_runs.output.tool_results[]` (orchestrator responsibility).

---

## 11. MCP architecture (future — no implementation in C5.0)

Model Context Protocol (MCP) tools are treated as an **adapter category** within Tool Registry, not a separate execution path.

### 11.1 Design principles

1. MCP tools register through `category: 'mcp'` with id format `mcp/{serverId}/{toolName}`.
2. MCP adapter implements `ToolHandler` interface — same pipeline (validate → permission → approval → execute → audit).
3. MCP server connections are managed by `services/runtime/tool-executor/mcp/` (future):
   - `McpConnectionPool` — one connection per org + serverId
   - `McpToolDiscovery` — sync tool list into registry at connect time
   - `McpToolHandler` — forwards to MCP `call_tool`
4. MCP tools inherit **external** risk level → approval required by default.
5. MCP output passes through same sanitization as web/knowledge tools.

### 11.2 MCP registry entry (future)

```typescript
interface McpRegisteredTool extends RegisteredTool {
  category: 'mcp';
  mcp: {
    serverId: string;
    serverToolName: string;
    connectionConfigRef: string;       // org-scoped secret ref, not inline key
  };
}
```

### 11.3 Non-goals (C5.x)

- MCP server hosting
- Dynamic MCP registration from UI
- Cross-org MCP sharing

---

## 12. Module layout (implementation target)

```text
services/runtime/tool-executor/
  executor.ts              # facade: execute(call, ctx) → ToolResult
  pipeline.ts              # validate → permission → approval → run → audit
  registry.ts              # RegisteredTool catalog
  validation.ts            # JSON Schema + sanitization
  permissions.ts           # org / employee / role / user checks
  approval.ts              # approval gate logic
  idempotency.ts           # key compute + run-scoped cache
  retry.ts                 # retry wrapper around handler
  audit.ts                 # ToolAuditRecord → events
  errors.ts                # ToolError factories
  types.ts                 # ToolRequest, ToolExecution, RegisteredTool
  tools/
    crm-read.ts
    knowledge-search.ts
    web-search.ts
  mcp/                     # future
    adapter.ts
    discovery.ts
```

---

## 13. Orchestrator integration

```typescript
// services/runtime/orchestrator.ts (future C5.2)

for (const call of gatewayResponse.toolCalls) {
  const result = await toolExecutor.execute(call, {
    scope: context.scope,
    trace: context.trace,
    employee: context.employee,
    supabase,                          // injected at boundary only
  });

  if (!result.success && result.audit.approvalRequired && !result.audit.approved) {
    runStatus = 'awaiting_approval';
    break;
  }

  messages.push(toToolMessage(result));
}
```

Tool Executor receives Supabase client **only via orchestrator boundary** — never from LLM or Gateway.

---

## 14. Layering compliance

| Rule | Enforcement |
|------|-------------|
| Only Tool Executor performs side effects | ADR-001, ADR-002 |
| Gateway does not execute tools | Gateway returns ToolCall only |
| Prompt Compiler does not execute tools | Pure function |
| Context Builder does not execute tools | Mock providers in C3 |
| All tools audited | audit.ts mandatory stage |
| Tenant scoped | permissions.ts + handler contract |

---

## 15. Related docs

- [TOOLS_V2.md](../api/TOOLS_V2.md) — API reference
- [ADR-002-tool-executor.md](./ADR/ADR-002-tool-executor.md) — decision record
- [DTO_SPEC.md](./DTO_SPEC.md) — frozen ToolCall / ToolResult
- [SECURITY.md](./SECURITY.md) — permission and injection rules
- [OBSERVABILITY.md](./OBSERVABILITY.md) — audit events and timeline
- [AI_RUNTIME.md](./AI_RUNTIME.md) — full pipeline
