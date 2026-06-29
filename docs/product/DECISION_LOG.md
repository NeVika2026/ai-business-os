<!-- markdownlint-disable MD013 MD060 MD036 -->

# AI Business OS — Product Decision Log v1.0

**Status:** Source of truth for product decisions  
**Date:** 2026-06-28  
**Owner:** Product

This document records **why** product decisions were made. It is not a changelog. It is not release notes.

---

## Overview

### Purpose

The Product Decision Log captures durable product choices — the reasoning behind them, what was rejected, and what follows. When a future debate reopens a settled question, this log is the authority.

Engineering, design, and product must align implementation to **Accepted** decisions. **Deprecated** or **Superseded** decisions remain in the log for history but must not guide new work.

### How decisions are recorded

1. Assign the next sequential ID: `DEC-xxx`.
2. Copy the [Decision template](#decision-template) below.
3. Set status to **Proposed** until product owner review.
4. On acceptance, set status to **Accepted** and link manifesto principles, gap IDs, and releases.
5. When a decision is reversed, do not delete the entry — set status to **Deprecated** or **Superseded** and link to the replacing decision.

New decisions require:

- Explicit **Context** (problem or tension)
- A clear **Decision** (what we chose)
- **Alternatives considered** (what we did not choose and why)
- **Consequences** (trade-offs, obligations, what teams must do differently)

### Status values

| Status | Meaning |
| ------ | ------- |
| **Proposed** | Under discussion; not binding |
| **Accepted** | Active; binding for all product and user-facing work |
| **Deprecated** | No longer recommended; retained for history |
| **Superseded** | Replaced by a newer decision; link to successor |

---

## Decision template

Use this structure for every entry:

```text
### DEC-xxx — Title

| Field | Value |
| ----- | ----- |
| **Date** | YYYY-MM-DD |
| **Status** | Proposed \| Accepted \| Deprecated \| Superseded |

**Context**
[Why this decision was needed]

**Decision**
[What we decided — one clear statement]

**Alternatives considered**
- [Option A] — rejected because …
- [Option B] — rejected because …

**Consequences**
- [Positive / negative trade-offs]
- [Obligations for engineering, design, content]

**Related Manifesto principles**
- [Principle names from PRODUCT_MANIFESTO.md]

**Related Product Gap IDs**
- GAP-xxx

**Related Releases**
- v3.x
```

---

## Cross references

| Document | Role |
| -------- | ---- |
| [PRODUCT_MANIFESTO.md](./PRODUCT_MANIFESTO.md) | Vision and principles — *what we believe* |
| [PRODUCT_GAP_ANALYSIS.md](./PRODUCT_GAP_ANALYSIS.md) | Current vs target — *what is wrong* |
| [FIRST_EXPERIENCE_AUDIT.md](../FIRST_EXPERIENCE_AUDIT.md) | Evidence baseline — *what we measured* |
| **DECISION_LOG.md** (this file) | Decision history — *why we chose* |

---

## Decisions

### DEC-001 — Goal-first UX

| Field | Value |
| ----- | ----- |
| **Date** | 2026-06-28 |
| **Status** | Accepted |

**Context**

Early platform structure followed technical modules: Orchestrator, Knowledge Base, AI Employees, CRM. Users encountered feature names before outcomes. FXA v1.0 confirmed new users cannot self-orient when navigation is module-first (Cabinet, OSA, Workspace, History as peers). The manifesto states users must understand only what they want to get — not internal architecture.

**Decision**

Users choose **outcomes and goals**, never modules. Navigation, copy, and first-run flows are organized around “What do you want to get?” All capabilities (CRM, knowledge, agents, runtime) serve goals in the background.

**Alternatives considered**

- **Module-first navigation** — rejected; mirrors backend structure but fails child principle and 30-second comprehension test.
- **Dashboard as home** — rejected; puts metrics and widgets before intent; contradicts AI Director Home vision.
- **Free-form chat only** — rejected; business owners need guided goal chips for faster first value; chat remains secondary.

**Consequences**

- Primary nav for new users must lead with goals, not feature areas.
- Cabinet and operational dashboards are secondary surfaces, not the first-run home.
- Every new screen must declare which user goal it advances.
- Closes direction for GAP-004, GAP-008, GAP-019.

**Related Manifesto principles**

- Goal First
- Result Before Features
- AI Director Home

**Related Product Gap IDs**

- GAP-004, GAP-008, GAP-019

**Related Releases**

- v3.0 (Phase A — FTU Home, progressive nav)
- v3.2 (Phase C — merge Home + Cabinet)

---

### DEC-002 — OSA is an invisible engine

| Field | Value |
| ----- | ----- |
| **Date** | 2026-06-28 |
| **Status** | Accepted |

**Context**

OSA currently exists as a standalone sidebar destination (`/osa`) with a multi-step wizard (onboarding → team → plan → workspace). Users must “launch OSA” after already choosing a goal on Home. FXA scored Invisible OSA at 3/10. Exposing OSA as a product contradicts the manifesto: OSA is the engine, not something users visit.

**Decision**

OSA **never** appears to end users as a destination or product name in primary flows. OSA runs in the background: understands the goal, assembles specialists, plans, executes, returns results. User-facing language uses plain outcomes (“Working on it…”, “Your workspace is ready”) — not “Open OSA” or “Launch team.”

**Alternatives considered**

- **OSA as branded AI assistant** — rejected; creates a second product inside the product; increases cognitive load.
- **Keep OSA in nav for power users** — deferred demotion only; primary FTU path must not require visiting `/osa`.
- **Remove OSA entirely** — rejected; engine is valuable; visibility is the problem, not the capability.

**Consequences**

- OSA nav item will be demoted or removed for new users (Phase B).
- Handoff flow must skip visible wizard steps where team/plan are precomputed.
- Marketing and UI copy must not use “OSA” without plain-language equivalent.
- Engineering may retain `/osa` route internally during transition; user-facing treatment changes.
- Closes GAP-001, GAP-005, GAP-007.

**Related Manifesto principles**

- Invisible OSA
- AI in the Background
- Our Promise

**Related Product Gap IDs**

- GAP-001, GAP-005, GAP-007, GAP-013

**Related Releases**

- v3.1 (Phase B — Invisible AI)

---

### DEC-003 — One screen, one primary decision

| Field | Value |
| ----- | ----- |
| **Date** | 2026-06-28 |
| **Status** | Accepted |

**Context**

Home v2.0 Concierge renders six sections with 15+ competing CTAs (chips, journeys, insights, daily mission). OSA adds 3–4 confirmation steps after goal selection. FXA failed the “one decision per screen” test. Manifesto: each screen has one primary action; three questions answered in five seconds.

**Decision**

Every user-facing screen has **exactly one primary CTA**. Secondary actions may exist but must be visually subordinate (text links, overflow menus). A screen with two equal-weight buttons is a design defect. Release gate: no user-facing release ships with multiple primary CTAs on any first-time screen.

**Alternatives considered**

- **Dashboard density for power users** — rejected for FTU; adaptive mode may expose more later (see DEC-007).
- **Progressive disclosure within same screen** — accepted as pattern only if one CTA remains dominant.
- **Wizard with multiple equal steps** — rejected when steps repeat decisions already made (goal → team → plan).

**Consequences**

- Home FTU mode collapses to greeting + goal picker (Phase A).
- OSA team and plan screens merge into single “Start” action (Phase B).
- Design review required for any screen with two filled buttons at equal visual weight.
- Closes GAP-004, GAP-005, GAP-012.

**Related Manifesto principles**

- One Decision Per Screen
- Three Questions Rule
- Child Principle

**Related Product Gap IDs**

- GAP-004, GAP-005, GAP-012

**Related Releases**

- v3.0, v3.1

---

### DEC-004 — Project is the universal container

| Field | Value |
| ----- | ----- |
| **Date** | 2026-06-28 |
| **Status** | Accepted |

**Context**

Work is scattered across OSA runs, History, Cabinet widgets, and optional manual project creation. Manifesto defines project not as a folder but as a **container of result** — documents, history, agents, memory, content, clients, analytics, automations. Today projects exist but auto-attachment is incomplete (GAP-010).

**Decision**

Every meaningful user outcome lives inside a **project**. When a user selects a goal, the system creates or selects a project automatically. Runs, documents, memory, and history link to that project without manual filing. “Project” is user-facing; internal storage mechanics are hidden.

**Alternatives considered**

- **Org-level flat history only** — rejected; does not match how owners think about client work and initiatives.
- **Manual project creation required** — rejected for FTU; adds friction after goal selection.
- **Workspace as container instead of project** — rejected; “workspace” is overloaded (GAP-002); project is the stable result noun.

**Consequences**

- First goal handoff auto-creates a project (Phase B).
- OSA runs persist project association by default.
- Unified workspace UI is project-scoped, not a separate empty `/workspace` nav item.
- Closes GAP-010.

**Related Manifesto principles**

- Project as Result Container
- Our Promise

**Related Product Gap IDs**

- GAP-010, GAP-002, GAP-011

**Related Releases**

- v3.1, v3.2

---

### DEC-005 — AI prepares workspace automatically

| Field | Value |
| ----- | ----- |
| **Date** | 2026-06-28 |
| **Status** | Accepted |

**Context**

Home copy promises “your workspace will be prepared” after goal selection. Handoff sessions precompute team, prompt, and session server-side — but users still pass through OSA wizard steps and land on an empty `/workspace` nav page. This breaks trust (FXA critical finding). Manifesto: user speaks the goal; system organizes everything else.

**Decision**

After goal selection, the platform **automatically prepares** the working context — team, plan, project, starter task — without user configuration. The user sees preparation progress, then a **ready workspace** with first action prefilled. “Prepared” must never mean an empty placeholder page.

**Alternatives considered**

- **User configures team manually** — rejected for handoff path; goal already implies team.
- **Defer workspace until user visits Projects** — rejected; violates promise and TTFV target.
- **Show full execution plan for approval** — rejected as mandatory step; plan available on demand only.

**Consequences**

- `/workspace` placeholder removed from nav or redirects to active project (Phase A).
- Handoff path skips team/plan confirmation when session is complete (Phase B).
- Starter prompt auto-runs or pre-fills first task (GAP-013).
- Closes GAP-002, GAP-005, GAP-013.

**Related Manifesto principles**

- Invisible OSA
- Our Promise
- AI in the Background

**Related Product Gap IDs**

- GAP-002, GAP-005, GAP-013

**Related Releases**

- v3.0, v3.1

---

### DEC-006 — Time To First Value under five minutes

| Field | Value |
| ----- | ----- |
| **Date** | 2026-06-28 |
| **Status** | Accepted |

**Context**

Manifesto primary metric: minutes until a new user receives first real value — target **under five minutes**. FXA estimated current TTFV at 7–12 minutes (magic link, Home exploration, OSA funnel, manual task). No production instrumentation exists yet (GAP-017).

**Decision**

**Time To First Value (TTFV)** is the north-star product metric. A new user must receive a usable AI result within **five minutes** of first visit (excluding optional email delay; OAuth improvements tracked separately). User-facing releases cannot ship if median FTU TTFV exceeds five minutes once instrumented.

**Alternatives considered**

- **Feature count as success metric** — rejected; contradicts manifesto.
- **Ten-minute TTFV target** — rejected; too weak for competitive onboarding.
- **TTFV without release gate** — rejected; metric must enforce behavior.

**Consequences**

- GAP-017 instrumentation is Phase A priority.
- Release gates in PRODUCT_GAP_ANALYSIS §9 are binding.
- PRs that add FTU steps require explicit gap closure justification.
- Closes GAP-017; drives GAP-005, GAP-013, GAP-018.

**Related Manifesto principles**

- First Value < 5 Minutes

**Related Product Gap IDs**

- GAP-017, GAP-005, GAP-013, GAP-018

**Related Releases**

- v3.0 (instrumentation + friction reduction)
- All subsequent user-facing releases

---

### DEC-007 — Adaptive interface

| Field | Value |
| ----- | ----- |
| **Date** | 2026-06-28 |
| **Status** | Accepted |

**Context**

Home v2.0 shows the same six-section Concierge to new users (empty metrics, no history) and returning users (runs, projects, insights). FXA: adaptive interface scored 4/10. Manifesto: platform adapts to user context — new vs returning, empty vs active.

**Decision**

The interface **changes by user context**. First-time users see minimal surfaces (welcome, 3–4 goals, one CTA). Returning users see continue journey, insights, and operational depth. Navigation unlocks progressively. Empty states always include a guided next action — never bare “None yet.”

**Alternatives considered**

- **Single static Home for all users** — rejected; overwhelms FTU, under-serves returning users.
- **Separate FTU app / onboarding app** — rejected; fragments product unity.
- **User-configurable dashboard** — deferred to Phase C; system adapts first, user pins later.

**Consequences**

- `loadConciergeData` or successor must branch on user maturity signals (zero runs, zero projects).
- Progressive nav hides Cabinet, History until first result (Phase A).
- Empty states require copy + CTA, not placeholders.
- Closes GAP-012, GAP-019.

**Related Manifesto principles**

- Adaptive Interface
- AI Director Home
- Child Principle

**Related Product Gap IDs**

- GAP-012, GAP-019, GAP-004

**Related Releases**

- v3.0 (FTU mode, progressive nav)
- v3.2 (full adaptive Home + Cabinet merge)

---

### DEC-008 — No technical terminology for end users

| Field | Value |
| ----- | ----- |
| **Date** | 2026-06-28 |
| **Status** | Accepted |

**Context**

User-facing copy exposes OSA, Navigator, Execution Plan, Orchestrator, Cabinet, Runtime-adjacent concepts. FXA terminology audit failed child principle and non-AI user tests. Manifesto: user must not understand CRM, Knowledge Base, Runtime, Orchestrator, or AI agents.

**Decision**

End-user surfaces use **plain business language only**. Internal names (OSA, Orchestrator, Navigator, Runtime, handoff) are engineering terms — never primary labels in UI, nav, or error messages. If a concept must surface, use outcome language (“your AI team”, “work history”, “plan summary”).

**Alternatives considered**

- **Educate users on OSA acronym** — rejected; violates invisible engine (DEC-002).
- **Bilingual jargon glossary** — rejected; adds learning burden.
- **Keep jargon in secondary/power areas only** — accepted temporarily during transition; must trend to zero in user-facing paths.

**Consequences**

- Copy review gate on all user-facing releases.
- Rename nav labels (e.g. Cabinet → plain equivalent or merge into Home).
- OSA team screen hides Confidence, Navigator, Primary/Secondary from default view.
- Closes GAP-007.

**Related Manifesto principles**

- Child Principle
- Invisible OSA
- Result Before Features

**Related Product Gap IDs**

- GAP-007, GAP-001

**Related Releases**

- v3.0 (language pass)
- v3.1 (OSA wizard simplification)

---

### DEC-009 — Every feature must close a Product Gap

| Field | Value |
| ----- | ----- |
| **Date** | 2026-06-28 |
| **Status** | Accepted |

**Context**

Platform accumulated modules (Orchestrator, Knowledge, AI Employees, Cabinet, OSA wizard) faster than product alignment. PRODUCT_GAP_ANALYSIS v1.0 defines 20 gaps and acceptance rules, but enforcement was process-only. Feature sprawl without gap closure perpetuates misalignment.

**Decision**

No user-facing feature ships unless it **closes at least one Product Gap** (GAP-xxx) documented in [PRODUCT_GAP_ANALYSIS.md](./PRODUCT_GAP_ANALYSIS.md). Every PR references Gap ID and manifesto principle. Infrastructure-only work is tagged explicitly with no user-facing surface change.

**Alternatives considered**

- **Roadmap-driven only, no gap linkage** — rejected; allows orphan features.
- **Engineering-driven backlog** — rejected for user-facing work; product gaps take precedence.
- **Gap closure post-hoc in release notes** — rejected; must be declared at PR time.

**Consequences**

- PR template must include `Product Gap: GAP-xxx`.
- Product owner rejects PRs without gap reference or Infrastructure tag.
- New gaps require PRODUCT_GAP_ANALYSIS update before implementation.
- Ties to DEC-010 for conflict resolution.

**Related Manifesto principles**

- All principles (enforcement mechanism)

**Related Product Gap IDs**

- GAP-001 through GAP-020 (framework)

**Related Releases**

- Effective immediately for all user-facing work post v1.0 log

---

### DEC-010 — Product decisions override implementation convenience

| Field | Value |
| ----- | ----- |
| **Date** | 2026-06-28 |
| **Status** | Accepted |

**Context**

Technical architecture favors explicit modules, routes, and wizards that map cleanly to code (separate `/osa`, `/cabinet`, `/workspace` pages). FXA and gap analysis show this convenience produces module-first UX that contradicts the manifesto. Teams may prefer reusing existing pages over restructuring flows.

**Decision**

When product decisions (this log, manifesto, gap analysis) conflict with **implementation convenience**, **product decisions win**. Teams must refactor UX and routing to match accepted decisions — not defer product alignment because “the page already exists.”

**Alternatives considered**

- **Technical convenience as tiebreaker** — rejected; produced current 4.2/10 alignment score.
- **Parallel FTU-only routes forever** — rejected as permanent; transition only.
- **Product compromise without log update** — rejected; compromises require new DEC entry or status change.

**Consequences**

- Phase B may inline OSA into Home/Project despite existing `/osa` route.
- Placeholder pages removed from nav even if routes remain for dev.
- Estimates for gap-closing work prioritized over greenfield modules.
- Escalation path: propose new DEC with status Proposed; do not silently diverge.

**Related Manifesto principles**

- Our Promise
- Goal First
- Product integrity over feature count

**Related Product Gap IDs**

- All gaps where current implementation reflects technical convenience (GAP-001, GAP-002, GAP-008)

**Related Releases**

- v3.0 through v3.2 (structural UX refactors)

---

## Index

| ID | Title | Status | Date |
| -- | ----- | ------ | ---- |
| DEC-001 | Goal-first UX | Accepted | 2026-06-28 |
| DEC-002 | OSA is an invisible engine | Accepted | 2026-06-28 |
| DEC-003 | One screen, one primary decision | Accepted | 2026-06-28 |
| DEC-004 | Project is the universal container | Accepted | 2026-06-28 |
| DEC-005 | AI prepares workspace automatically | Accepted | 2026-06-28 |
| DEC-006 | Time To First Value under five minutes | Accepted | 2026-06-28 |
| DEC-007 | Adaptive interface | Accepted | 2026-06-28 |
| DEC-008 | No technical terminology for end users | Accepted | 2026-06-28 |
| DEC-009 | Every feature must close a Product Gap | Accepted | 2026-06-28 |
| DEC-010 | Product decisions override implementation convenience | Accepted | 2026-06-28 |

---

## Document governance

| Action | Rule |
| ------ | ---- |
| Add decision | Product owner proposes; team review; set Accepted |
| Change decision | New DEC supersedes old; old entry → Superseded |
| Remove decision | Never delete — Deprecated or Superseded only |
| Review cadence | Quarterly + before major release |

*Product Decision Log v1.0 — why we build what we build.*
