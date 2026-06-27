# Engineering — Coding Standard

> **Applies to:** All code including EPIC C (AI Runtime)  
> **Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, Supabase SSR

---

## 1. Project structure

```text
app/                    # Routes, Server Actions (thin)
components/             # UI only
services/               # Business logic, runtime, supabase
types/                  # Shared TypeScript types
utils/                  # Pure helpers, mappers
config/                 # Navigation, static config
docs/                   # Architecture and product docs
supabase/migrations/    # Schema (frozen unless approved)
```

**No `src/` directory.**

---

## 2. Layer rules (AI Runtime)

| Layer | Can import | Cannot import |
|-------|------------|---------------|
| `app/` | services, types, utils, components | provider SDKs, runtime internals directly in UI |
| `services/runtime/gateway/` | providers, types/runtime | tool-executor, app |
| `services/runtime/prompt-compiler/` | types/runtime only | supabase, fetch, providers |
| `services/runtime/context-builder/` | supabase, types/runtime | providers, gateway |
| `services/runtime/tool-executor/` | supabase, types/runtime | gateway, providers |
| `services/runtime/providers/` | fetch, types/runtime | supabase (prefer injected credentials) |

---

## 3. TypeScript

- Strict mode enabled
- Prefer `interface` for DTOs, `type` for unions
- No `any` — use `unknown` + narrowing
- Runtime DTOs live in `types/runtime/dto.ts`
- DB row mappers in `utils/` or co-located `*.mapper.ts`

---

## 4. Server Actions

Server Actions are **auth boundaries only**:

```typescript
'use server';

export async function executeAgent(formData: FormData) {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);
  // validate input
  const result = await runtimeOrchestrator.execute(supabase, execution);
  revalidatePath(...);
  redirect(...);
}
```

- Always verify `auth.getUser()`
- Always resolve `organizationId` server-side
- Business logic in `services/`, not in action file

---

## 5. Supabase

- Server: `services/supabase/server.ts`
- Client: `services/supabase/client.ts` (UI auth only)
- Never expose `SERVICE_ROLE` to client
- All tenant queries: `.eq('organization_id', organizationId)`
- RLS is defense-in-depth, not sole guard

---

## 6. Error handling

```typescript
// Runtime errors — structured
throw new RuntimeError('gateway_failed', message, { stage: 'gateway', retryable: true });

// User-facing — sanitized
agent_runs.error_message = sanitizeForUser(error.message);
```

- Never expose provider API keys or raw stack traces to client
- Log structured errors server-side with runId

---

## 7. Files and naming

| Kind | Convention | Example |
|------|------------|---------|
| Service | `kebab-case.ts` or domain name | `gateway.ts`, `compiler.ts` |
| Component | `PascalCase.tsx` | `RunTimeline.tsx` |
| Type file | domain | `types/runtime/dto.ts` |
| Test | `*.test.ts` next to source | `compiler.test.ts` |

---

## 8. Forbidden (unless approved)

- New UI libraries (shadcn, etc.)
- New ORM (Prisma)
- New validation lib (Zod) — use manual parse in actions
- Provider SDK npm packages — use `fetch` in C1
- Direct LLM calls from `app/` or `components/`
- DB migrations without explicit task approval

---

## 9. Comments

- Code should be self-explanatory
- Comment only: non-obvious business rules, security constraints, ADR references
- No commented-out code in commits

---

## 10. Environment variables

- Document in `.env.example` when added
- Access only in server modules (gateway, providers)
- Never prefix with `NEXT_PUBLIC_` for secrets

---

## 11. Testing (EPIC C minimum)

| Module | Required tests |
|--------|----------------|
| Prompt Compiler | Unit — message order, injection blocks |
| Gateway | Unit — retry logic, error mapping |
| Provider adapters | Unit — mock fetch fixtures |
| Tool Executor | Unit — schema validation, permissions |
| Context Builder | Integration — optional with test DB |

`npm run lint` and `npm run build` must pass before PR.

---

## 12. Git commits

- One sprint per commit when closing sprints
- Message format: `C1: implement AI gateway` or `B6: implement AI orchestrator MVP`
- No auto-commit unless user requests
