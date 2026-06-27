# API — Tool Executor

> **Module:** `services/runtime/tool-executor/`  
> **Sprint:** C4  
> **Rule:** Only this module performs side effects (DB writes, HTTP external, search).

---

## 1. Facade

```typescript
// services/runtime/tool-executor/executor.ts

interface ToolExecutor {
  execute(call: ToolCall, context: ToolExecutionContext): Promise<ToolResult>;
  getDefinitions(enabledToolIds: string[]): ToolDefinition[];
}

interface ToolExecutionContext {
  scope: TenantScope;
  trace: TraceContext;
  employee: {
    id: UUID;
    permissions: Record<string, boolean>;
    enabledTools: string[];
  };
  supabase: SupabaseClient;   // injected at orchestrator boundary
}

export const toolExecutor: ToolExecutor;
```

---

## 2. Registry

```typescript
// services/runtime/tool-executor/registry.ts

interface ToolHandler {
  name: string;
  description: string;
  riskLevel: 'read' | 'write' | 'external' | 'destructive';
  parameters: JSONSchema;       // draft-07 subset
  requiredPermissions?: string[];
  approvalRequired?: boolean;
  execute(args: unknown, ctx: ToolExecutionContext): Promise<Record<string, unknown>>;
}

const registry: Record<string, ToolHandler> = {
  crm_read: crmReadTool,
  knowledge_search: knowledgeSearchTool,
  web_search: webSearchTool,   // stub in C4 MVP
};
```

### MVP tools

| Tool | Risk | Permission | C4 status |
|------|------|------------|-----------|
| `crm_read` | read | none | Implement |
| `knowledge_search` | read | none | Implement |
| `web_search` | external | `web_search` enabled | Stub returns empty |

Write tools (`crm_update`, `task_create`) — **registered but disabled** in C4.

---

## 3. execute() flow

```text
1. Validate tool name exists in registry
2. Check tool enabled on employee (ai_employees.tools jsonb)
3. Check permissions jsonb for required flags
4. Validate arguments against JSON Schema
5. Compute idempotencyKey = hash(runId + toolName + stableStringify(args))
6. If approvalRequired → return pending ToolResult (future)
7. Run handler with timeout (default 30s)
8. Emit tool.executed | tool.failed event
9. Return ToolResult
```

---

## 4. Tool schemas (MVP)

### crm_read

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

Query: `crm_leads` where `organization_id = scope.organizationId`.

### knowledge_search

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

Query: `knowledge_chunks` + join metadata, org scoped. MVP: ILIKE / simple match — vector search later.

### web_search (stub)

```json
{
  "type": "object",
  "properties": {
    "query": { "type": "string" }
  },
  "required": ["query"]
}
```

**Output (stub):**

```json
{ "results": [], "message": "web_search not implemented" }
```

---

## 5. ToolResult contract

See [DTO_SPEC.md](../architecture/DTO_SPEC.md#10-toolresult).

Orchestrator appends tool results to prompt messages for next gateway call:

```typescript
{
  role: 'tool',
  name: toolResult.name,
  toolCallId: toolResult.toolCallId,
  content: JSON.stringify(toolResult.output),
}
```

---

## 6. Idempotency

Same `idempotencyKey` within one run → return cached ToolResult (in-memory map on orchestrator instance).

Prevents duplicate CRM reads if model retries same tool call.

Cross-run idempotency — not EPIC C.

---

## 7. Audit log

Each execution writes `events` row:

```json
{
  "type": "tool.executed",
  "source": "orchestrator",
  "actor_type": "ai_employee",
  "actor_id": "<employeeId>",
  "correlation_id": "<runId>",
  "payload": {
    "tool_name": "crm_read",
    "tool_call_id": "call_abc",
    "success": true,
    "duration_ms": 45,
    "idempotency_key": "…",
    "output_summary": "1 lead returned"
  }
}
```

---

## 8. Orchestrator tool loop

```typescript
const MAX_TOOL_ROUNDS = 5;

for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
  const response = await aiGateway.complete(gatewayRequest);

  if (response.toolCalls.length === 0) {
    finalOutput = response.content;
    break;
  }

  for (const call of response.toolCalls) {
    const result = await toolExecutor.execute(call, ctx);
    messages.push(toToolMessage(result));
  }

  gatewayRequest = { ...gatewayRequest, messages };
}
```

If max rounds exceeded → `run_failed` with stage `tool`.

---

## 9. Security

- Tool handlers **must** use `ctx.scope.organizationId` on every query
- No tool may accept `organization_id` in arguments
- Destructive risk level → throw `ToolPermissionError` in C4
- External tools require explicit enable on employee

---

## 10. File layout

```text
services/runtime/tool-executor/
  executor.ts
  registry.ts
  validation.ts
  idempotency.ts
  tools/
    crm-read.ts
    knowledge-search.ts
    web-search.ts
```

---

## 11. Related docs

- [GATEWAY.md](./GATEWAY.md)
- [EVENTS.md](./EVENTS.md)
- [SECURITY.md](../architecture/SECURITY.md)
