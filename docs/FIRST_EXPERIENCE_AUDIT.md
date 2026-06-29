# First Experience Audit (FXA v1.0)

**Product:** AI Business OS  
**Date:** 2026-06-28  
**Scope:** First-time user journey from first visit through first AI result  
**Method:** Code and copy review of routes, components, navigation, and flows (no implementation changes)

---

## Executive summary

A new user cannot understand the product in under 30 seconds. There is **no public landing page** — `/` redirects immediately to login or Home. After login, Home presents **six competing sections** with overlapping CTAs. The path to a first result requires **5 internal OSA steps** (loading → team → plan → workspace → task submit) plus magic-link email friction. **English and Russian copy are mixed** across screens. **Workspace in the sidebar is a placeholder** while OSA uses an internal “OSA Workspace” — a broken promise that erodes trust.

The product feels like **three apps stitched together**: Home Concierge (English), OSA onboarding (Russian), and Cabinet/Projects (operational dashboards). Unifying language, collapsing duplicate entry points, and shortening the OSA funnel are the highest-leverage fixes.

---

## Current flow

```text
/ (root)
  ├─ logged out → /login (magic link, Russian subtitle)
  └─ logged in  → /home (AI Concierge, English)

/home
  ├─ Conversation chips (9 goals) → startGoalHandoff → /osa?handoff=<uuid>
  ├─ Suggested journeys (5 cards, duplicate goals)
  ├─ Continue journey / Daily mission (more CTAs)
  └─ Personal insights (4th information layer)

/osa?handoff=<id>
  ├─ openHandoffSession (server)
  └─ OsaOnboardingFlow:
       loading (1.6s) → team → plan → workspace → first task result
       (+ OsaRunHistory below the fold for returning users)

/workspace (nav item)
  └─ PlaceholderPage — “Unified workspace shell…”

/cabinet, /projects, /history
  └─ Live data dashboards (parallel “control center” experience)
```

**Minimum click path to first result (returning user with magic link already used):**

| Step | Action | Clicks |
|------|--------|--------|
| Login | Email + submit | 1 (+ email click) |
| Home | Pick conversation chip | 1 |
| OSA | Launch team | 1 |
| OSA | Enter workspace (from plan) | 1 |
| OSA | Submit first task | 1 |
| **Total** | | **4–5** (+ email) |

**Reading time on Home alone:** ~45–90 seconds if the user reads header metrics, 9 chips, 5 journeys, insights, and daily mission.

---

## Per-screen analysis

### 1. Landing (`/`)

| Question | Answer |
|----------|--------|
| **What does the user think?** | “Nothing happened — I’m at login” or “I’m already inside something called Home.” There is no product explanation. |
| **What is confusing?** | No landing page, no value proposition, no screenshots, no “what is this?” |
| **What question appears?** | “What is AI Business OS?” |
| **Can this be simplified?** | Yes — either a one-line value prop before redirect, or a real marketing landing for logged-out users. |
| **Can one click be removed?** | N/A (zero content screen). |

**30-second test:** ❌ Fail — user learns nothing about the product.

---

### 2. Login (`/login`)

| Question | Answer |
|----------|--------|
| **What does the user think?** | “Another SaaS login.” Title says AI Business OS; subtitle is Russian; button says Continue (English). |
| **What is confusing?** | Language split; magic-link-only with no explanation of what happens next; no product context. |
| **What question appears?** | “Why Russian?” / “What will I see after I click the email link?” |
| **Can this be simplified?** | Yes — one language, one sentence of value (“Your AI team for business tasks”), clearer post-login expectation. |
| **Can one click be removed?** | No — magic link requires email step; could add Google OAuth as alternate single click. |

**Visual hierarchy:** Title → subtitle → form. Clear but minimal.  
**Empty/loading/errors:** Error states exist (invalid email, send failed, auth). Sent confirmation is good.  
**12-year-old / non-AI user / tired owner:** Magic link is fine for owners; product name “Business OS” is jargon.

---

### 3. Home — AI Concierge (`/home`)

