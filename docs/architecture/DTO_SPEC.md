# AI Runtime — Internal DTO Specification

> **Version:** 1.0.0  
> **Location (implementation):** `types/runtime/dto.ts`  
> **Rule:** DTOs are plain TypeScript types/interfaces. Serializable to JSON. No Supabase client types inside runtime core.

All DTOs include tenant scope where applicable.

---

## 1. Shared primitives

```typescript
type UUID = string;
type ISODateTime = string;

interface TenantScope {
  organizationId: UUID;
  projectId?: UUID | null;
  userId?: UUID | null;       // human who triggered run
}

interface TraceContext {
  runId: UUID;                // agent_runs.id
  correlationId: UUID;        // same as runId for top-level runs
  parentRunId?: UUID | null;
  traceId: UUID;              // observability trace (may equal runId in MVP)
}
```

---

## 2. ContextPackage

**Producer:** Context Builder  
**Consumers:** Prompt Compiler, Observability

```typescript
interface ContextPackage {
  scope: TenantScope;
  trace: TraceContext;
  employee: {
    id: UUID;
    name: string;
    roleTitle: string;
    systemPrompt: string | null;   // from ai_employees.system_prompt ONLY
    configuration: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    };
    tools: Array<{ id: string; enabled: boolean }>;
    permissions: Record<string, boolean>;
  };
  provider: {
    id: UUID;
    code: string;                  // openai | anthropic | google | ...
  };
  model: {
    id: UUID;
    code: string;                  // gpt-4o | claude-sonnet-4 | ...
    contextWindow: number | null;
    supportsTools: boolean;
  };
  task?: {
    id: UUID;
    title: string;
    input: Record<string, unknown>;
  } | null;
  userIntent: {
    action: string;                // e.g. "execute", "qualify_lead"
    payload: Record<string, unknown>;
  };
  retrievedAt: ISODateTime;
}
```

**Rules:**
- `systemPrompt` comes only from `ai_employees.system_prompt`.
- Knowledge and memory are **not** embedded here; they are separate packages.

---

## 3. KnowledgePackage

**Producer:** Context Builder (knowledge retrieval)  
**Consumer:** Prompt Compiler

```typescript
interface KnowledgeChunkRef {
  chunkId: UUID;
  itemId: UUID;
  sourceId: UUID;
  sourceTitle: string;
  content: string;
  score?: number;                // retrieval rank
  tokenEstimate?: number;
}

interface KnowledgePackage {
  scope: TenantScope;
  trace: TraceContext;
  query: string;
  chunks: KnowledgeChunkRef[];
  totalChunks: number;
  truncated: boolean;            // true if hit token budget
  retrievedAt: ISODateTime;
}
```

**Rules:**
- Injected as **context message**, never as system prompt.
- Max chunks default: 20. Max tokens default: 4000 (configurable in Context Builder).

---

## 4. MemoryPackage

**Producer:** Memory Manager (retrieve)  
**Consumer:** Prompt Compiler

```typescript
interface MemoryEntry {
  id: UUID;
  scope: 'organization' | 'ai_employee' | 'project' | string;
  content: string;
  importance: number;
  lastUsedAt?: ISODateTime | null;
}

interface MemoryPackage {
  scope: TenantScope;
  trace: TraceContext;
  employeeId: UUID;
  entries: MemoryEntry[];
  enabled: boolean;              // from ai_employees.memory.enabled
  retrievedAt: ISODateTime;
}
```

**Rules:**
- Injected as labeled context block, not system prompt.
- Retrieval scoped by `organization_id` + employee memory config.

---

## 5. PromptRequest

**Producer:** Prompt Compiler  
**Consumer:** AI Gateway (via conversion to GatewayRequest)

```typescript
type PromptRole = 'system' | 'user' | 'assistant' | 'tool';

interface PromptMessage {
  role: PromptRole;
  content: string;
  name?: string;                 // tool name when role=tool
  toolCallId?: string;
}

interface PromptRequest {
  scope: TenantScope;
  trace: TraceContext;
  model: string;                   // provider model code
  messages: PromptMessage[];
  tools?: ToolDefinition[];        // JSON-schema style, gateway-normalized
  parameters: {
    temperature: number;
    maxTokens: number;
    topP?: number;
  };
  metadata: {
    employeeId: UUID;
    compilerVersion: string;       // e.g. "1.0.0"
  };
}

interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;  // JSON Schema subset
}
```

