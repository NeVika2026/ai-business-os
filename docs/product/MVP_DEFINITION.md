<!-- markdownlint-disable MD013 MD060 MD036 -->

# AI Business OS — MVP Definition v1.0

**Status:** Public launch readiness criteria  
**Date:** 2026-06-28  
**Question this document answers:** *When are we ready to invite our first real users?*

**Related:** [Product Manifesto](./PRODUCT_MANIFESTO.md) · [Product Gap Analysis](./PRODUCT_GAP_ANALYSIS.md) · [Decision Log](./DECISION_LOG.md) · [First Experience Audit](../FIRST_EXPERIENCE_AUDIT.md)

---

## Vision

AI Business OS is a personal AI director for your business. You say what you want to achieve — more clients, better content, faster follow-ups, a clearer plan — and the platform organizes the work, prepares your space, and delivers a real result you can use today. You do not manage tools, configure agents, or learn software architecture. You show up, choose a goal, get value, and come back tomorrow where you left off.

---

## Target User

### Primary users

People who run or grow a business and need outcomes faster than they can hire or coordinate a team.

| Segment | Typical need |
| ------- | ------------- |
| **Business owner** | Daily priorities, client work, operations without a full staff |
| **Entrepreneur** | Launch ideas, validate offers, move fast with limited time |
| **Consultant** | Proposals, deliverables, client communication |
| **Real estate broker** | Listings, outreach, follow-up sequences |
| **MLM leader** | Team messaging, recruitment content, activity planning |
| **Marketing agency** | Campaigns, content calendars, client deliverables |

### Who MVP is not for (yet)

Enterprise admins, developers integrating APIs, marketplace buyers, or users who need billing, deep CRM, or custom analytics.

---

## User Promise

> **I tell the platform what I want.  
> The platform organizes the work.**

Every MVP screen must reinforce this promise. If a screen asks the user to organize the platform instead, it is out of scope or not ready.

---

## MVP User Journey

The minimum path a first real user must complete without help:

```text
Landing
  ↓
Login
  ↓
Home
  ↓
Choose Goal
  ↓
AI prepares workspace        ← invisible; user sees progress, not engine
  ↓
First Result                 ← usable output (text, plan, draft, list)
  ↓
Save to Project              ← automatic or one tap
  ↓
Return tomorrow              ← Home remembers; one-tap continue
```

### Journey acceptance (what “done” means)

| Step | MVP requirement |
| ---- | ---------------- |
| **Landing** | User understands what the product is in ≤ 30 seconds; clear path to sign in |
| **Login** | Secure sign-in; one language; one sentence of promise |
| **Home** | One primary question: what do you want today? One dominant CTA |
| **Choose Goal** | 3–6 plain-language goals; no jargon |
| **AI prepares workspace** | No visible “launch AI” step; brief progress; workspace ready |
| **First Result** | Real output without re-explaining the business from scratch |
| **Save to Project** | Result attached to a project automatically or in one action |
| **Return tomorrow** | Home surfaces continue prompt; user completes second action without re-onboarding |

---

## MVP Must Have

Each item is required for public invite. “Exists in codebase” is not sufficient — behavior must match [Decision Log](./DECISION_LOG.md) and user promise.

| # | Capability | MVP bar |
| - | ---------- | ------- |
| ✓ | **Authentication** | Magic link or equivalent; org onboarding; stable session |
| ✓ | **Home** | FTU-adaptive: welcome + goal question; not a module dashboard |
| ✓ | **AI Concierge** | Daily greeting; suggests what to do today based on context |
| ✓ | **Goal Handoff** | Goal selection creates prepared session; no duplicate data entry |
| ✓ | **Invisible OSA** | Engine runs in background; no OSA nav/wizard on primary path |
| ✓ | **Project Workspace** | Real working surface tied to project — not empty placeholder |
| ✓ | **History** | User can see past results in plain language |
| ✓ | **Documents placeholder** | Project shows where documents will live; upload not required for MVP |
| ✓ | **AI memory** | Platform remembers business context across sessions within project |
| ✓ | **Basic notifications** | User notified when work completes (in-app minimum) |

### Must Have — explicit exclusions

- Full document management (upload, edit, version) — placeholder only
- Push/email notifications — in-app sufficient for MVP
- Multi-language — one consistent locale for MVP launch

---

## MVP Must NOT Have

These are intentionally out of scope for first public users. Presence in codebase must not appear in primary navigation or FTU path.

