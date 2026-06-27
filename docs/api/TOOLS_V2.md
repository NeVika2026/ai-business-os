# API — Tool Executor v2

> **Version:** 2.0.0  
> **Sprint:** C5.0 (architecture freeze)  
> **Module:** `services/runtime/tool-executor/`  
> **Supersedes:** [TOOLS.md](./TOOLS.md) for C5.1+ implementation  
> **Rule:** Only this module performs side effects.

---

## 1. Overview

Tool Executor v2 formalizes the execution pipeline, registry schema, permission model, and DTO extensions introduced in [TOOL_EXECUTOR.md](../architecture/TOOL_EXECUTOR.md).

```text
ToolCall → Validator → Permission → Approval → Registry → Execute → Audit → ToolResult
```

---

## 2. Public facade

```typescript
// services/runtime/tool-executor/executor.ts

interface ToolExecutorContext {
  scope: TenantScope;
  trace: TraceContext;
  employee: {
    id: UUID;
    roleTitle: string;
    permissions: Record<string, boolean>;
    tools: Array<{ id: string; enabled: boolean }>;
  };
  supabase: SupabaseClient;            // injected at orchestrator boundary only
  approvalTokens?: Record<string, ApprovalToken>;  // toolCallId → token
}

interface ToolExecutor {
  execute(call: ToolCall, ctx: ToolExecutorContext): Promise<ToolResult>;
  getDefinitions(enabledToolIds: string[]): ToolDefinition[];
  listRegisteredTools(): RegisteredToolSummary[];
}

export const toolExecutor: ToolExecutor;
```

### execute()

Single entry point. Orchestrator calls once per `ToolCall` from Gateway.

**Input:** existing `ToolCall` DTO + execution context.  
**Output:** existing `ToolResult` DTO.

Never throws for business failures — returns `ToolResult { success: false }`. Throws only for programmer errors (e.g. missing ctx.supabase).

---

## 3. Pipeline stages (internal)

```typescript
// services/runtime/tool-executor/pipeline.ts

async function runToolPipeline(
  call: ToolCall,
  ctx: ToolExecutorContext,
): Promise<ToolResult> {
  const request = buildToolRequest(call, ctx);           // → ToolRequest
  const validated = validateToolRequest(request);        // → validated args | ToolError
  const permitted = checkPermissions(request, validated);
  const approval = checkApproval(request, permitted);
  const registered = resolveFromRegistry(request.call.name);
  const cached = checkIdempotency(request.idempotencyKey);
  if (cached) return cached;
  const output = await executeWithRetry(buildToolExecution(...));
  const audit = writeAuditLog(...);
  return toToolResult(output, audit);
}
```

---

## 4. Tool Registry API

### 4.1 RegisteredTool

```typescript
type ToolCategory =
  | 'crm'
  | 'knowledge'
  | 'ai'
  | 'communication'
  | 'files'
  | 'web'
  | 'storage'
  | 'integrations'
  | 'system'
  | 'mcp';

interface ToolRetryPolicy {
  maxAttempts: number;
  backoffMs: number[];
  retryableErrors: string[];
}

interface ToolPermissionSpec {
  requiredFlags: string[];
  allowedRoles?: string[];
  deniedRoles?: string[];
  orgFeatureFlag?: string;
  categoryDefault: boolean;
}

interface ToolApprovalPolicy {
  required: boolean;
  reason: string;
  expiresAfterMs?: number;
  approverRoles?: ('admin' | 'owner' | 'member')[];
}

interface RegisteredTool {
  id: string;
  name: string;
  description: string;
  version: string;
  category: ToolCategory;
  inputSchema: Record<string, unknown>;   // JSON Schema draft-07 subset
  outputSchema: Record<string, unknown>;
  permissions: ToolPermissionSpec;
  timeoutMs: number;
  retryPolicy: ToolRetryPolicy;
  approvalPolicy: ToolApprovalPolicy;
  enabled: boolean;
  handler: ToolHandler;
}

type ToolHandler = (
  args: Record<string, unknown>,
  ctx: ToolHandlerContext,
) => Promise<Record<string, unknown>>;

interface ToolHandlerContext {
  scope: TenantScope;
  trace: TraceContext;
  employeeId: UUID;
  supabase: SupabaseClient;
  signal: AbortSignal;                   // linked to timeoutMs
}
```