| Question | Answer |
|----------|--------|
| **What does the user think?** | “A personal assistant dashboard” — but also “why are there so many boxes?” |
| **What is confusing?** | **AI Concierge**, **OSA**, **workspace**, **Current focus / project / execution** — metrics may show “None yet” for new users. Six sections compete for attention. |
| **What question appears?** | “Do I click a chip, a journey, or daily mission?” / “What is OSA?” |
| **Can this be simplified?** | Yes — first visit should show **one hero + 3–4 chips max**; hide insights/journeys until data exists. |
| **Can one click be removed?** | Yes — auto-start OSA with a default goal for true first-time users (optional “skip setup”). |

**Sections rendered:** Header (3 metrics) → ConversationStarter (9 chips) → SuggestedJourneys (5) → ContinueJourney → PersonalInsights → DailyMission.

**Decision fatigue:** High — duplicate paths to the same goals (chips vs journeys vs daily mission).

**Product unity:** Home speaks English and promises “workspace prepared”; OSA speaks Russian — feels like different products.

---

### 4. Goal selection (Conversation chips / journeys)

| Question | Answer |
|----------|--------|
| **What does the user think?** | “Pick what I want to improve” — clear intent labels (e.g. marketing, automation). |
| **What is confusing?** | Same goals appear in chips, suggested journeys, and daily mission; user cannot tell which is “official.” |
| **What question appears?** | “What’s the difference between a chip and a journey?” |
| **Can this be simplified?** | Yes — single goal picker component, one location. |
| **Can one click be removed?** | Handoff already skips OSA onboarding textarea — good. Could skip team/plan steps for preset teams. |

**Loading state:** “OSA is preparing your workspace…” — good feedback.  
**Errors:** Handoff failures surface on chip click — good.

---

### 5. OSA (`/osa`)

| Question | Answer |
|----------|--------|
| **What does the user think?** | “An AI is building my team” — compelling if language matches Home. |
| **What is confusing?** | **OSA** acronym unexplained; Russian UI after English Home; **Execution Plan**, **Navigator review**, **Confidence %**, **Primary/Secondary team** — internal jargon; run history visible below onboarding for new users. |
| **What question appears?** | “Why am I seeing this again?” / “What is Navigator?” / “Do I need to read the plan?” |
| **Can this be simplified?** | Yes — collapse team + plan into one “Your AI team is ready” screen with single **Start** CTA. |
| **Can one click be removed?** | Yes — merge plan confirmation into team launch (1 click instead of 2). |

**Flow steps:** `onboarding` → `loading` (forced 1.6s) → `team` → `plan` → `workspace` → task result.

**Handoff path:** Skips onboarding textarea, shows English “I've already prepared your workspace” banner — good bridge.

**Duplicate navigation:** Sidebar still shows OSA as separate app; user landed via Home but sees full nav with Cabinet, Workspace placeholder, etc.

---

### 6. Workspace (`/workspace` nav vs OSA Workspace step)

| Question | Answer |
|----------|--------|
| **What does the user think?** | Nav: “Empty page — product isn’t finished.” OSA step: “This is where I work.” |
| **What is confusing?** | **Two different “Workspace” concepts** — sidebar route is placeholder; OSA has real task UI. Home copy says “workspace will be prepared” then nav Workspace is empty. |
| **What question appears?** | “Was my workspace prepared or not?” |
| **Can this be simplified?** | Yes — remove nav item until built, or redirect `/workspace` → active OSA session / project. |
| **Can one click be removed?** | Remove misleading nav click entirely. |

**Trust impact:** Severe — breaks the core promise from Home and handoff banner.

---

### 7. First result (OSA workspace step — task execution)

| Question | Answer |
|----------|--------|
| **What does the user think?** | “I asked something and AI responded” — if runtime succeeds. |
| **What is confusing?** | Task form, agent trace, progress polling — heavy for first win; failure messages in Russian; unclear where result lives afterward (History? Projects? Cabinet?). |
| **What question appears?** | “What do I do with this output?” / “Where did it save?” |
| **Can this be simplified?** | Yes — first result should be a **celebration card** with one next step (“Save to project” / “Run again”). |
| **Can one click be removed?** | Pre-fill first task from handoff `starterPrompt` so user clicks **Run** without retyping. |

**Loading:** Live progress component exists — good for trust when visible.  
**Empty state:** New users must type a task — missed opportunity to auto-run handoff prompt.

---

## Cross-cutting evaluation

### Visual hierarchy

| Area | Grade | Notes |
|------|-------|-------|
| Login | B | Clean, minimal |
| Home | C | Everything is same visual weight (cards, borders, h2s) |
| OSA | B- | Clear step headers; team cards strong |
| Cabinet/Projects | B+ | More mature dashboard hierarchy |

