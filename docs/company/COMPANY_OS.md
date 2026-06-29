<!-- markdownlint-disable MD013 MD060 MD036 MD024 -->

# AI Business OS — Company Operating System v1.0

**Status:** Final strategic document before full implementation  
**Date:** 2026-06-28  
**Authority:** How the **company** operates while building the product  
**Audience:** Founders, product, engineering, design

**Related:** [Product Manifesto](../product/PRODUCT_MANIFESTO.md) · [Decision Log](../product/DECISION_LOG.md) · [Metrics](../business/METRICS.md) · [MVP Gap Analysis](../product/MVP_GAP_ANALYSIS.md) · [First 100 Customers](../operations/FIRST_100_CUSTOMERS.md) · [First 7 Days](../product/FIRST_7_DAYS.md)

---

## Purpose

This document governs **how we work** — not what we dream. Strategy lives in product and business docs. This OS binds those docs to **cadence, decisions, shipping, and restraint**.

When this document conflicts with enthusiasm, this document wins.

---

# 1. Product operating cadence

### Daily (15–30 minutes, whole founding team)

| Activity | Owner | Output |
| -------- | ----- | ------ |
| Funnel health: goal → intent → result → failure % | Technical | Red/yellow/green on 5 core metrics |
| Blocker review: any design partner **BLOCKER** feedback | CEO | Zero open blockers > 48h |
| Build scope check: is today's work on **NOW** only? | Product | Yes/no — if no, stop |

**Do not:** Roadmap debates, new feature ideation, competitor reviews.

---

### Weekly (Monday metrics, Friday ship review)

| Monday — decide | Friday — account |
| --------------- | ---------------- |
| WABO (North Star) | What shipped vs NOW list |
| TTFV p50 / p90 | Partner quotes (verbatim) |
| D7 cohort (first-result users) | Failed results root cause |
| ONE priority shift max for the week | Go/no-go on next week's NOW |

**Minimum:** 3 customer conversations/week ([First 100 Customers](../operations/FIRST_100_CUSTOMERS.md)). Zero-conversation weeks are a failure mode.

**Outputs:** Weekly metrics note (one page). Updated NOW/NEXT order in [MVP Gap Analysis](../product/MVP_GAP_ANALYSIS.md) if needed.

---

### Monthly (first business day)

| Review | Action |
| ------ | ------ |
| MRR, paying org count, free → paid | Pricing hypothesis check |
| D30 retention (first-result cohort) | Retention loop fixes before acquisition |
| Channel mix (founder / intro / content) | Kill or double one channel |
| Kill list gates — anything eligible to unlock? | Document in Decision Log |

**Output:** Monthly operating memo. No new strategy docs unless superseding an existing one.

---

### Quarterly (half-day, founders + leads)

| Review | Action |
| ------ | ------ |
| North Star (WABO) vs targets ([Metrics](../business/METRICS.md)) | Revise stage targets with evidence |
| ICP focus — still ICP 1 only? | Narrow or hold |
| PMF evidence scorecard (§8) | Continue, pivot, or pause GTM |
| Kill list — promote ≤ 2 items to NEXT | Requires DEC entry each |
| Product principles — any deprecated? | Max 15; no duplicates |

**Output:** Quarterly DEC entries for material changes. **No new vision documents.**

---

# 2. Decision framework

### Who decides

| Decision type | Decider | Consulted | Informed |
| ------------- | ------- | --------- | -------- |
| **NOW scope** (what ships this week) | CEO + Product | Engineering | Design partners |
| **User-facing copy / journey** | Product | CEO | Engineering |
| **Technical approach** (within approved feature) | Engineering lead | Product | CEO |
| **Pricing / packaging** | CEO | Product | Paying customers (n≥10) |
| **Kill list unlock** | CEO | Full team | Customer council |
| **Manifesto / principle change** | CEO | Product | Team → DEC required |
| **Infrastructure** (no user surface) | Engineering lead | Product | CEO |

**Default:** If unclear, CEO decides within 24 hours. Debate beyond 48 hours means the answer is **no**.

---

### What requires evidence

| Decision | Evidence required |
| -------- | ----------------- |
| Add user-facing capability | Metric drop, partner **BLOCKER**, or failed moderated test |
| Change North Star or ICP | 90 days cohort data |
| Unlock kill-list item | Gate conditions in §7 met — documented |
| Reprice | 20+ paid conversions + churn data |
| Expand acquisition spend | CAC &lt; 3× monthly ARPU on cohort |

**Evidence** = numbers, session recordings, or verbatim user quotes tied to a named org. Not team conviction.

---

### What requires user validation

| Change | Validation |
| ------ | ---------- |
| Any FTU path change | 3 of 5 moderated users succeed unaided |
| Result quality change | 3 design partners report "would use" |
| Pricing ask | 5 willingness-to-pay conversations |
| New goal type | 10 goal selections + completion rate |
| Removal of a feature | 30-day usage = 0 for target cohort |

