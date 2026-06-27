# User Journeys — AI Runtime

> **Scope:** EPIC C execution flows. Not chat UX.

---

## Journey 1: Execute AI Employee (primary)

**Actor:** Organization member  
**Precondition:** At least one active `ai_employee`, user logged in  
**Entry:** `/ai-employees/[id]`

```text
1. User opens AI Employee detail page
2. User reviews role, model, tools, memory settings
3. User clicks "▶ Execute"
4. System:
   a. Validates auth + organization_id
   b. Creates agent_run (running)
   c. Emits run_started event
   d. [C1+] Context Builder loads employee + knowledge + memory
   e. [C2] Prompt Compiler builds PromptRequest
   f. [C1] AI Gateway calls provider
   g. [C4] If tool_calls → Tool Executor loop
   h. Updates agent_run (completed | failed)
   i. Emits run_completed | run_failed
   j. [C5] Optional memory persist (future)
5. User redirected to /orchestrator/runs/[id]
6. User inspects timeline, output, memory snapshot, knowledge sources
```

**Success:** Run status `completed`, output visible, events in timeline  
**Failure:** Run status `failed`, error_message visible, run_failed event

---

## Journey 2: Monitor orchestrator dashboard

**Actor:** Organization member  
**Entry:** `/orchestrator`

```text
1. User opens Orchestrator
2. Sees stats: total, successful, failed, running, today
3. Sees last 10 runs in table
4. Clicks run ID → run detail
5. Or clicks "Все запуски" → full runs list
```

**Success:** Stats match org-scoped agent_runs  
**Failure:** Empty state if no runs yet

---

## Journey 3: Debug failed run

**Actor:** Organization admin  
**Entry:** `/orchestrator/runs/[id]`

```text
1. User opens failed run
2. RunSummary shows error_message + status badge
3. Event Timeline shows:
   - run_started
   - [optional] gateway.error / tool.failed
   - run_failed
4. User checks which stage failed (output.error.stage in C6)
5. User opens linked AI Employee → fixes config or retries Execute
```

**Success:** Failure stage identifiable without server logs  
**Failure:** N/A

---

## Journey 4: Tool-assisted lead qualification (C4+)

**Actor:** Sales AI Employee (configured with crm_read + knowledge_search)  
**Trigger:** Execute with input `{ action: "qualify_lead", payload: { lead_id } }`

```text
1. Context Builder loads employee + CRM context hint in userIntent
2. Prompt Compiler includes knowledge about sales process
3. Gateway returns tool_call: crm_read { lead_id }
4. Tool Executor fetches lead (org scoped), emits tool.executed
5. Gateway second call with tool result
6. Gateway returns tool_call: knowledge_search { query }
7. Tool Executor searches chunks, returns results
8. Gateway final response with qualification summary
9. agent_runs.output contains structured qualification
```

**Success:** Lead data never sent to wrong org; tools audited  
**Failure:** Permission denied → tool.failed, model may abort gracefully

---

## Journey 5: Inactive employee execution attempt

**Actor:** Organization member  
**Entry:** `/ai-employees/[id]` (inactive employee)

```text
1. Execute button disabled in UI
2. If forced via tampered request:
   - Run created (running)
   - run_started emitted
   - Immediately failed: "AI employee is inactive"
   - run_failed emitted
3. User sees failed run in orchestrator
```

**Success:** No gateway call for inactive employee (C1: fail before gateway)  
**Current B6 behavior:** Fails after run_started without gateway — C1 should fail earlier if possible

---

## Journey 6: Cross-tenant isolation (security)

**Actor:** Malicious user in Org B  
**Attack:** Submit ai_employee_id from Org A

```text
1. Server Action resolves organizationId from session (Org B)
2. Employee lookup: .eq('organization_id', organizationId)
3. Employee not found → error before run created
4. No data leak
```

**Success:** 404/ error, no agent_run  
**Mandatory for all journeys**

---

## UI touchpoints (existing — no new pages in EPIC C)

| Page | Runtime interaction |
|------|---------------------|
| `/ai-employees/[id]` | Execute button → executeAgent |
| `/orchestrator` | Stats + recent runs (read) |
| `/orchestrator/runs` | Full runs table (read) |
| `/orchestrator/runs/[id]` | Run detail, timeline, memory, knowledge (read) |

EPIC C enriches data on existing pages; no new routes required.