### Decision fatigue

- **Home:** 9 chips + 5 journeys + continue + daily mission = **15+ choices** before OSA.
- **OSA:** 3–4 confirmation steps after goal already chosen on Home.
- **Nav:** 7 items; several overlap (Home vs Cabinet vs History).

### Navigation complexity

Sidebar: Home, Cabinet, OSA, Workspace, Projects, History, Settings.  
Hidden/orphan routes: Orchestrator, AI Employees, Knowledge, CRM, Marketplace, Academy — not in main nav but exist in codebase.

**Duplicate navigation:** History vs Cabinet recent executions; Home continue journey vs OSA run history; Projects vs Cabinet recent projects.

### Empty states

- Home metrics: “None yet” / “None running” — honest but discouraging without guidance.
- Workspace nav: placeholder only — worst empty state in funnel.
- Settings: placeholder.

### Loading states

- Home handoff: inline “preparing…” — good.
- OSA loading: spinner + “Анализирую ваш бизнес…” — artificial 1.6s delay adds wait without new information.
- Task execution: polling progress — good.

### Errors

- Login: localized Russian errors.
- Handoff: expired/invalid/consumed sessions on OSA — need user-friendly recovery link back to Home.
- Task submit: Russian failure copy.

### Terminology audit

| Term | User-friendly? | Where |
|------|----------------|-------|
| AI Business OS | Jargon | Brand |
| OSA | ❌ Unknown | Home, OSA, nav |
| Cabinet | ❌ Unclear vs Home | Nav |
| AI Concierge | ⚠️ Premium but vague | Home header |
| Workspace | ❌ Conflicting meaning | Home, nav, OSA |
| Execution Plan | ⚠️ Technical | OSA |
| Navigator review | ❌ Internal | OSA team card |
| Handoff | ❌ Internal | Code/URL only (good) |
| Orchestrator | ❌ Dev-facing | History subtitle |

### Duplicate actions

- Start goal: chips, suggested journeys, daily mission (same `startGoalHandoff`).
- View runs: History page, OSA run history, Cabinet widget, Home continue journey.
- Dashboard: Home header metrics vs Cabinet overview.

### Product unity check

| Module | Feels like |
|--------|------------|
| Home | English concierge app |
| OSA | Russian multi-step wizard |
| Cabinet | Ops dashboard |
| Projects | Separate PM tool |
| Workspace nav | Broken stub |

**Verdict:** ❌ Does not feel like ONE product today.

### Accessibility of language

| Persona | Understand in 30s? |
|---------|-------------------|
| 12-year-old | ❌ Too much jargon and steps |
| Never used AI | ❌ “OSA”, “execution”, “agents” unexplained |
| Tired business owner | ⚠️ Might click one chip, but OSA funnel loses them |

---

## Pain points (prioritized)

1. **No landing / product story** — zero second to learn what this is.
2. **Workspace nav is a placeholder** — contradicts Home and handoff promises.
3. **English/Russian split** — Home vs Login vs OSA.
4. **OSA acronym unexplained** — appears in nav and copy without definition.
5. **Home information overload** — six sections, duplicate goal entry points.
6. **OSA funnel too long after goal pick** — team → plan → workspace → manual task.
7. **Cabinet vs Home redundancy** — two “home bases” for the same user.
8. **Internal jargon on team screen** — Confidence, Navigator, Primary/Secondary.
9. **First result lacks “what’s next”** — no clear save/share/project path.
10. **Artificial loading delay** — 1.6s without progressive disclosure.
11. **Disabled header search/notifications** — visual noise, feels unfinished.
12. **Settings placeholder** — erodes trust if discovered early.

---

## Quick wins (< 1 hour each)

1. **Hide `/workspace` from nav** until the page exists (or redirect to `/osa`).
2. **Unify language on login** — match Home (English) or add locale toggle.
3. **Add one-line product subtitle on login:** “Your AI team for business tasks.”
4. **Collapse Home for new users** — show only ConversationStarter; hide empty insights/journeys.
5. **Pre-fill OSA task input** from handoff `starterPrompt` on workspace step.
6. **Merge team + plan CTAs** — single “Start with this team” button.
7. **Rename nav “Cabinet” → “Overview”** or merge into Home tab.
8. **Add tooltip/expander:** “OSA = your AI operating assistant” on first visit.
9. **Remove disabled search** from header or hide until functional.
10. **Handoff error recovery** — prominent “Pick a new goal on Home” link.