Ship without validation only for **copy fixes, bug fixes, and instrumentation** — not new capability.

---

### What requires experiments

| Hypothesis | Experiment shape | Max duration |
| ---------- | ---------------- | ------------ |
| Pricing ($29 vs $39) | A/B on manual invoice cohort | 4 weeks |
| Wow moment impact | With/without in moderated test | 1 week |
| Recommendation copy | Partner cohort, measure acceptance rate | 2 weeks |
| New acquisition channel | $500 test budget, measure first-result rate | 2 weeks |

One experiment at a time per domain (product, pricing, growth). No experiment without pre-registered success metric and stop rule.

---

# 3. Product review process

Every user-facing feature — including changes to existing flows — must pass **Product Review** before development and before ship.

### Required answers

| Question | Pass criterion |
| -------- | -------------- |
| **What user problem disappears?** | One sentence in user language. Must map to a job in [Business Model](../business/BUSINESS_MODEL.md) JTBD table. "Expose capability" is not a problem. |
| **How will success be measured?** | One primary metric + owner + target + deadline. Must exist in [Metrics](../business/METRICS.md) or be proposed as DEC with addendum to Metrics. |
| **When will it be removed if it fails?** | Pre-registered review date (max 6 weeks post-ship). Failure threshold numeric. Removal = hide from FTU or delete — not "iterate forever." |

### Review gates

```text
Proposal → Product Review (answers above) → Definition of Ready (§9)
  → Development → Definition of Done (§10) → Ship → Metric watch → Keep or kill
```

**Veto power:** CEO vetoes anything not on NOW, not closing a Gap ID, or on the kill list without gate passed.

### PR template (user-facing)

```text
Problem: [user problem disappearing]
Metric: [name] — owner — target — review date
Gap: GAP-xxx or Customer Council ref
Kill date if failed: YYYY-MM-DD
Manifesto principle: [one]
```

Infrastructure PRs: `User impact: None | Indirect (enables GAP-xxx)`.

---

# 4. Engineering rules

1. **No feature without metrics** — instrumentation ships in the same PR or the PR does not merge.

2. **No metrics without owner** — one named person accountable for weekly read of each new metric.

3. **No owner without deadline** — review date within 6 weeks of ship; owner commits to action if red.

4. **Extend, don't duplicate** — inspect existing code; align with [AGENTS.md](../AGENTS.md) workflow.

5. **Deterministic where possible** — team selection, planning, confidence: explainable without an LLM.

6. **Avoid Runtime / Gateway / Memory / Knowledge / Automation** unless the approved feature requires it.

7. **Validation on every task:** `npm run lint`, `npm run build`, `npm test`.

8. **No user-facing jargon** — OSA, orchestrator, agent, runtime never in FTU copy.

9. **No placeholder in primary nav** — hide or implement; no "coming soon" in sidebar.

10. **Backward compatibility** unless DEC explicitly approves breaking change.

---

# 5. Customer council

The customer council is the **design partner cohort** — not a formal board. It is how real businesses steer NOW.

### Composition

| Phase | Size | Profile |
| ----- | ---- | ------- |
| Pre-launch validation | 5 | Moderated test participants |
| Design partners | 20 | ICP 1 ([Business Model](../business/BUSINESS_MODEL.md)) |
| Early paid | 10–25 | Converted partners + intro referrals |

### How design partners influence roadmap

| Mechanism | Cadence | Effect |
| --------- | ------- | ------ |
| **Weekly 15-min call** | Per partner, rotating | BLOCKER → preempts NOW |
| **Verbatim log** | After every call | Tagged: BLOCKER / TRUST / QUALITY / RETENTION / MONETIZE / NOISE |
| **Monthly council sync** | 45 min, 5–8 partners | Vote on ONE priority for next month (advisory) |
| **Result quality review** | Per goal type | Prompt and flow changes only with partner evidence |

**NOISE is discarded publicly** — partners hear what we did not build and why.

### How feedback becomes product

```text
Feedback → Tag → Monday prioritization → NOW slot (max 3 items)
  → Product Review → Ship → Tell partner it shipped → Measure
```

| Tag | SLA to ship (NOW items) |
| --- | ----------------------- |
| BLOCKER | ≤ 5 business days |
| TRUST / QUALITY | ≤ 2 weeks |
| RETENTION | Next sprint |
| MONETIZE | After 20 paid — billing track |
| NOISE | Never — logged only |

Partners do not design features. They report **problems and outcomes**. Product translates.

---

# 6. Product principles

Fifteen principles. No duplicates. Binding for all user-facing work.

