<!-- markdownlint-disable MD013 MD060 MD036 MD024 -->

# AI Business OS — MVP Gap Analysis v1.0

**Status:** Product decision document  
**Date:** 2026-06-28  
**Question this document answers:** *What stands between today's build and putting the product in real users' hands?*

**Not this document:** Another vision doc. See [Business OS Blueprint](./BUSINESS_OS_BLUEPRINT.md) and [User Value Engine](./USER_VALUE_ENGINE.md) for the destination.

**Sources audited:** All files in `docs/product/`, `docs/business/`, `docs/architecture/REASONING_ARCHITECTURE.md`, plus current routes and flows on `develop`.

**Related:** [MVP Definition](./MVP_DEFINITION.md) · [Product Gap Analysis](./PRODUCT_GAP_ANALYSIS.md) · [Decision Log](./DECISION_LOG.md)

---

## Executive verdict

**The UX path is much closer than the value path.**

Phases 2.3–2.5 shipped the right *shape*: Today → Wow → Intent → Result → History. Navigation is simplified. OSA is no longer a visible wizard.

**The product is still not ready for real users** because the default execution path returns **demo text about internal execution graphs** — not business work a owner would use or pay for. Until the first Result is genuinely useful, nothing else in the vision matters.

**PMF hypothesis to validate first:** *A solo business owner can pick a plain-language goal and receive a usable deliverable in under five minutes, then return within seven days without re-explaining their business.*

Everything else is secondary.

---

## Assumptions challenged

| Assumption | Challenge | Decision |
| ---------- | --------- | -------- |
| "We need the full Business OS before launch" | Blueprint describes year-five product. MVP needs one loop only. | Ship **one goal → one real result → one continue** |
| "Simulated runtime is fine for demo" | Simulated output exposes engine jargon in Russian. Fails user promise and moderated test. | **Block invite** until real completion ships for cohort |
| "We need billing to learn" | [MVP Definition](./MVP_DEFINITION.md) excludes billing. First cohort can be free/manual. | Billing **after** repeated weekly use is proven |
| "We need memory before launch" | Memory compounds retention but does not create first value. | Session continuity via **projects + history** first; deep memory later |
| "Six goal chips are fine" | Six choices on first visit is better than fifteen, still borderline for child principle. | Acceptable for v1; simplify only if test shows paralysis |
| "Cabinet must merge with Home" | Cabinet is not in primary nav anymore. | **Defer** merge — not blocking |
| "CRM / Knowledge / Orchestrator matter" | Exist in codebase; not in user journey. | **Hide** from FTU; do not invest pre-PMF |
| "Instrumentation can wait" | Without TTFV measurement, we cannot know if we have PMF. | **Minimum events** are NOW |

---

## Capability matrix

Legend: **✅ Implemented** · **⚠️ Partial** · **📄 Documented only** · **❌ Missing**

