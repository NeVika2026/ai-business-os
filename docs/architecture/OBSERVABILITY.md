# AI Runtime — Observability

> **Version:** 1.0.0  
> **Sprint:** C6 (Runtime Observability)  
> **Storage:** Existing tables — `agent_runs`, `events`. No new migrations in EPIC C.

---

## 1. Goals

Every agent execution must be **explainable after the fact**:

- What was requested?
- What context was loaded?
- Which model was called, how long, how many tokens?
- Which tools ran, with what outcome?
- Where did it fail?

Observability is not optional logging — it is a **first-class runtime output** consumed by Orchestrator UI (`/orchestrator/runs/[id]`).

---

## 2. Trace model

### 2.1 Identifiers

| ID | Source | Usage |
|----|--------|-------|
| `runId` | `agent_runs.id` | Primary execution id |
| `correlationId` | Same as `runId` for top-level runs | Links all `events` for one run |
| `traceId` | UUID generated at run start | Future distributed tracing; MVP = `runId` |
| `parentRunId` | `agent_runs.parent_run_id` | Sub-agent chains |

**Rule:** Every `events` row for a run uses `correlation_id = runId`.

### 2.2 Trace context (in-memory)

```typescript
interface RuntimeTrace {
  runId: UUID;
  correlationId: UUID;
  traceId: UUID;
  organizationId: UUID;
  employeeId: UUID;
  startedAt: ISODateTime;
  spans: TraceSpan[];
}

interface TraceSpan {
  name: string;           // e.g. "context.build", "gateway.complete", "tool.crm_read"
  startedAt: ISODateTime;
  durationMs: number;
  status: 'ok' | 'error';
  attributes: Record<string, string | number | boolean>;
  error?: string;
}
```

---

## 3. Agent run timeline

Timeline is reconstructed from:

1. `agent_runs` row (start, end, status, tokens)
2. `events` where `correlation_id = runId`, ordered by `created_at`

### 3.1 Standard event types (runtime)

| Event type | Source | When |
|------------|--------|------|
| `run_started` | orchestrator | Run created, status=running |
| `context.built` | context-builder | ContextPackage ready |
| `memory.retrieved` | memory-manager | MemoryPackage ready |
| `knowledge.retrieved` | context-builder | KnowledgePackage ready |
| `prompt.compiled` | prompt-compiler | PromptRequest ready |
| `gateway.request` | gateway | Before provider call |
| `gateway.response` | gateway | After provider call |
| `tool.executed` | tool-executor | Each tool call |
| `tool.failed` | tool-executor | Tool error |
| `run_completed` | orchestrator | Success |
| `run_failed` | orchestrator | Failure |

Existing B6 events (`run_started`, `run_completed`, `run_failed`) remain. C6 adds granular events as optional — UI timeline merges all.

### 3.2 UI mapping (existing pages)

`/orchestrator/runs/[id]` — `RunTimeline` component reads `events` by `correlation_id`.

Extend payload schema:

```json
{
  "run_id": "uuid",
  "ai_employee_id": "uuid",
  "stage": "gateway",
  "duration_ms": 842,
  "tokens_input": 120,
  "tokens_output": 85
}
```

---

## 4. Metrics

### 4.1 Per-run metrics (persisted)

Stored on `agent_runs`:

| Field | Description |
|-------|-------------|
| `tokens_input` | Sum of gateway input tokens |
| `tokens_output` | Sum of gateway output tokens |
| `credits_consumed` | Cost estimate (numeric, future pricing table) |
| `started_at` | Run start |
| `completed_at` | Run end |

Additional metrics in `agent_runs.output.observability` (jsonb, no migration):

```json
{
  "observability": {
    "gatewayCallCount": 2,
    "toolCallCount": 1,
    "totalLatencyMs": 1523,
    "providerLatenciesMs": [842, 681],
    "retryCount": 0
  }
}
```

### 4.2 Aggregates (orchestrator dashboard)

Computed server-side from `agent_runs` (existing B6 pattern):

- Total runs, successful, failed, running, today
- Avg duration (completed_at - started_at)
- Total tokens (sum tokens_input + tokens_output)

Future C6: provider error rate by `providerCode`.

---

## 5. Model latency

Gateway records per-call latency:

```typescript
// GatewayResponse.latencyMs
// Span: gateway.complete { providerCode, modelCode, latencyMs, finishReason }
```

Persisted in:
- `events.payload.duration_ms` on `gateway.response`
- `agent_runs.output.observability.providerLatenciesMs[]`

---

## 6. Token usage

Provider adapter parses usage from native response:

| Provider | Input field | Output field |
|----------|-------------|--------------|
| OpenAI | `usage.prompt_tokens` | `usage.completion_tokens` |
| Anthropic | `usage.input_tokens` | `usage.output_tokens` |
| Gemini | `usageMetadata.promptTokenCount` | `usageMetadata.candidatesTokenCount` |

Gateway normalizes to `GatewayResponse.usage`.

Multi-turn tool loops: **sum** tokens across all gateway calls in one run.

---

## 7. Cost tracking

EPIC C MVP: estimate only, store in `credits_consumed`.

```text
credits = (inputTokens * inputPrice + outputTokens * outputPrice) / 1000
```

Prices read from static config map keyed by `modelCode` (no DB). Real billing is a later epic.

If price unknown: `credits_consumed = null`.

---

## 8. Provider errors

### 8.1 Error classification

| Code | Retryable | Example |
|------|-----------|---------|
| `rate_limit` | yes | HTTP 429 |
| `timeout` | yes | Request exceeded timeoutMs |
| `provider_error` | maybe | HTTP 5xx |
| `auth_error` | no | HTTP 401 |
| `invalid_request` | no | Bad model name |
| `content_filter` | no | Safety block |

### 8.2 Persistence

- `agent_runs.error_message` — user-safe message (max 500 chars)
- `agent_runs.output.error` — structured `{ code, retryable, providerRequestId }`
- `events` type `run_failed` or `gateway.error` with payload

### 8.3 Retry attempts

Gateway retry policy (default):

```text
maxAttempts: 3
backoffMs: [500, 1500, 3000]
retryOn: rate_limit, timeout, provider_error (5xx only)
```

Each retry emits `gateway.retry` event with `{ attempt, delayMs, errorCode }`.

---

## 9. Tool call audit

Every tool execution emits `tool.executed` or `tool.failed`:

```json
{
  "run_id": "uuid",
  "tool_name": "crm_read",
  "tool_call_id": "call_abc",
  "success": true,
  "duration_ms": 45,
  "idempotency_key": "run_uuid:crm_read:hash(args)",
  "output_summary": "3 leads returned"
}
```

**Never** log full tool output if it contains PII — use `output_summary` only.

Full ToolResult stored in-memory during loop; summary only in events.

---

## 10. Implementation layout (C6)

```text
services/runtime/observability/
  tracer.ts          # RuntimeTrace, span start/end
  metrics.ts         # token sum, latency sum
  event-emitter.ts   # write to events table
  flush.ts           # persist observability blob to agent_runs.output
```

Orchestrator calls:

```text
const trace = tracer.start(execution);
try {
  // each stage: tracer.span('context.build', () => ...)
} finally {
  await tracer.flush(supabase, runId);
}
```

---

## 11. Non-goals (EPIC C)

- OpenTelemetry export
- External APM (Datadog, etc.)
- Real-time streaming metrics WebSocket
- Log retention policies (use Supabase defaults)
