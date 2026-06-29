<!-- markdownlint-disable MD013 MD060 -->

# AI Business OS — Product Gap Analysis v1.0

**Status:** Master product alignment document  
**Date:** 2026-06-28  
**Authority:** Every future feature must reference this document  
**Sources:** [Product Manifesto](./PRODUCT_MANIFESTO.md) · [First Experience Audit](../FIRST_EXPERIENCE_AUDIT.md)

---

## 1. Product Vision

Core principles extracted from the manifesto. Full narrative lives in [PRODUCT_MANIFESTO.md](./PRODUCT_MANIFESTO.md).

| Principle | Meaning |
|-----------|---------|
| **Goal First** | The product is organized around what the user wants to achieve — not CRM, Runtime, Orchestrator, or other internal modules. |
| **Result Before Features** | Users come for outcomes. Capabilities exist to serve goals, never as destinations. |
| **Invisible OSA** | OSA is the platform engine, not a product users launch. It understands goals, assembles specialists, plans, executes, and returns results without ceremony. |
| **One Decision Per Screen** | Each screen has one primary action. No card overload, no professional jargon. |
| **Three Questions Rule** | Every screen must answer in five seconds: What is happening? What will I get? What do I do next? |
| **Child Principle** | If a twelve-year-old cannot understand a screen, the screen is wrong — not the user. |
| **Project as Result Container** | A project holds everything tied to an outcome: documents, history, agents, memory, content, clients, analytics, automations. |
| **AI Director Home** | Home is not a dashboard. It is a personal AI director asking: *What will move my business forward today?* |
| **AI in the Background** | The best AI is barely noticed. Users notice results. |
| **First Value < 5 Minutes** | The primary product metric is minutes until a new user receives real, usable value — target under five minutes. |
| **Adaptive Interface** | The interface adapts to user state (new vs returning, empty vs active) — showing only what advances the current goal. |
| **Our Promise** | *You say what you want. We organize everything else.* |

**Intended user path:**

```text
Sign in → Welcome → What do you want today? → (invisible preparation) → Workspace ready → First result
```

---

## 2. Current Product

Screen-by-screen analysis of what ships today (Home v2.0 Concierge on `develop`).

### Landing (`/`)

| Field | Detail |
| ----- | ------ |
| **Purpose** | First touchpoint; explain the product and route users to sign in or Home. |
| **User expectation** | “What is this?” and “Is this for me?” within seconds. |
| **Current implementation** | Server redirect only — logged out → `/login`, logged in → `/home`. No copy, no value proposition. |
| **Problems** | Zero product story. Fails 30-second comprehension test. No welcome moment. |

### Login (`/login`)

| Field | Detail |
| ----- | ------ |
| **Purpose** | Secure entry with minimal friction. |
| **User expectation** | Quick sign-in and a hint of what happens next. |
| **Current implementation** | Magic-link form. Title “AI Business OS”; Russian subtitle; English “Continue” button. Errors in Russian. |
| **Problems** | Language split. No outcome promise. “Business OS” is jargon. Magic link adds email delay to TTFV. |

### Home (`/home`)

| Field | Detail |
| ----- | ------ |
| **Purpose** | Personal AI director — daily starting point for business progress. |
| **User expectation** | “She already knows what I need” within one minute. One clear next step. |
| **Current implementation** | AI Concierge: header with 3 metrics, 9 conversation chips, 5 suggested journeys, continue journey, personal insights, daily mission. Goal chips trigger server handoff → `/osa?handoff=<id>`. |
| **Problems** | Six sections, 15+ competing CTAs. Duplicate goal paths (chips, journeys, daily mission). Empty metrics (“None yet”) without guidance. “OSA” and “workspace” mentioned without explanation. English copy; OSA ahead is Russian. |

### Goal Handoff (Home → OSA)

| Field | Detail |
| ----- | ------ |
| **Purpose** | Translate a user goal into prepared context so AI can act immediately. |
| **User expectation** | Pick a goal once; system prepares everything silently. |
| **Current implementation** | `startGoalHandoff` creates DB session, persists events, navigates to OSA with handoff ID. Prefills team, prompt, session. Loading state: “OSA is preparing your workspace…” |
| **Problems** | Still routes to visible OSA wizard. User must confirm team, plan, workspace, and task. Handoff is backend-invisible but UX-visible. |