| # | Principle | Test |
| - | --------- | ---- |
| 1 | **Goal first** | User states outcome, not tool |
| 2 | **Result before features** | Ship finished work, not capabilities |
| 3 | **Invisible engine** | User never launches OSA or configures agents |
| 4 | **One decision per screen** | One primary action per view |
| 5 | **Child principle** | A twelve-year-old understands every FTU screen |
| 6 | **Understand before act** | Intent confirmed before work runs |
| 7 | **Continue beats restart** | Returning users never re-brief the business |
| 8 | **Project holds the thread** | Work lives in outcomes, not chats |
| 9 | **First value under five minutes** | TTFV is a release gate |
| 10 | **Value before payment** | No charge before first completed result |
| 11 | **Measure outcomes, not activity** | WABO over signups and token counts |
| 12 | **Evidence before expansion** | Metrics or partner quotes — not opinions |
| 13 | **Sell progress, not AI** | Copy speaks in business outcomes |
| 14 | **Respect the user's time** | Interrupt only with earned urgency |
| 15 | **Remove before adding** | Net navigation complexity ≤ 0 |

Source alignment: [Product Manifesto](../product/PRODUCT_MANIFESTO.md), [User Value Engine](../product/USER_VALUE_ENGINE.md), [First 100 Customers](../operations/FIRST_100_CUSTOMERS.md).

---

# 7. Kill list

Future temptations — **documented elsewhere, forbidden until gate passes**. Building early is a company failure, not a shortcut.