| Capability | Current status | Missing pieces | Impl. difficulty | User value | Validation priority | Expected learning | Smallest validation | Test in &lt;2 weeks? |
| ---------- | -------------- | -------------- | ---------------- | ---------- | ------------------- | ----------------- | ------------------- | -------------------- |
| **Authentication** | ✅ Implemented | Org onboarding polish; faster than magic link optional | Low | Critical | P2 | Can strangers sign in? | Magic link + org — already works | Yes — observe login friction |
| **Landing / product story** | ❌ Missing | `/` redirects with zero copy; no 30-second promise | Low | High | P0 | Do users self-qualify before sign-in? | One static page: promise + login CTA | Yes |
| **Login promise** | ⚠️ Partial | Russian copy; no outcome sentence; "Business OS" jargon | Low | High | P0 | Do users know what happens after email? | One English sentence under title | Yes |
| **Today Home** | ⚠️ Partial | Simplified Concierge shipped; not FTU-adaptive (same 6 chips) | Low | Critical | P1 | Is Home one clear question? | Hide Continue when no history — done | Yes |
| **Goal selection** | ✅ Implemented | 6 plain-language chips | — | Critical | — | — | — | Yes |
| **Goal handoff** | ✅ Implemented | Session + events + workspace route | — | Critical | — | — | — | Yes |
| **Wow moment** | ✅ Implemented | Meaningful loading + personalized beat | — | High | P1 | Does emotional beat increase continue rate? | A/B: with vs without in moderated test | Yes |
| **Intent confirmation** | ✅ Implemented | User confirms before Start | — | Critical | P1 | Does confirmation increase trust vs speed? | Observe in 5-user test | Yes |
| **Clarification gate** | ✅ Implemented | One binary question when confidence low | — | Medium | P2 | When is clarification worth the delay? | Log clarification rate | Yes |
| **Invisible execution flow** | ✅ Implemented | Wow → clarify → confirm → work → Result; no OSA wizard | — | Critical | — | — | — | Yes |
| **Real business results** | ⚠️ Partial | `RUNTIME_BRIDGE_ENABLED` defaults off; simulated output is internal demo text in Russian | Medium | **Critical** | **P0** | Will users use the output? | Enable runtime for cohort **or** single-shot completion per goal with one provider | Yes — with API keys in staging |
| **Result page** | ✅ Implemented | Human timeline, summary, celebration, what's next | Low | Critical | P1 | Do users understand what they received? | 5-user read-aloud test | Yes |
| **What's next / continue** | ⚠️ Partial | Result links to Home; Continue on Home uses history | Low | Critical | P0 | Do users know tomorrow's step? | Track return within 7 days | Yes — needs instrumentation |
| **Auto-create project** | 📄 Documented only | `needsProject` flag exists; no create on first goal | Low | High | P0 | Does automatic container reduce abandonment? | Create project named from goal on handoff consume | Yes |
| **Link result to project** | ⚠️ Partial | `project_id` supported in runs; not set in goal flow | Low | High | P0 | Can user find work later? | Pass `project_id` in `startOsaTask` | Yes |
| **Save to project (user action)** | ⚠️ Partial | Result sends to `/projects` if no project; no one-tap save | Low | High | P1 | Is explicit save needed if auto-link works? | Defer if auto-create ships | Yes |
| **Projects workspace** | ⚠️ Partial | List + detail live; feels like PM tool not result container | Medium | Medium | P2 | Do users open projects after result? | Show linked results on project page | Yes — after auto-link |
| **History** | ✅ Implemented | Plain language; links to `/results/[id]` | — | High | P1 | Can users find past work? | Task completion in test | Yes |
| **Personal welcome / recommendations** | ⚠️ Partial | Rule-based from last result; empty for new users | Low | High | P1 | Does "yesterday we…" drive return? | Only test on returning users in week 2 | No — needs 7-day gap |
| **Business memory** | ⚠️ Partial | Memory service + runtime adapter exist; not wired post-simulated run | Medium | High | P2 | Does remembered context improve result #2? | Persist business description from intent after result | Partial — week 2 |
| **Knowledge in results** | ⚠️ Partial | Knowledge hub exists; not in goal flow | Medium | Medium | P3 | Does retrieval improve output quality? | One goal with KB smoke test | No — not MVP |
| **CRM** | ⚠️ Partial | Module built; not in nav or journey | High | Low | — | — | Postpone | No |
| **Notifications** | ❌ Missing | Header bell disabled | Medium | Low | P3 | — | Postpone | No |
| **Settings** | ❌ Partial shell | Placeholder page in nav | Low | Low | P3 | — | Profile name only or hide nav item | Yes — hide item |
| **Billing / subscription** | 📄 Documented only | [Pricing Strategy](../business/PRICING_STRATEGY.md) | High | — | — | — | Postpone until repeat use proven | No |
| **TTFV instrumentation** | ❌ Missing | No production funnel events | Low | Critical | **P0** | Median minutes to first result? | 4 timestamps: signup, goal, start, result_view | Yes |
| **Moderated user test** | 📄 Documented only | [MVP Definition](./MVP_DEFINITION.md) protocol not run | Low | Critical | **P0** | Do 4/5 reach usable result? | 5 sessions, no coaching | Yes |
| **Language consistency** | ⚠️ Partial | EN Home flow; RU login + simulated result text | Low | High | P0 | Does mixed locale feel broken? | English on entire FTU path | Yes |
| **Disabled UI affordances** | ⚠️ Partial | Search + notifications disabled in header | Low | Medium | P1 | Does "coming soon" erode trust? | Remove from header until ready | Yes |
| **Stub Result actions** | ⚠️ Partial | Export, archive, delete disabled or noop | Low | Medium | P1 | — | Hide until functional | Yes |
| **Home resilience** | ✅ Implemented | Fallback when concierge load fails | — | Medium | P2 | — | — | Yes |
| **Simplified navigation** | ✅ Implemented | Today, Projects, History, Settings | — | High | — | — | — | Yes |
| **Weekly rhythm / briefings** | 📄 Documented only | [Business OS Blueprint](./BUSINESS_OS_BLUEPRINT.md) Part 4 | High | Medium | — | — | Postpone | No |
| **Business Brain** (priorities, risks, opportunities) | 📄 Documented only | [Blueprint](./BUSINESS_OS_BLUEPRINT.md) Part 3 · [Reasoning Architecture](../architecture/REASONING_ARCHITECTURE.md) | High | High | — | — | Postpone | No |
| **Perfect day / hour-by-hour OS** | 📄 Documented only | [Blueprint](./BUSINESS_OS_BLUEPRINT.md) Part 1 | Very high | High | — | — | Postpone | No |
| **Deep memory evolution** (mistakes, strategy, finance) | 📄 Documented only | [Blueprint](./BUSINESS_OS_BLUEPRINT.md) Part 2 | Very high | High | — | — | Postpone | No |
| **Team / multi-seat** | 📄 Documented only | [Business Model](../business/BUSINESS_MODEL.md) ICP 2 | High | Medium | — | — | Postpone | No |
| **Vertical packs** (estate, MLM) | ⚠️ Partial | Signal rules in navigator; no user-facing packs | Medium | Medium | P3 | — | Postpone | No |
| **Referral / growth loops** | 📄 Documented only | [Growth Engine](../business/GROWTH_ENGINE.md) | Medium | Medium | — | — | Postpone | No |
| **Shareable / exportable results** | ❌ Missing | Share and export link to same page | Low | Medium | P2 | Will users advocate? | PDF or copy button on Result | Yes — after real results |
| **Cabinet / module dashboard** | ⚠️ Partial | Page exists; removed from primary nav | Medium | Low | — | — | Postpone | No |
| **Orchestrator / dev surfaces** | ⚠️ Partial | Routes exist; not in nav | — | — | — | — | Keep hidden | No |
| **Marketplace / Academy** | ⚠️ Partial | Placeholder pages | High | None | — | — | Postpone | No |
| **Async long-running jobs** | 📄 Documented only | [Roadmap](./ROADMAP.md) EPIC D | High | Medium | — | — | Postpone | No |
| **Ten-year OS vision** | 📄 Documented only | [Blueprint](./BUSINESS_OS_BLUEPRINT.md) Part 7 | — | — | — | — | Postpone | No |