**Prompt Compiler message order (fixed):**
1. `system` — employee system prompt + role instructions (static, from employee only)
2. `user` — memory block (if any)
3. `user` — knowledge block (if any)
4. `user` — user intent / task input
5. `assistant` / `tool` — conversation history (future)
6. Tool results appended in loop

---

## 6. PromptResponse

**Producer:** Prompt Compiler (validation/normalization of gateway output)  
**Consumer:** Orchestrator, Tool Executor decision

```typescript
interface PromptResponse {
  trace: TraceContext;
  content: string | null;
  toolCalls: ToolCall[];
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
  raw?: Record<string, unknown>;   // optional, stripped before persist
}
```

---

## 7. GatewayRequest

**Producer:** AI Gateway (from PromptRequest)  
**Consumer:** Provider Adapter

```typescript
interface GatewayRequest {
  scope: TenantScope;
  trace: TraceContext;
  providerCode: string;            // openai | anthropic | google | groq | openrouter | ollama
  modelCode: string;
  messages: PromptMessage[];
  tools?: ToolDefinition[];
  parameters: {
    temperature: number;
    maxTokens: number;
    topP?: number;
  };
  timeoutMs: number;               // default 60000
  retryPolicy: {
    maxAttempts: number;           // default 3
    backoffMs: number[];
  };
}
```

---

## 8. GatewayResponse

**Producer:** Provider Adapter → AI Gateway  
**Consumer:** Orchestrator, Observability

```typescript
interface GatewayResponse {
  trace: TraceContext;
  providerCode: string;
  modelCode: string;
  content: string | null;
  toolCalls: ToolCall[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  finishReason: string;
  providerRequestId?: string;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}
```

---

## 9. ToolCall

**Producer:** Gateway / LLM response parser  
**Consumer:** Tool Executor

```typescript
interface ToolCall {
  id: string;                      // provider tool call id
  name: string;                    // registry tool id, e.g. crm_read
  arguments: Record<string, unknown>;
  audit: {
    runId: UUID;
    employeeId: UUID;
    organizationId: UUID;
    requestedAt: ISODateTime;
  };
}
```

---

## 10. ToolResult

**Producer:** Tool Executor  
**Consumer:** Prompt Compiler (next loop iteration)

```typescript
interface ToolResult {
  toolCallId: string;
  name: string;
  success: boolean;
  output: Record<string, unknown> | string | null;
  error?: {
    code: string;
    message: string;
  };
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

---

## 11. AgentExecution

**Producer:** Server Action / API boundary  
**Consumer:** Runtime Orchestrator

```typescript
interface AgentExecution {
  scope: TenantScope;
  employeeId: UUID;
  taskId?: UUID | null;
  parentRunId?: UUID | null;
  input: {
    action: string;
    payload: Record<string, unknown>;
  };
  options?: {
    dryRun?: boolean;              // skip side effects, still trace
    maxToolRounds?: number;
    skipMemoryWrite?: boolean;
  };
}
```

---

## 12. AgentResult

**Producer:** Runtime Orchestrator  
**Consumer:** Server Action, UI

```typescript
interface AgentResult {
  trace: TraceContext;
  status: 'completed' | 'failed' | 'cancelled';
  output: Record<string, unknown> | null;
  error?: {
    code: string;
    message: string;
    stage: 'context' | 'prompt' | 'gateway' | 'tool' | 'memory';
  };
  usage: {
    inputTokens: number;
    outputTokens: number;
    toolCallCount: number;
    gatewayCallCount: number;
  };
  timeline: Array<{
    stage: string;
    startedAt: ISODateTime;
    durationMs: number;
    status: 'ok' | 'error';
  }>;
  completedAt: ISODateTime;
}
```

---

## 13. Persistence mapping

| DTO field | DB column |
|-----------|-----------|
| `AgentExecution.input` | `agent_runs.input` |
| `AgentResult.output` | `agent_runs.output` |
| `AgentResult.usage.inputTokens` | `agent_runs.tokens_input` |
| `AgentResult.usage.outputTokens` | `agent_runs.tokens_output` |
| `trace.runId` | `agent_runs.id` |
| `trace.correlationId` | `events.correlation_id` |
| Tool audit | `events` payload + optional `agent_runs.output.tool_audit[]` |
| Cost (future) | `agent_runs.credits_consumed` |

---

## 14. Versioning

- DTO breaking changes require bump in `compilerVersion` and ADR.
- Event payloads use `events.version` (default `1.0`).
- Provider adapters must tolerate unknown tool definitions gracefully.