| Temptation | Why it tempts us | Gate to unlock | Earliest stage |
| ---------- | ---------------- | -------------- | -------------- |
| **Billing / subscriptions** | Revenue | 20+ orgs with D7 ≥ 50% after first result; manual invoice tested on 5 users | Pre-100 paying |
| **Self-serve Stripe** | Scale billing | 25 paying via manual invoice | ~Customer #25 |
| **CRM (user-facing)** | "Complete OS" | 100 paying; ≥ 10% request client tracking in council | Post-100 |
| **Knowledge hub (user-facing)** | Better results | Result quality stable ≥ 75% completion; retrieval improves 3 partner scores | Post-PMF |
| **Marketplace** | Revenue diversification | 100 paying + WABO ≥ 100/week | Post-100 |
| **Academy** | Education GTM | 100 paying; content channel ≥ 15% of signups | Post-100 |
| **Visible AI agents / team picker** | Demo wow | **Never** as user-facing product — engine stays invisible | — |
| **Orchestrator UI** | Internal debugging | Stays internal until engineering team &gt; 8 | Post-100 |
| **Cabinet / module dashboard** | Power users | PMF scorecard (§8) all green 2 months | Post-PMF |
| **Business Brain** (priorities, risks, opportunities) | Differentiation | WABO ≥ 200/week; D30 ≥ 35% | Post-PMF |
| **Perfect-day / hour briefing** | Blueprint vision | [First 7 Days](../product/FIRST_7_DAYS.md) transformation validated; D7 ≥ 50% | Post-PMF |
| **Deep memory** (mistakes, strategy, finance) | Moat | Post-result memory shipped + 90-day retention lift measured | Post-PMF |
| **Team seats / Business tier** | ARPU | ≥ 10% of paid request multi-seat ([First 100](../operations/FIRST_100_CUSTOMERS.md) kill #9) | Customer #50+ |
| **Enterprise / SSO / audit** | Big deals | 250 paying; ICP 2 becomes focus | Year 2 |
| **Referral program (productized)** | Growth | 25 paying; informal referral ≥ 15% of new paid | Customer #25+ |
| **Paid acquisition (scale)** | Speed | 25 paying; organic CAC known; payback &lt; 6 months | Customer #25+ |
| **Vertical packs** (estate, MLM) | Beachhead | One vertical ≥ 2× first-result rate in cohort n≥30 | Post-50 paying |
| **Content Factory** | Module vision | 100 paying | Post-100 |
| **Shareable / export results** | PLG | 3+ partners share externally without prompting | NEXT (post-validation) |
| **Multi-language** | Markets | English PMF proven; one locale D30 ≥ 35% | Post-100 |
| **Async job queue** | Long runs | p90 TTFV &gt; 8 min due to execution length | When measured |
| **Streaming responses** | UX polish | PMF achieved | Post-PMF |
| **Mobile app** | Convenience | Web D7 ≥ 50%; mobile traffic ≥ 30% | Post-PMF |
| **Developer API** | Platform story | 500 paying or 3 signed partner integrations requesting it | Year 2+ |
| **Admin console (customer)** | Enterprise | Enterprise gate passed | Year 2+ |
| **Integrations marketplace** | Ecosystem | Business tier ≥ 30% of paid base | Post-250 paying |
| **Notifications (push/email)** | Retention | In-app Continue proven; D7 still &lt; 50% after fixes | Only if retention fails |
| **Settings (full)** | Expectation | Hide until billing; minimal profile at billing launch | With Stripe |
| **Quarterly / annual rhythm automation** | Blueprint Part 4 | Monthly retention ≥ 40% for 2 quarters | Post-PMF |
| **Ten-year OS features** | Vision | [Blueprint](../product/BUSINESS_OS_BLUEPRINT.md) — not a gate, **default no** | Year 3+ |

**Unlock protocol:** CEO + DEC entry + update to MVP Gap Analysis LATER → NEXT.

---

# 8. Definition of Product-Market Fit

PMF is **not** a feeling. It is a **scorecard** — all criteria must pass for **two consecutive monthly reviews**.

| # | Metric | PMF threshold | Source |
| - | ------ | ------------- | ------ |
| 1 | **First result rate** | ≥ **80%** of signups (rolling 30d) | [MVP Definition](../product/MVP_DEFINITION.md) |
| 2 | **TTFV median** | **&lt; 5 minutes** | [Metrics](../business/METRICS.md) |
| 3 | **D7 after first result** | ≥ **50%** | Metrics |
| 4 | **D30 after first result** | ≥ **35%** | Metrics |
| 5 | **WABO / WAB ratio** | ≥ **60%** | Metrics |
| 6 | **Free → paid (30d post-first-result)** | ≥ **8%** | [Pricing Strategy](../business/PRICING_STRATEGY.md) |
| 7 | **Logo churn (paid)** | **&lt; 5% / month** | Metrics |
| 8 | **WABO WoW growth** | **Positive** 6 of last 8 weeks | Operating reality |
| 9 | **Non-founder paid %** | ≥ **30%** of new paid from non-founder channel (rolling quarter) | [First 100 Customers](../operations/FIRST_100_CUSTOMERS.md) |
| 10 | **Partner "would use" rate** | ≥ **70%** of last 10 results rated usable | Council validation |

**PMF declared:** CEO signs scorecard — published internally, not marketed externally.

**Not PMF:** Press, investor interest, Twitter praise, feature parity with ChatGPT, total signups.

---

# 9. Definition of Ready

A feature enters development only when **all** are true:

| # | Criterion |
| - | --------- |
| 1 | **Problem** documented in one user-language sentence |
| 2 | **Product Review** passed (§3) — metric, owner, kill date |
| 3 | **Gap ID** or **Customer Council ref** (named partner + quote) |
| 4 | **NOW slot** — max 3 active; this item is one of them |
| 5 | **Kill list** — item not forbidden, or gate passed + DEC |
| 6 | **Smallest validation** defined ([MVP Gap Analysis](../product/MVP_GAP_ANALYSIS.md) column) |
| 7 | **No manifesto conflict** — principle cited |
| 8 | **Design** — sketch or copy doc if user-facing; not required for bugfix |
| 9 | **Dependencies** identified — runtime, billing, etc. |
| 10 | **Owner** named for metric and delivery |

**Ready marker:** `READY: [feature] — [date] — [owner]` in weekly ops note.

Not ready = backlog. Backlog is not a commitment.

---

# 10. Definition of Done

A feature ships only when **all** are true:

| # | Criterion |
| - | --------- |
| 1 | **Acceptance** — problem sentence is addressed in production |
| 2 | **Metric** — instrumented and visible to owner within 24h of deploy |
| 3 | **Tests** — `lint`, `build`, `npm test` pass |
| 4 | **Copy** — child principle pass; single locale on FTU; no jargon |
| 5 | **Nav** — no new placeholder; net complexity ≤ 0 |
| 6 | **Gap** — GAP ID closed or explicitly partial with follow-up |
| 7 | **Partner notice** — if council-driven, partners informed within 24h |
| 8 | **Kill date** — calendar event for metric review |
| 9 | **Rollback** — revert path documented for user-facing changes |
| 10 | **Docs** — Decision Log updated if scope or principle changed; **no new vision docs** |

**Done marker:** `SHIPPED: [feature] — [date] — metric [name] — review [date]`.

Shipped ≠ successful. Review date decides keep or kill.

---

## Document hierarchy (frozen)

```text
COMPANY_OS.md          ← how we operate (this doc)
  ├── Business docs    ← market, pricing, metrics
  ├── Product docs     ← manifesto, gaps, MVP, transformation
  └── Operations docs  ← first 100 customers
```

New documents require CEO approval and must **replace or narrow** — not add parallel strategy.

---

## Implementation sequence (from today)

Per [MVP Gap Analysis](../product/MVP_GAP_ANALYSIS.md) — the company does not scale building until:

```text
Real results → Instrumentation → 5 moderated tests → 20 design partners
  → D7 proof → Manual billing → 100 paying → PMF scorecard
```

Everything else waits on the kill list.

---

From this point forward, documents stop growing. Product quality grows.

---

*Company OS v1.0 — strategic operating system for the team building AI Business OS.*
