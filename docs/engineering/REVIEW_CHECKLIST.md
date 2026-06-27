# Engineering — Review Checklist

> Use for all PRs. **Mandatory for EPIC C (C1–C6).**

---

## Architecture (EPIC C)

- [ ] ADR-001 layering respected — no provider calls outside gateway
- [ ] Prompt Compiler has zero DB/fetch imports
- [ ] Context Builder has zero provider imports
- [ ] Tool Executor has zero LLM/gateway imports
- [ ] Knowledge/memory not injected as system prompt
- [ ] Side effects only through Tool Executor
- [ ] DTOs match `docs/architecture/DTO_SPEC.md`

---

## Security

- [ ] `organizationId` from server auth, never from client payload alone
- [ ] All DB queries filtered by `organization_id`
- [ ] No secrets in logs, events, or `agent_runs.output`
- [ ] Tool arguments schema-validated before execution
- [ ] Inactive employee cannot reach gateway (fail fast)
- [ ] Error messages sanitized for UI (`error_message` field)

---

## Observability

- [ ] `agent_runs.id` used as `events.correlation_id`
- [ ] `run_started` and `run_completed` / `run_failed` emitted
- [ ] Token counts written to `agent_runs.tokens_input/output`
- [ ] Tool calls emit audit events
- [ ] `revalidatePath` called for orchestrator + employee pages after execute

---

## Code quality

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] No new npm dependencies (or justified in PR description)
- [ ] No DB migrations (or explicitly approved)
- [ ] Server Actions remain thin — logic in `services/`
- [ ] Types in `types/`, not duplicated inline

---

## UI (if touched)

- [ ] Uses existing App Shell and design tokens
- [ ] No new UI libraries
- [ ] Server Components preferred; client only for interactivity
- [ ] Tailwind only

---

## Testing

- [ ] Pure modules have unit tests (compiler, gateway retry, tool validation)
- [ ] No live provider API calls in CI
- [ ] Edge cases: inactive employee, org mismatch, provider timeout

---

## Documentation

- [ ] Public API changes reflected in `docs/api/`
- [ ] New env vars in `.env.example`
- [ ] CHANGELOG updated for sprint close

---

## Quick reject triggers

Reject immediately if:

1. `openai` / `anthropic` import found in `app/` or `components/`
2. Knowledge chunk concatenated into `system` role message
3. CRM write without Tool Executor
4. Client component calls provider
5. Migration file added without approval task
