# API — Event Bus

> **Table:** `events` (existing, A3)  
> **Usage:** Runtime observability, audit, module integration

---

## 1. Schema (frozen)

```sql
events (
  id              uuid PK,
  organization_id uuid NOT NULL,
  type            text NOT NULL,
  version         text DEFAULT '1.0',
  source          text NOT NULL,
  actor_type      text DEFAULT 'user',
  actor_id        uuid,
  payload         jsonb DEFAULT '{}',
  metadata        jsonb DEFAULT '{}',
  correlation_id  uuid,
  created_at      timestamptz DEFAULT now()
)
```

**Indexes used by runtime:** `correlation_id`, `(organization_id, created_at DESC)`.

---

## 2. Naming convention

```text
{domain}.{action}
```

Runtime domain: `run_*`, `gateway.*`, `tool.*`, `context.*`, `memory.*`, `prompt.*`, `knowledge.*`

Legacy (seed): `lead.created`, `task.assigned`, `agent.run.completed`, `knowledge.import.completed`

Both styles coexist. New runtime events use short form per EPIC C freeze.

---

## 3. Runtime event catalog

### Orchestrator lifecycle

| type | source | actor_type | When |
|------|--------|------------|------|
| `run_started` | orchestrator | user | Run created |
| `run_completed` | orchestrator | ai_employee | Success |
| `run_failed` | orchestrator | system / ai_employee | Failure |

### Pipeline stages (C6)

| type | source | payload keys |
|------|--------|----------------|
| `context.built` | orchestrator | `employee_id`, `duration_ms` |
| `memory.retrieved` | orchestrator | `entry_count`, `enabled` |
| `knowledge.retrieved` | orchestrator | `chunk_count`, `truncated` |
| `prompt.compiled` | orchestrator | `message_count`, `tool_count` |
| `gateway.request` | gateway | `provider_code`, `model_code` |
| `gateway.response` | gateway | `duration_ms`, `tokens_input`, `tokens_output`, `finish_reason` |
| `gateway.retry` | gateway | `attempt`, `delay_ms`, `error_code` |
| `gateway.error` | gateway | `error_code`, `retryable` |
| `tool.executed` | orchestrator | `tool_name`, `tool_call_id`, `success`, `duration_ms`, `idempotency_key` |
| `tool.failed` | orchestrator | `tool_name`, `error_code`, `message` |

---

## 4. Payload contract (common fields)

Every runtime event payload **should** include:

```json
{
  "run_id": "uuid",
  "ai_employee_id": "uuid"
}
```

Additional fields per event type (see catalog).

**Never include:** API keys, full prompts, full CRM records, raw knowledge chunks.

---

## 5. correlation_id rules

| Scenario | correlation_id |
|----------|----------------|
| Top-level agent run | `agent_runs.id` |
| Sub-agent run (future) | parent `agent_runs.id` |
| CRM event triggering run | original business event id (future) |

Query timeline:

```typescript
supabase
  .from('events')
  .select('*')
  .eq('organization_id', organizationId)
  .eq('correlation_id', runId)
  .order('created_at', { ascending: true });
```

---

## 6. Emitter API

```typescript
// services/runtime/observability/event-emitter.ts

interface EventEmitter {
  emit(params: {
    organizationId: UUID;
    type: string;
    source: string;
    actorType: 'user' | 'ai_employee' | 'system';
    actorId?: UUID | null;
    correlationId: UUID;
    payload: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<UUID>;   // returns event id
}
```

Used by: orchestrator, gateway, tool-executor.

---

## 7. agent_runs.event_id

`agent_runs.event_id` references the **triggering** event (optional).

B6 behavior: set to `run_started` event id.

Do not confuse with `correlation_id` on events (which equals run id).

---

## 8. Versioning

- `events.version` default `1.0`
- Breaking payload change → bump version, support read of old version in UI
- Event type rename requires ADR + migration script for historical data (out of EPIC C scope)

---

## 9. RLS

- SELECT: any org member (`get_user_role IS NOT NULL`)
- INSERT: any org member
- DELETE: owner/admin only

Runtime only **inserts** during execute. UI **selects** for timeline.

---

## 10. B6 → C migration

Existing events remain valid. C6 adds granular events without changing schema.

`RunTimeline` component should display unknown event types gracefully (show raw `type`).

---

## 11. Related docs

- [OBSERVABILITY.md](../architecture/OBSERVABILITY.md)
- [AI_RUNTIME.md](../architecture/AI_RUNTIME.md)
- [TOOLS.md](./TOOLS.md)
