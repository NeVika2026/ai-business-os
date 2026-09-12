# Create Studio + Integrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a guided creation studio and a truthful integrations status dashboard to Business Zavod.

**Architecture:** Keep OSA as the execution brain. Add pure configuration/brief-building helpers, thin UI surfaces, and server-side integration status resolution. No paid provider calls are added in this phase.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, node:test, existing OSA runtime.

**Spec:** docs/superpowers/specs/2026-09-12-create-studio-integrations-design.md

## Global Constraints

- Do not expose secret values.
- Do not call paid providers in this iteration.
- Home/modules remain provider-neutral.
- Provider names may appear only on Integrations.
- Preserve existing OSA runtime, memory, project, and result flows.
- TDD before production code.
- No commit/push/deploy unless explicitly requested.

---

### Task 1: Create Studio brief model

**Files:**
- Create: `utils/platform/create-studio.ts`
- Create: `tests/platform/create-studio.test.ts`

**Produces:** `CREATE_STUDIO_MODES`, `buildCreateStudioPrompt()`.

- [ ] Write tests for the six creation modes, structured Russian prompt output, optional fields, and provider-neutral copy.
- [ ] Run the test and confirm RED because the module does not exist.
- [ ] Implement the minimal types, catalog and prompt compiler.
- [ ] Run the test and confirm GREEN.

### Task 2: Create Studio UI and route

**Files:**
- Create: `components/platform/CreateStudio.tsx`
- Create: `app/(dashboard)/modules/create/studio/page.tsx`
- Modify: `utils/platform/business-zavod-config.ts`
- Modify: `tests/platform/platform-ui-source.test.ts`

**Produces:** guided creation form that sends an editable brief to `/home?prompt=...`.

- [ ] Extend source tests to require Studio route, mode selection and router handoff.
- [ ] Run test and confirm RED.
- [ ] Build the Studio UI.
- [ ] Route creation tasks through Studio.
- [ ] Run tests and confirm GREEN.

### Task 3: Integration status model

**Files:**
- Create: `utils/platform/integration-catalog.ts`
- Create: `tests/platform/integration-catalog.test.ts`
- Modify: `.env.example`

**Produces:** `INTEGRATION_CATALOG`, `resolveIntegrationStatuses(env)` returning only metadata and booleans/status.

- [ ] Write tests for connected/missing/built-in statuses and secret non-disclosure.
- [ ] Run test and confirm RED.
- [ ] Implement catalog and resolver.
- [ ] Add Runway and ElevenLabs variable names to `.env.example` with empty values.
- [ ] Run test and confirm GREEN.

### Task 4: Integrations dashboard

**Files:**
- Create: `components/platform/IntegrationsDashboard.tsx`
- Modify: `app/(dashboard)/settings/page.tsx`
- Modify: `tests/platform/platform-ui-source.test.ts`

**Produces:** server-rendered integrations page showing capability and connection state.

- [ ] Extend source tests for integrations component and server-side resolver use.
- [ ] Run test and confirm RED.
- [ ] Implement dashboard and settings route.
- [ ] Run test and confirm GREEN.

### Task 5: Verification

- [ ] Run all platform tests.
- [ ] Run full `npm test`.
- [ ] Run `npm run lint` and require 0 errors.
- [ ] Run `npm run build`.
- [ ] Restart local dev server and smoke-check `/login`, `/modules/create/studio`, `/settings`.
- [ ] Inspect `git status --short` and `git diff --stat`.