### 4.2 Registry functions

```typescript
// services/runtime/tool-executor/registry.ts

function registerTool(tool: RegisteredTool): void;
function getTool(id: string): RegisteredTool | undefined;
function listTools(filter?: { category?: ToolCategory }): RegisteredTool[];
function toToolDefinitions(enabledIds: string[]): ToolDefinition[];
```

### 4.3 MVP tools (C5.1)

| id | category | version | timeout | retry | approval |
|----|----------|---------|---------|-------|----------|
| `crm_read` | crm | 1.0.0 | 30s | 3× read | no |
| `knowledge_search` | knowledge | 1.0.0 | 30s | 3× read | no |
| `web_search` | web | 1.0.0 | 15s | 2× read | no |
| `crm_update` | crm | 1.0.0 | 30s | 1× write | yes |
| `email_send` | communication | 1.0.0 | 60s | 1× write | yes |

---

## 5. DTO reference

### 5.1 Existing (frozen)

From `types/runtime/dto.ts` — **do not modify**:

#### ToolDefinition

LLM-facing schema. Produced by registry `toToolDefinitions()`.

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}
```

#### ToolCall

Produced by AI Gateway from LLM response.

```typescript
interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  audit: {
    runId: UUID;
    employeeId: UUID;
    organizationId: UUID;
    requestedAt: ISODateTime;
  };
}
```

#### ToolResult

Produced by Tool Executor. Consumed by orchestrator.

```typescript
interface ToolResult {
  toolCallId: string;
  name: string;
  success: boolean;
  output: Record<string, unknown> | string | null;
  error?: { code: string; message: string };
  audit: {
    runId: UUID;
    durationMs: number;
    approvalRequired: boolean;
    approved: boolean;
    idempotencyKey: string;
    executedAt: ISODateTime;
  };
}
```

### 5.2 New (C5.1 — `types/runtime/tool-dto.ts`)

#### ToolRequest

Envelope after orchestrator passes ToolCall to executor.

```typescript
interface ToolRequest {
  call: ToolCall;
  scope: TenantScope;
  trace: TraceContext;
  employee: {
    id: UUID;
    roleTitle: string;
    permissions: Record<string, boolean>;
    enabledTools: string[];
  };
  idempotencyKey: string;
  requestedAt: ISODateTime;
}
```

**Why new:** Separates provider output from tenant-scoped execution intent. Enables validation and permission checks before registry lookup.

#### ToolExecution

Immutable context for handler invocation.

```typescript
interface ToolExecution {
  request: ToolRequest;
  tool: { id: string; version: string; category: ToolCategory };
  validatedArguments: Record<string, unknown>;
  approval: {
    required: boolean;
    approved: boolean;
    approvedBy?: UUID | null;
    approvedAt?: ISODateTime | null;
  };
  startedAt: ISODateTime;
}
```

**Why new:** Audit and retry layers need a stable snapshot distinct from mutable request state.

#### ToolError

Structured failure. Maps to `ToolResult.error` + audit payload.

```typescript
interface ToolError {
  code: string;
  message: string;
  retryable: boolean;
  stage: 'validation' | 'permission' | 'approval' | 'registry' | 'execution' | 'timeout';
  details?: Record<string, unknown>;
}
```

**Why new:** Existing `ToolResult.error` lacks `retryable` and `stage`. Required for retry policy and observability without breaking ToolResult shape.

---

## 6. Tool Validator

```typescript
// services/runtime/tool-executor/validation.ts

function validateToolRequest(request: ToolRequest): ValidationResult;

interface ValidationResult {
  ok: true;
  arguments: Record<string, unknown>;
} | {
  ok: false;
  error: ToolError;   // stage: 'validation'
}
```

### Validation rules

1. Tool name exists in registry.
2. Tool globally enabled.
3. Arguments validate against `inputSchema` (JSON Schema draft-07 subset).
4. Reject unknown properties if schema has `additionalProperties: false`.
5. Strip/sanitize string fields (HTML, script tags).
6. Reject arguments containing `organization_id`, `org_id`, `tenant_id`.
7. Enforce max argument payload size: 32 KB serialized.

---

## 7. Permission Check API

```typescript
// services/runtime/tool-executor/permissions.ts