---

## What changed since prior gap analysis

| Area | Prior (PRODUCT_GAP_ANALYSIS v1) | Now (2026-06-28) |
| ---- | ------------------------------- | ---------------- |
| OSA wizard | 5-step visible funnel | **Collapsed** — invisible workspace flow |
| Navigation | 7+ items incl. OSA, Workspace | **4 items** — Today, Projects, History, Settings |
| Home density | 15+ CTAs, duplicate journeys | **4 sections** — greeting, welcome, goals, continue |
| Results | Run/orchestrator view | **`/results/[id]`** user-facing page |
| Intent | None | **Confirmation + clarification** |
| Wow | None | **Wow moment** in flow |
| Workspace | Empty placeholder | **Hosts invisible flow** (handoff required) |
| **Biggest remaining blocker** | UX friction | **Output quality** — simulated demo is not a result |

---

## Readiness vs MVP Definition

| MVP exit criterion | Status | Blocker |
| ------------------ | ------ | ------- |
| Users understand the product | ⚠️ | No landing; login lacks promise |
| Users receive value | ❌ | Simulated result is not usable work |
| Users return | ⚠️ | Continue exists; unvalidated; no metrics |
| User test (5 moderated) | ❌ | Not run |
| TTFV &lt; 5 min | ❌ | Not instrumented; email + flow likely borderline |
| Save to project | ❌ | Auto-create + link missing |
| Must NOT have in FTU | ⚠️ | Dev routes exist but hidden; header stubs visible |

**Invite gate:** Close **all P0 rows** in the matrix above, then run the moderated test.

---

## Roadmap

Only three horizons. **Reduce scope** — if it does not unblock first real results or measure them, it is not NOW.

| NOW | NEXT | LATER |
| --- | ---- | ----- |
| **Real results** — runtime completion on staging/prod for goal flow; remove user-facing demo text | Post-result memory: persist intent + business description | Business Brain (priorities, risks, opportunities, contradictions) |
| **Auto-create project** on first goal + **link run** to project | One-tap **copy/export** on Result | Perfect-day / hour-by-hour briefing |
| **Landing page** — 30-second promise + login | **FTU-adaptive Home** — fewer elements first visit | Deep memory (mistakes, strategy, finance, meetings) |
| **English FTU path** — login, errors, result copy | **OAuth or password** to cut email delay | Team seats + shared projects |
| **TTFV instrumentation** — signup → goal → result_view | **Satisfaction pulse** — one question on Result | Billing + tiers ([Pricing Strategy](../business/PRICING_STRATEGY.md)) |
| **5-user moderated test** — pass threshold from MVP Definition | Recommendation tuning from real session data | Referral loops ([Growth Engine](../business/GROWTH_ENGINE.md)) |
| **Hide** disabled search, notifications, stub Result actions | Project page shows result thread clearly | CRM / Knowledge in user journey |
| **Home Continue** validation on dogfood cohort (10+ users) | Shareable result links (growth) | Cabinet merge / adaptive director |
| | Async execution for long runs | Vertical packs (estate, MLM) |
| | | Marketplace, Academy, Content Factory |
| | | Quarterly / annual rhythm automation |
| | | Multi-language |
| | | Ten-year OS ([Blueprint](./BUSINESS_OS_BLUEPRINT.md)) |