### OSA (`/osa`)

| Field | Detail |
| ----- | ------ |
| **Purpose** | Engine that assembles team, plans, executes, and returns results. |
| **User expectation** | Invisible preparation; user should not “launch OSA.” |
| **Current implementation** | Standalone nav item and page. Multi-step flow: onboarding → loading (1.6s) → team → plan → workspace → task result. Run history below fold. Russian UI; internal labels (Navigator, Confidence %, Execution Plan). |
| **Problems** | OSA is a product destination, not a background engine. Too many steps after goal already chosen. Jargon exposed. Language mismatch with Home. Artificial loading delay. |

### Projects (`/projects`, `/projects/[id]`)

| Field | Detail |
| ----- | ------ |
| **Purpose** | Container for business outcomes — all related work lives here. |
| **User expectation** | Work automatically attaches to the right project; project feels like “my result,” not a folder. |
| **Current implementation** | Project list and workspace with live data (runs, activity, modules, timeline). Manual create from OSA prompt optional. |
| **Problems** | Not auto-created from first goal. User must understand “project” as a separate concept. Runs not always linked without explicit action. Feels like a PM tool adjacent to Home/OSA. |

### Workspace (`/workspace`)

| Field | Detail |
| ----- | ------ |
| **Purpose** | Unified place to work with prepared context and see results. |
| **User expectation** | “Workspace is ready” after choosing a goal — one place to work. |
| **Current implementation** | Placeholder page: “Unified workspace shell — connect modules and OSA execution context here.” Real task UI lives inside OSA flow (“OSA Workspace” step). |
| **Problems** | Broken promise. Two conflicting “workspace” meanings. Worst trust failure in the funnel. |

### History (`/history`)

| Field | Detail |
| ----- | ------ |
| **Purpose** | Review past AI work and outcomes. |
| **User expectation** | Simple record of “what the system did for me.” |
| **Current implementation** | Execution history from live runs. Mentions “OSA and orchestrator” in subtitle. |
| **Problems** | Duplicate of OSA run history and Cabinet widgets. “Orchestrator” is internal jargon. Competes with Home “continue journey.” |

### Cabinet (`/cabinet`)

| Field | Detail |
| ----- | ------ |
| **Purpose** | Operational overview of business activity. |
| **User expectation** | Unclear — overlaps with Home as a second “home base.” |
| **Current implementation** | Live dashboard: stats, activity, modules, health, quick actions, workspace card. |
| **Problems** | Module-first layout contradicts goal-first vision. Duplicates Home metrics and History. Adds nav complexity for new users who need one starting point. |

---

## 3. Manifesto Alignment

| Principle | Current (0–10) | Target | Gap | Priority |
|-----------|----------------|--------|-----|----------|
| Goal First | 5 | 10 | Home chips are goal-oriented, but nav and Cabinet still module-first | Critical |
| Result Before Features | 4 | 10 | Users routed through OSA, Cabinet, Projects as features | Critical |
| Invisible OSA | 3 | 10 | OSA is a standalone nav destination with 5-step wizard | Critical |
| One Decision Per Screen | 3 | 10 | Home has 15+ choices; OSA has 3–4 post-goal confirmations | Critical |
| Three Questions Rule | 4 | 10 | Workspace placeholder and OSA team screen fail all three questions | High |
| Child Principle | 3 | 10 | OSA, Navigator, Orchestrator, Cabinet unexplained | High |
| Project as Result Container | 5 | 10 | Projects exist but auto-attachment incomplete | High |
| AI Director Home | 6 | 10 | Concierge direction correct; density undermines “director” feel | Medium |
| AI in the Background | 4 | 10 | User sees team cards, plans, agents, traces | Critical |
| First Value < 5 Minutes | 4 | 10 | Magic link + 4–5 clicks + OSA steps; likely > 5 min for new users | Critical |
| Adaptive Interface | 4 | 10 | Same Home for new and returning users; empty states unguided | High |
| Our Promise | 5 | 10 | Handoff partially delivers; broken Workspace and manual task break promise | Critical |

