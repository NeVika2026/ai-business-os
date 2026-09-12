# Business Zavod Platform Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax.

**Goal:** Turn the existing OSA Home into the first usable “Бизнес Завод” platform shell while preserving OSA execution/runtime behavior.

**Architecture:** Add a platform configuration layer and thin UI components around existing OSA flows. Module pages only select/prefill work; OSA still executes through the existing Home actions and workspace/result pipeline.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, existing node:test suite.

**Spec:** docs/superpowers/specs/2026-09-12-business-zavod-platform-shell-design.md

## Global Constraints

- Do not change Runtime, Gateway, Memory, Knowledge, Automation, Orchestra or Supabase schema.
- Russian-first user-facing copy.
- Do not expose provider/model names in primary navigation or Home.
- Preserve existing OSA result/workspace execution flow.
- No commits or pushes unless explicitly requested.
- TDD for every behavior change.

---

### Task 1: Platform configuration

**Files:**
- Create: `utils/platform/business-zavod-config.ts`
- Create: `tests/platform/business-zavod-config.test.ts`
- Modify: `config/navigation.ts`

**Produces:** `BUSINESS_ZAVOD_NAVIGATION`, `BUSINESS_ZAVOD_MODULES`, `BUSINESS_ZAVOD_TASKS`, `getPlatformModule()`, `getPlatformTasks()`.

- [ ] Write failing tests that assert the exact navigation order, at least one task per primary work module, Russian labels, valid module hrefs, and no provider names.
- [ ] Run `npm test -- tests/platform/business-zavod-config.test.ts` and confirm RED.
- [ ] Implement the smallest config layer and map `MAIN_NAVIGATION` from it.
- [ ] Run the platform config test and confirm GREEN.

### Task 2: Platform discovery UI and module pages

**Files:**
- Create: `components/platform/PlatformTaskCatalog.tsx`
- Create: `components/platform/ModuleLanding.tsx`
- Create: `app/(dashboard)/modules/[module]/page.tsx`
- Create: `tests/platform/platform-ui-source.test.ts`

**Produces:** browsable module pages and task cards that link to `/home?prompt=...`.

- [ ] Write failing source-level tests for task catalog accessibility labels, module route existence, and task links targeting Home.
- [ ] Run the test and confirm RED.
- [ ] Implement generic module route and reusable task catalog.
- [ ] Run the test and confirm GREEN.

### Task 3: Voice input

**Files:**
- Create: `utils/platform/voice-input.ts`
- Create: `components/platform/VoiceInputButton.tsx`
- Create: `tests/platform/voice-input.test.ts`

**Produces:** optional browser speech input that appends a transcript into the existing prompt without breaking text entry.

- [ ] Write failing tests for transcript normalization/append behavior and unsupported-browser fallback.
- [ ] Run the voice test and confirm RED.
- [ ] Implement pure voice helpers.
- [ ] Implement the browser button using SpeechRecognition/webkitSpeechRecognition when available.
- [ ] Run the voice tests and confirm GREEN.

### Task 4: Shell + Home integration

**Files:**
- Modify: `components/layout/sidebar.tsx`
- Modify: `components/layout/app-shell.tsx`
- Modify: `components/home/OsaHomeActionScreen.tsx`
- Create: `tests/platform/business-zavod-shell.test.ts`

**Produces:** “Бизнес Завод” shell, persistent navigation, task catalog on Home, microphone button, and query-prefilled command center.

- [ ] Write failing tests for brand copy, platform nav wiring, task catalog presence, and Home prompt prefill contract.
- [ ] Run the shell test and confirm RED.
- [ ] Rebrand sidebar and make platform navigation persistent.
- [ ] Add task catalog and voice control to Home.
- [ ] Read `prompt` from search params once and prefill without auto-executing.
- [ ] Run shell tests and confirm GREEN.

### Task 5: Verification

- [ ] Run `npm test`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Start the dev server and manually check Home plus at least two module pages.
- [ ] Confirm task selection returns to Home with editable prefilled text.
- [ ] Confirm microphone unsupported state does not block typing.
- [ ] Inspect `git status --short` and `git diff --stat`.
- [ ] Do not deploy or merge until the verified local platform is reviewed.