### NOW success definition

```text
5 real users → pick goal → confirm intent → receive USABLE result → find it in project/history → 2+ return within 7 days
```

If this fails, do not build NEXT. Fix the result.

---

## Postpone until after first 100 paying customers

Ideas **already documented** across product and business docs. **Do not build** before PMF and paid retention are proven.

### From Business OS Blueprint

- Hour-by-hour perfect day (07:30–18:00 lifecycle)
- Morning mobile briefing before user opens app
- Meeting capture and decision extraction
- Mistake journal and successful-decision playbooks
- Financial assumptions and cash-risk monitoring
- Employee capacity and delegation optimization
- Market scan / industry signal briefings
- Contradiction detection (strategy vs calendar)
- Opportunity ranking engine
- Risk framing before commitments
- Five-year generational business knowledge
- Portfolio entrepreneurship (multiple businesses in one OS)

### From User Value Engine & Retention Model

- Six-month "company brain" positioning
- One-year institutional memory / key-employee relationship
- Full fifty-two recurring value sources as **features** (most are outcomes of the core loop, not separate builds)
- Daily / weekly / monthly / quarterly / yearly **automated** rhythm ceremonies
- Expansion revenue mechanics before base retention &gt; 40% D30

### From Business Model & Growth Engine

- ICP 2 (5–25 employee teams) as primary build target
- Business and Scale pricing tiers
- Seat-based expansion
- Referral credits and invite loops
- Template gallery and public SEO goal pages
- Vertical beachhead GTM programs
- Partner / agency channel
- Shareable watermarked artifacts as growth engine
- Enterprise / SSO / procurement buyers

### From Reasoning Architecture & Technical Roadmap

- Full multi-specialist graph execution as user-visible value (invisible coordination is enough if output is good)
- Quality gate LLM review loop
- Async job queue for long runs
- Tool approval UI
- Streaming responses
- Multi-agent parent/child chains
- Cost billing per org
- Knowledge import pipeline
- Orchestrator diagnostics UI for users
- AI Employees management UI for users
- Developer API surface
- Observability timeline for users

### From MVP Definition "Must NOT Have" (still correct)

- Marketplace in primary journey
- Academy in primary journey
- Advanced CRM in primary journey
- Admin console for customers
- Complex analytics dashboard
- Multi-language product

### From Product Manifesto / Gap Backlog (deferred features)

- Cabinet as second home base
- Unified history across three surfaces (History is now canonical — do not rebuild Cabinet widgets)
- Predictive daily mission from full signal graph (v4.0)
- Cross-project intelligence
- Real Settings module (profile, org, preferences) — **minimal hide or name-only until paid cohort**
- Push and email notifications
- WABO internal dashboard (measure in SQL first; productize later)

---

## What we are explicitly NOT doing for PMF

1. **Not** building the Business Brain — priorities and risks can wait; users will tell us which goals matter.
2. **Not** merging every module — four nav items are enough.
3. **Not** charging before week-2 retention is measured — free cohort first; manual payment if needed before billing product.
4. **Not** optimizing for model quality arms race — one good completion beats ten agents with demo text.
5. **Not** adding features from the Blueprint — the Blueprint is the compass, not the sprint backlog.

---

## Recommended immediate sequence (2-week validation sprint)

| Day | Action | Validates |
| --- | ------ | --------- |
| 1–2 | Enable real completion on staging; English copy on FTU path | Usable result |
| 2–3 | Auto-create project + link run | Result container |
| 3 | Add 4 funnel events | TTFV |
| 4 | Landing + login promise | Comprehension |
| 5 | Hide disabled header + stub actions | Trust |
| 6–10 | 5 moderated user tests | MVP exit |
| 10–14 | 10-user dogfood; measure second visit | Retention hypothesis |

---

## Document governance

| Action | Rule |
| ------ | ---- |
| Update this doc | After each validation sprint or user cohort |
| Add capabilities | Only if already in product/business docs — no invention |
| Change NOW scope | Requires Decision Log entry |
| Supersedes | Prior readiness snapshots in MVP Definition § snapshot — not the manifesto |

*MVP Gap Analysis v1.0 — reduce until real users get real results.*