### Overall alignment score: 4.2 / 10

---

## 4. UX Friction Map

Measured from [FXA v1.0](../FIRST_EXPERIENCE_AUDIT.md) against manifesto targets.

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| **Clicks to first value** | 4–5 in-app (+ magic-link email) | ≤ 2 | ❌ |
| **Reading time (Home)** | 45–90 seconds (full page) | ≤ 15 seconds | ❌ |
| **Decision count (pre-result)** | 15+ on Home; 3–4 in OSA after goal | 1 per screen | ❌ |
| **Navigation switches** | Home → OSA (+ sidebar tempts 6 other modules) | 0–1 (stay in flow) | ❌ |
| **Unknown terminology (user-facing)** | OSA, Cabinet, Workspace, Navigator, Execution Plan, Orchestrator, AI Concierge | 0 jargon terms | ❌ |
| **Empty states without guidance** | Home metrics, Workspace nav, Settings | Guided next action on every empty state | ❌ |
| **Manual actions after goal pick** | Confirm team, confirm plan, enter workspace, type task | 0 (auto-run from goal) | ❌ |
| **Estimated TTFV (new user)** | ~7–12 minutes (email + exploration + OSA funnel) | < 5 minutes | ❌ |
| **Language consistency** | Mixed EN/RU across Login, Home, OSA | Single locale per session | ❌ |
| **Primary CTAs per screen** | Home: many; OSA team + plan: 2 sequential | 1 | ❌ |

---

## 5. Product Gap Backlog

Every gap must be closed or explicitly deferred. Features reference Gap IDs in PRs.

| ID | Title | Description | Business impact | Priority | Difficulty | Est. release |
|----|-------|-------------|-----------------|----------|------------|--------------|
| GAP-001 | OSA visible as product | OSA appears in nav and as a multi-step wizard users must visit | Breaks “invisible engine” promise; increases abandonment | Critical | Medium | v3.1 |
| GAP-002 | Workspace placeholder in nav | `/workspace` is empty while Home promises “workspace prepared” | Destroys trust at peak expectation | Critical | Low | v3.0 |
| GAP-003 | No product story at entry | Root redirect gives zero value proposition | Users cannot self-qualify in 30 seconds | Critical | Low | v3.0 |
| GAP-004 | Home decision overload | Six sections, duplicate goal entry points | “Where do I click?” instead of “she understands me” | Critical | Medium | v3.0 |
| GAP-005 | OSA funnel after goal | Team → plan → workspace → manual task after goal already chosen | Adds 3–4 unnecessary decisions; TTFV > 5 min | Critical | Medium | v3.1 |
| GAP-006 | Language inconsistency | EN Home, RU Login/OSA | Product feels broken or unfinished | High | Low | v3.0 |
| GAP-007 | User-facing jargon | OSA, Navigator, Orchestrator, Execution Plan, Cabinet exposed | Fails child principle and non-AI user test | High | Low | v3.0 |
| GAP-008 | Cabinet duplicates Home | Two control centers for the same user | Module-first navigation; cognitive split | High | Medium | v3.2 |
| GAP-009 | History triplication | History page, OSA run history, Cabinet widget | Duplicate navigation; unclear canonical “past work” | Medium | Medium | v3.2 |
| GAP-010 | Project not auto-created | First goal does not auto-create result container | Manual “Create project”; weak result-container model | High | Medium | v3.1 |
| GAP-011 | First result has no “what’s next” | Output shown without clear save/continue path | User wins once but does not know how to return | High | Medium | v3.1 |
| GAP-012 | No first-time adaptive Home | New users see same dense Concierge as power users | Overwhelms before first value | High | Medium | v3.0 |
| GAP-013 | Manual first task entry | Handoff starter prompt not auto-run | Extra typing step after goal selection | High | Low | v3.1 |
| GAP-014 | Artificial OSA loading delay | Fixed 1.6s wait without meaningful progress | Perceived slowness without value | Medium | Low | v3.0 |
| GAP-015 | Disabled header affordances | Search and notifications visible but disabled | Signals unfinished product | Low | Low | v3.0 |
| GAP-016 | Settings placeholder | Settings nav leads to empty shell | Trust erosion if discovered early | Medium | Medium | v3.2 |
| GAP-017 | No TTFV instrumentation | Product KPI not measured in production | Cannot enforce < 5 min gate | Critical | Medium | v3.0 |
| GAP-018 | Magic-link-only login | Email round-trip before first session | Adds minutes to TTFV for new users | Medium | Medium | v3.2 |
| GAP-019 | Nav complexity for new users | Seven sidebar items on first visit | Module-first before first result | High | Low | v3.0 |
| GAP-020 | OSA onboarding textarea for cold start | Direct `/osa` visit still shows business description form | Extra step when not arriving from Home | Medium | Low | v3.1 |