---

## Medium improvements (1–3 days)

1. **First-time Home mode** — detect zero runs/projects; single CTA “Start with OSA”.
2. **Shorten OSA handoff path** — loading → workspace (skip team/plan when team preset).
3. **First result success screen** — output + “Create project” + “View in History”.
4. **Consistent copy pass** — one glossary (OSA, workspace, project, run).
5. **Merge duplicate goal surfaces** — chips OR journeys, not both on first visit.
6. **Replace artificial delay** with real progress messages from handoff session.
7. **Breadcrumb context** — “Home → Marketing goal → OSA” during funnel.
8. **Empty state illustrations** for Home metrics with guided next step.

---

## Major redesign recommendations

1. **Single “Mission Control” home** — merge Home + Cabinet into one adaptive surface; demote duplicate widgets.
2. **Unified Workspace concept** — project-scoped workspace where OSA runs live (replace placeholder + inline OSA workspace).
3. **Public marketing landing** — value prop, 30-second video or animated demo, then login.
4. **Conversational OSA** — replace multi-step wizard with chat-first UX; team/plan as collapsible detail.
5. **Progressive nav** — show only Home + OSA + Projects for first 7 days; unlock Cabinet/History later.
6. **Locale strategy** — full i18n rather than mixed strings.

---

## Screens to merge

| Merge | Into | Rationale |
|-------|------|-----------|
| Home header metrics + Cabinet overview stats | Single “Today” strip | Same data, two places |
| Conversation chips + Suggested journeys | One “Start here” module | Duplicate goals |
| OSA team + plan steps | One “Ready to run” step | Redundant confirmations |
| History + OSA run history (on OSA page) | Single History experience | Same runs, two UIs |
| `/workspace` nav + OSA workspace step | One workspace route | Naming collision |

---

## Screens to remove (from first-time path)

- **Cabinet** — from default nav for new users (not delete product area).
- **Workspace** nav item — until real page ships.
- **Personal insights** — on first visit when heuristics have no signal.
- **Daily mission** — when it duplicates chip selection.
- **OSA onboarding textarea** — when arriving via Home handoff (already skipped — extend to all handoff cases).
- **Execution plan as full screen** — downgrade to inline summary.

---

## Screens to simplify

- **Login** — product pitch + one field.
- **Home** — one primary section for FTU.
- **OSA team** — hide Navigator/confidence/tags behind “Details”.
- **OSA workspace** — one-click run with prefilled prompt.
- **Header** — remove non-functional controls.

---

## Scores (0–10)

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **First impression** | 3 | No landing; login gives no story; Home is dense |
| **Learning curve** | 4 | Too many modules, terms, and steps before first win |
| **Trust** | 5 | Polished UI undermined by placeholders and language inconsistency |
| **Clarity** | 4 | OSA/Cabinet/Workspace naming conflicts; duplicate CTAs |
| **Delight** | 5 | Handoff “prepared workspace” is good; long funnel kills momentum |
| **Overall UX** | **4** | Strong backend integration; first journey not yet productized |

---

## Validation personas — summary

- **Can a 12-year-old understand it?** No — jargon and multi-dashboard layout.
- **Can someone who never used AI understand it?** No — OSA, agents, execution plan unexplained.
- **Would a tired business owner understand it?** Partially — chips are clear; OSA steps and empty Workspace nav would lose them.

---

## Appendix: Key files reviewed

| Stage | Path |
|-------|------|
| Root redirect | `app/page.tsx` |
| Login | `app/login/page.tsx` |
| Home | `app/(dashboard)/home/page.tsx`, `components/home/AIConcierge*.tsx` |
| Goal/handoff | `components/home/ConversationStarter.tsx`, `utils/home/goal-handoff.ts` |
| OSA | `app/(dashboard)/osa/page.tsx`, `components/osa/osa-onboarding-flow.tsx` |
| Workspace | `app/(dashboard)/workspace/page.tsx` |
| Nav | `utils/cabinet/cabinet-config.ts`, `components/layout/sidebar.tsx` |
| Cabinet | `app/(dashboard)/cabinet/page.tsx` |

---

*FXA v1.0 — audit only; no implementation included in this document.*