function checkPermissions(
  request: ToolRequest,
  tool: RegisteredTool,
): PermissionResult;

interface PermissionResult {
  allowed: boolean;
  error?: ToolError;   // stage: 'permission', code: PERMISSION_DENIED
  deniedLevel?: 'organization' | 'employee' | 'role' | 'user';
}
```

### Check order

```text
1. organization — org feature flag / plan
2. employee    — tool enabled on ai_employees.tools
3. role        — roleTitle vs allowedRoles / deniedRoles
4. user        — scope.userId restrictions (write tools need user context in MVP)
```

---

## 8. Approval Check API

```typescript
// services/runtime/tool-executor/approval.ts

interface ApprovalToken {
  toolCallId: string;
  runId: UUID;
  approvedBy: UUID;
  approvedAt: ISODateTime;
  expiresAt: ISODateTime;
}

function checkApproval(
  request: ToolRequest,
  tool: RegisteredTool,
  tokens?: Record<string, ApprovalToken>,
): ApprovalResult;
```

### Operations requiring approval (default)

| Pattern | tools | approvalPolicy.required |
|---------|-------|-------------------------|
| Delete data | `*_delete` | true |
| Send email/SMS | `email_send`, `sms_send` | true |
| Publish externally | `*_publish`, `webhook_post` | true |
| External API write | `http_post`, `hubspot_update` | true |
| Financial | `invoice_*`, `payment_*` | true |
| CRM write | `crm_update`, `crm_create` | true (MVP) |

Read tools: `approvalPolicy.required = false`.

---

## 9. Idempotency API

```typescript
// services/runtime/tool-executor/idempotency.ts

function computeIdempotencyKey(
  runId: UUID,
  toolName: string,
  args: Record<string, unknown>,
): string;

function getCachedResult(key: string): ToolResult | null;
function cacheResult(key: string, result: ToolResult): void;
```

**Scope:** single run instance (orchestrator-held Map).  
**Key input:** post-validation canonical arguments.  
**Behavior:** cache hit → return prior `ToolResult`, audit `cached: true`.

---

## 10. Retry API

```typescript
// services/runtime/tool-executor/retry.ts

async function executeWithRetry(
  execution: ToolExecution,
  tool: RegisteredTool,
  handler: ToolHandler,
  ctx: ToolHandlerContext,
): Promise<HandlerResult>;
```

### Error classification

| code | retryable | notes |
|------|-----------|-------|
| `VALIDATION_*` | false | fix args |
| `PERMISSION_*` | false | policy |
| `APPROVAL_*` | false | human action |
| `REGISTRY_*` | false | config |
| `TIMEOUT` | true | if policy allows |
| `NETWORK_ERROR` | true | transient |
| `RATE_LIMITED` | true | respect backoff |
| `EXTERNAL_503` | true | provider down |
| `EXECUTION_FAILED` | false | default for writes |

---

## 11. Audit API

```typescript
// services/runtime/tool-executor/audit.ts

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
  input: Record<string, unknown>;
  outputSummary: string | null;
  durationMs: number;
  status: 'success' | 'failed' | 'pending_approval';
  error?: ToolError;
  idempotencyKey: string;
  approvalRequired: boolean;
  approved: boolean;
  approvedBy?: UUID | null;
  executedAt: ISODateTime;
  cached: boolean;
}

async function writeAuditLog(
  record: ToolAuditRecord,
  supabase: SupabaseClient,
): Promise<void>;
```

### Required audit fields (mandatory)

| Field | Required |
|-------|----------|
| trace id | yes |
| run id | yes |
| tool id | yes |
| input | yes (redacted) |
| output | yes (summary) |
| duration | yes |
| status | yes |
| error | yes if failed |

---

## 12. MCP (future)

MCP tools register with `category: 'mcp'` and id `mcp/{serverId}/{toolName}`.

```typescript
// Future — not implemented in C5.0