---

## 6. Roadmap

Phases align product delivery to manifesto principles. Technical EPICs (Runtime, Gateway) continue in parallel but must close gaps to ship user-facing releases.

### Phase A — Reduce Friction (v3.0)

**Goal:** First value under five minutes for motivated new users.

| Focus | Closes |
|-------|--------|
| FTU Home mode (one hero, 3–4 chips, hide empty sections) | GAP-004, GAP-012 |
| Hide Workspace nav / redirect to active context | GAP-002 |
| Unified language pass (Login + OSA) | GAP-006 |
| Remove user-facing jargon | GAP-007 |
| Progressive nav for new users | GAP-019 |
| Login value proposition | GAP-003 |
| TTFV analytics foundation | GAP-017 |
| Remove artificial loading delay | GAP-014 |

### Phase B — Invisible AI (v3.1)

**Goal:** OSA works in the background; user picks a goal and receives a result.

| Focus | Closes |
|-------|--------|
| Collapse OSA wizard for handoff (skip team/plan screens) | GAP-001, GAP-005 |
| Auto-run first task from handoff prompt | GAP-013 |
| First-result success screen with one next step | GAP-011 |
| Auto-create project from first goal | GAP-010 |
| Demote OSA from primary nav | GAP-001 |
| Inline workspace on Home/Project (not `/osa` route) | GAP-002, GAP-001 |

### Phase C — Adaptive Product (v3.2)

**Goal:** One product feel; interface adapts to user maturity and activity.

| Focus | Closes |
|-------|--------|
| Merge Home + Cabinet into adaptive “director” surface | GAP-008 |
| Unified history experience | GAP-009 |
| Real Settings (profile, org, preferences) | GAP-016 |
| Project as full result container (auto-link runs, docs, memory) | GAP-010 |
| OAuth / faster login options | GAP-018 |

### Phase D — Predictive Business OS (v4.0+)

**Goal:** Platform anticipates what will move the business forward.

| Focus | Direction |
|-------|-----------|
| Proactive daily mission from real signals | AI Director Home at full manifesto depth |
| Predictive suggestions before user asks | Adaptive Interface |
| Cross-project intelligence | Project as Result Container |
| Retention loops and second-visit value | KPI: Time to Second Visit, Weekly Retention |

---

## 7. Acceptance Rules

### Feature gate

A feature **cannot** be implemented unless it closes at least one Product Gap (GAP-xxx) or is explicitly tagged **Infrastructure** (no user-facing surface change).

### Pull request requirements

Every user-facing PR must include:

```text
Product Gap: GAP-xxx
Closes: [one-line description of how this PR reduces the gap]
Manifesto principle: [e.g. Invisible OSA, One Decision Per Screen]
```

Infrastructure PRs (Runtime, Gateway, tests-only) must note:

```text
Product Gap: N/A (Infrastructure)
User impact: None | Indirect (enables GAP-xxx)
```

### Screen review gate

Before shipping any new screen, verify:

1. Answers **What is happening? / What will I get? / What next?** in ≤ 5 seconds
2. Has exactly **one** primary CTA
3. Passes **child principle** (no unexplained jargon)
4. Does not add nav items without removing or demoting one (net complexity ≤ 0)

---

## 8. Product KPIs

