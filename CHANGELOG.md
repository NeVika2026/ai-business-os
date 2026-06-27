# Changelog

All notable changes to AI Business OS.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added — EPIC C Architecture Freeze

- `docs/architecture/AI_RUNTIME.md` — runtime pipeline, layering, directory layout
- `docs/architecture/DTO_SPEC.md` — internal DTO contracts (ContextPackage, GatewayRequest, ToolCall, etc.)
- `docs/architecture/SECURITY.md` — tenant isolation, prompt injection, tool gates, secrets
- `docs/architecture/OBSERVABILITY.md` — trace, timeline, tokens, cost, audit
- `docs/architecture/PROVIDER_API.md` — provider adapter interface (OpenAI, Anthropic, Gemini, Groq, OpenRouter, Ollama)
- `docs/architecture/ADR/ADR-001-ai-runtime-layering.md` — layering decision record
- `docs/product/ROADMAP.md` — C1–C6 sprint plan
- `docs/product/BACKLOG.md` — EPIC C user stories
- `docs/product/USER_JOURNEYS.md` — execute, monitor, debug flows
- `docs/engineering/CODING_STANDARD.md` — runtime coding rules
- `docs/engineering/REVIEW_CHECKLIST.md` — PR checklist for EPIC C
- `docs/api/GATEWAY.md` — AI Gateway internal API
- `docs/api/TOOLS.md` — Tool Executor registry and contracts
- `docs/api/EVENTS.md` — Event bus runtime catalog

---

## [0.6.0] — 2026-06-27

### Added — Sprint B6: AI Orchestrator MVP

- `/orchestrator`, `/orchestrator/runs`, `/orchestrator/runs/[id]` pages
- Simulated `executeAgent` Server Action (agent_runs + events)
- Orchestrator sidebar navigation
- Execute button on AI Employee detail page

---

## [0.5.0] — 2026-06-27

### Added — Sprint B5: AI Employees MVP

- `/ai-employees`, `/ai-employees/[id]` with grid UI
- CRUD Server Actions for ai_employees
- Provider/model select from ai_providers / ai_models
- Agent runs and memories display on detail page

---

## [0.4.0] — 2026-06-27

### Added — Sprint B4: Knowledge Hub MVP

- `/knowledge`, `/knowledge/sources`, `/knowledge/sources/[id]`
- Knowledge source CRUD (DB record, no file upload)
- Import pipeline and queue stubs

---

## [0.3.0] — 2026-06-27

### Added — Sprint B3: CRM Leads MVP

- `/crm` with lead table and CRUD

---

## [0.2.0] — 2026-06-27

### Added — Sprint B2: App Shell

- Dashboard layout, sidebar, navigation, placeholder modules

---

## [0.1.0] — 2026-06-27

### Added — Sprint B1: Auth + Onboarding

- Magic link login, onboarding, organization bootstrap

---

## [0.0.1] — 2026-06-27

### Added — Sprint A3: Database

- Supabase migrations, RLS, seed data
- Master architecture document

---

[Unreleased]: https://github.com/NeVika2026/ai-business-os/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/NeVika2026/ai-business-os/commit/e38fee0
[0.5.0]: https://github.com/NeVika2026/ai-business-os/commit/426e7aa
[0.4.0]: https://github.com/NeVika2026/ai-business-os/commit/512d3ea
[0.3.0]: https://github.com/NeVika2026/ai-business-os/commit/b6b30d1
[0.2.0]: https://github.com/NeVika2026/ai-business-os/commit/6e9289b
[0.1.0]: https://github.com/NeVika2026/ai-business-os/commit/1403130
[0.0.1]: https://github.com/NeVika2026/ai-business-os/commit/356fc1b