| Excluded | Reason |
| -------- | ------ |
| **Marketplace** | Distraction; module-first |
| **Billing** | Premature; no payment gate for MVP cohort |
| **Academy** | Education is not the first-run job |
| **Complex analytics** | Dashboards before value |
| **Advanced CRM** | Internal tool; not user promise |
| **Admin console** | Operator tooling, not owner experience |
| **Developer tools** | Orchestrator, runtime diagnostics, API explorer |
| **Experimental modules** | Anything labeled placeholder in primary nav |

---

## MVP Success Metrics

Measured on **first public cohort** (minimum 20 users, 5 in moderated test — see User Test).

| Metric | Target | Definition |
| ------ | ------ | ---------- |
| **Time To First Value** | < 5 minutes | First visit → first result user would actually use |
| **First Result Rate** | > 80% | % of sign-ups who receive a completed result in session 1 |
| **Second Visit** | > 50% | % who return within 7 days |
| **Weekly Retention** | > 30% | % of week-1 users active in week 2 |

### Instrumentation required before invite

- TTFV timestamp (GAP-017)
- Goal selected → result completed funnel
- Return visit within 7 days

---

## User Test

Before inviting real users, run a **moderated observation** with five people matching [Target User](#target-user) profiles.

### Protocol

| Rule | Detail |
| ---- | ------ |
| **Participants** | 5 |
| **Instruction** | “Try to get something useful for your business.” No product explanation |
| **Observation** | Facilitator silent; notes only |
| **Duration** | Up to 30 minutes per session |

### Measure

| Signal | Record |
| ------ | ------ |
| **Confusion** | Moments user stops, rereads, or says “I don’t know what to do” |
| **Questions** | Verbatim questions asked aloud |
| **Time** | Minutes to first result |
| **Success** | Did they get a result they would use? Y/N + quote |

### Pass threshold (all required)

- ≥ 4 of 5 reach first result without facilitator help
- ≥ 4 of 5 describe the product in goal/outcome terms (not module names)
- Median time to first result < 5 minutes (excluding email login delay)
- Zero participants land on empty placeholder as primary workspace

---

## Exit Criteria

The MVP is ready to invite first real users **only if all three are true:**

### 1. Users understand the product

- [ ] Landing + Home communicate promise without training
- [ ] No unexplained jargon on FTU path (DEC-008)
- [ ] User test pass threshold met

### 2. Users receive value

- [ ] First Result Rate > 80% on internal dogfood cohort (≥ 10 users)
- [ ] TTFV median < 5 minutes
- [ ] Result is saved to project without manual filing

### 3. Users return

- [ ] Continue journey on Home works for returning users
- [ ] Second Visit > 50% on dogfood cohort
- [ ] Weekly Retention > 30% on dogfood cohort (minimum 2-week observation)

### Launch gate summary

```text
MVP READY = Exit Criteria (all checkboxes)
          + User Test (pass threshold)
          + Success Metrics (defined and instrumented)
          + Must NOT Have items hidden from FTU path
```

---

## Current readiness snapshot (2026-06-28)

Honest status against this definition — not a release note.

| Area | Status | Blocker |
| ---- | ------ | ------- |
| Authentication | ✅ Ready | Magic link works |
| Home / Concierge | ⚠️ Partial | Too many CTAs; not FTU-adaptive |
| Goal Handoff | ⚠️ Partial | Backend ready; UX still routes to OSA wizard |
| Invisible OSA | ❌ Not ready | OSA visible in nav and multi-step flow |
| Project Workspace | ⚠️ Partial | Projects live; auto-create from goal incomplete |
| History | ✅ Ready | Live execution history |
| Documents placeholder | ⚠️ Partial | Project modules exist; not prominent on FTU path |
| AI memory | ⚠️ Partial | Runtime memory exists; not surfaced as user-facing promise |
| Basic notifications | ❌ Not ready | Header bell disabled |
| Landing | ❌ Not ready | No value proposition |
| Return tomorrow | ⚠️ Partial | Continue journey exists; needs dogfood validation |

**Verdict:** Not ready for first public users. Close Phase A + B gaps ([Product Gap Analysis](./PRODUCT_GAP_ANALYSIS.md) v3.0–v3.1) before invite.

---

## Document governance

| Action | Rule |
| ------ | ---- |
| Change MVP scope | Requires new DEC entry in [Decision Log](./DECISION_LOG.md) |
| Invite users | Product owner sign-off against Exit Criteria |
| Metrics | Review weekly during MVP cohort |

*MVP Definition v1.0 — when we invite real users, not when we ship code.*