interface McpToolBridge {
  discover(serverId: string): Promise<RegisteredTool[]>;
  invoke(tool: McpRegisteredTool, args: Record<string, unknown>): Promise<Record<string, unknown>>;
}
```

Same pipeline applies. MCP adapter is a `ToolHandler` implementation behind registry.

---

## 13. Tool schemas (MVP)

### crm_read

**Input:**

```json
{
  "type": "object",
  "properties": {
    "lead_id": { "type": "string", "format": "uuid" },
    "limit": { "type": "integer", "minimum": 1, "maximum": 50 }
  },
  "additionalProperties": false
}
```

**Output:**

```json
{
  "leads": [{ "id": "uuid", "name": "string", "status": "string" }],
  "count": 1
}
```

### knowledge_search

**Input:**

```json
{
  "type": "object",
  "properties": {
    "query": { "type": "string", "minLength": 1, "maxLength": 500 },
    "limit": { "type": "integer", "minimum": 1, "maximum": 20 }
  },
  "required": ["query"],
  "additionalProperties": false
}
```

**Output:**

```json
{
  "chunks": [{ "chunkId": "uuid", "sourceTitle": "string", "content": "string", "score": 0.82 }],
  "count": 3
}
```

### web_search (stub)

**Output:**

```json
{ "results": [], "message": "web_search not implemented" }
```

---

## 14. Orchestrator tool loop

```typescript
const MAX_TOOL_ROUNDS = execution.options?.maxToolRounds ?? 5;

for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
  const response = await aiGateway.complete(gatewayRequest);

  if (response.toolCalls.length === 0) {
    finalOutput = response.content;
    break;
  }

  for (const call of response.toolCalls) {
    const result = await toolExecutor.execute(call, toolCtx);
    messages.push(toToolMessage(result));

    if (result.audit.approvalRequired && !result.audit.approved) {
      await pauseRunForApproval(runId, call.id);
      return toAwaitingApprovalResult(...);
    }
  }

  gatewayRequest = { ...gatewayRequest, messages };
}
```

---

## 15. Error codes

| Code | Stage | retryable |
|------|-------|-----------|
| `VALIDATION_SCHEMA` | validation | false |
| `VALIDATION_UNKNOWN_TOOL` | validation | false |
| `VALIDATION_TENANT_ARG` | validation | false |
| `PERMISSION_ORG` | permission | false |
| `PERMISSION_EMPLOYEE` | permission | false |
| `PERMISSION_ROLE` | permission | false |
| `PERMISSION_USER` | permission | false |
| `APPROVAL_REQUIRED` | approval | false |
| `APPROVAL_EXPIRED` | approval | false |
| `REGISTRY_NOT_FOUND` | registry | false |
| `EXECUTION_TIMEOUT` | timeout | true |
| `EXECUTION_NETWORK` | execution | true |
| `EXECUTION_FAILED` | execution | false |

---

## 16. File layout

```text
services/runtime/tool-executor/
  executor.ts
  pipeline.ts
  registry.ts
  validation.ts
  permissions.ts
  approval.ts
  idempotency.ts
  retry.ts
  audit.ts
  errors.ts
  types.ts
  tools/
    crm-read.ts
    knowledge-search.ts
    web-search.ts
  mcp/                    # future
    adapter.ts
    discovery.ts
```

---

## 17. Security summary

- Handlers **must** scope all queries by `ctx.scope.organizationId`.
- No tool accepts tenant id in arguments.
- Destructive / external tools disabled by default in registry.
- Audit log is append-only via `events` insert.
- Output sanitized before returning to LLM.

---

## 18. Related docs

- [TOOL_EXECUTOR.md](../architecture/TOOL_EXECUTOR.md) — architecture
- [ADR-002-tool-executor.md](../architecture/ADR/ADR-002-tool-executor.md)
- [DTO_SPEC.md](../architecture/DTO_SPEC.md)
- [GATEWAY.md](./GATEWAY.md)
- [SECURITY.md](../architecture/SECURITY.md)
- [TOOLS.md](./TOOLS.md) — v1 reference (C4 era)