| KPI | Definition | Target | Current (est.) | Instrumented |
|-----|------------|--------|----------------|--------------|
| **Time To First Value (TTFV)** | Minutes from first visit to first usable output user would pay for | < 5 min | ~7–12 min | ❌ GAP-017 |
| **Time To First AI Result** | Minutes from sign-in to first completed AI task | < 4 min | ~5–8 min | Partial (events) |
| **Time To Second Visit** | Days until user returns after first session | < 3 days | Unknown | ❌ |
| **Goal Completion Rate** | % of users who pick a goal and receive a result | > 60% | Unknown | ❌ |
| **Daily Active Users (DAU)** | Unique users per day | Growth | Unknown | ❌ |
| **Weekly Retention** | % of new users active in week 2 | > 40% | Unknown | ❌ |
| **Task Success Rate** | % of OSA/runtime tasks completed successfully | > 85% | Trackable via runs | Partial |
| **User Satisfaction** | Post-first-result micro-survey (1 question) | > 4.0 / 5 | Not collected | ❌ |

**Primary north-star metric:** Time To First Value.

---

## 9. Release Gates

A user-facing release **cannot ship** if any of the following are true:

| Gate | Condition | Rationale |
|------|-----------|-----------|
| TTFV gate | Median new-user TTFV > 5 minutes (once instrumented) | Manifesto primary metric |
| CTA gate | Any first-time screen has more than one primary CTA | One Decision Per Screen |
| OSA visibility gate | OSA gains nav prominence or new mandatory wizard steps | Invisible OSA |
| Nav complexity gate | Net increase in sidebar items for new users | Adaptive Interface |
| Jargon gate | New user-facing labels introduce internal terms without plain-language replacement | Child Principle |
| Placeholder gate | New nav items link to placeholder pages | Trust / Our Promise |
| Regression gate | Any Phase A–B gap reopens (e.g. Workspace placeholder returns) | Product integrity |

**Release checklist (product owner sign-off):**

- [ ] All PRs in release reference Gap IDs or Infrastructure tag
- [ ] TTFV measured on staging cohort (when GAP-017 closed)
- [ ] FTU walkthrough recorded — child principle pass/fail
- [ ] No new placeholder pages in primary nav
- [ ] Copy review — single locale, zero new jargon

---

## 10. Final Vision

### A day with AI Business OS

Maria runs a small marketing agency. She has twelve minutes before her next client call. She does not know what an orchestrator is, and she does not want to learn.

She opens AI Business OS on her phone. The screen greets her by name and asks one question: **“What do you want to get done today?”** Three suggestions fit her week — finish a client proposal, plan next month’s content, follow up on cold leads. She taps **“Win more clients.”**

She does not go to “OSA.” She does not pick agents. She does not read an execution plan. The screen shows a short message — *“Working on it…”* — and thirty seconds later her **workspace is ready**: a draft outreach sequence, a task list, and a note explaining what was done and why. Everything already lives under **“Client Growth — March”** — her project, created automatically. She edits one paragraph, taps **“Send to client,”** and gets a result she would have billed an hour for.

Tomorrow she returns. Home remembers. **“Yesterday you started Client Growth. Want to send the follow-up sequence?”** One tap. Done. She never opened a dashboard. She never configured an AI employee. She never wondered where to click.

Cabinet, history, and projects still exist — but only when she needs them. They feel like details of *her work*, not separate applications. The platform feels like **one person who understands her business** and organizes everything else.

That is AI Business OS: not a toolbox, not a dashboard, not an AI chat. **An operating system for business results** — where the user speaks in goals, and the system delivers outcomes.

---

## Document governance

| Action | Rule |
|--------|------|
| Update frequency | After every user-facing release and quarterly product review |
| Owner | Product (not Engineering) |
| Supersedes | Ad-hoc UX notes; feature specs that conflict with manifesto |
| Related | [PRODUCT_MANIFESTO.md](./PRODUCT_MANIFESTO.md) · [FIRST_EXPERIENCE_AUDIT.md](../FIRST_EXPERIENCE_AUDIT.md) · [ROADMAP.md](./ROADMAP.md) · [BACKLOG.md](./BACKLOG.md) |

*Product Gap Analysis v1.0 — product decision document. Not a technical specification.*
