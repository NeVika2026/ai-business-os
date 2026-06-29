<!-- markdownlint-disable MD013 MD060 MD036 MD024 -->

# AI Business OS — First 100 Customers Operating Plan v1.0

**Status:** Founding team operating playbook  
**Date:** 2026-06-28  
**Audience:** Founders, product, growth  
**Not in scope:** Product specs, new features, technical architecture

**Sources:** [Business Model](../business/BUSINESS_MODEL.md) · [Pricing Strategy](../business/PRICING_STRATEGY.md) · [Metrics](../business/METRICS.md) · [Growth Engine](../business/GROWTH_ENGINE.md) · [Customer Journey](../business/CUSTOMER_JOURNEY.md) · [Retention Model](../business/RETENTION_MODEL.md) · [MVP Gap Analysis](../product/MVP_GAP_ANALYSIS.md)

---

## How to use this document

This is the execution playbook for **getting 100 organizations to pay** — not for building the ten-year Business OS. Every action must trace to documented strategy. If it is not in the product or business docs, it does not ship during this phase.

**Current reality (2026-06-28):** UX path is ready; **usable results are not**. No public invite until [MVP Gap Analysis](../product/MVP_GAP_ANALYSIS.md) P0 items close. The clock on "first 100 paying" starts **after** the first design partner receives a result they would actually use.

---

# Part 1 — Success definition

### What "100 paying customers" means

| Term | Definition |
| ---- | ---------- |
| **Customer** | One **organization** (business), not one user login |
| **Paying** | Active **Pro** or **Business** subscription with successful charge in the last 30 days |
| **Excluded** | Free trial only, manual comp without payment intent, internal test orgs, failed charges |

Starter/free tier users are **not** counted. Annual prepay counts as one paying customer.

---

### Revenue target

| Metric | Target at customer #100 | Basis |
| ------ | ----------------------- | ----- |
| **MRR** | **$4,000–$5,500** | ~90% Pro at $39/mo midpoint ([Pricing Strategy](../business/PRICING_STRATEGY.md)); ~10% Business at $99/mo |
| **ARR run-rate** | **~$48K–$66K** | MRR × 12 |
| **ARPU** | **$40–$55/mo** | Blended; no Scale tier in first 100 |

Pricing is a hypothesis until 20+ paid conversions. Adjust price, not positioning, if conversion fails.

---

### Activation target

Measured on orgs that complete signup (not visitors).

| Metric | Target | Source |
| ------ | ------ | ------ |
| **First result rate** | ≥ **80%** of signups complete a result in session 1 | [MVP Definition](../product/MVP_DEFINITION.md) |
| **TTFV median** | **< 5 minutes** | [Metrics](../business/METRICS.md) |
| **Intent Start rate** | ≥ **85%** of users who see intent confirmation press Start | [Metrics](../business/METRICS.md) |
| **Goal → Result completion** | ≥ **75%** | [Metrics](../business/METRICS.md) |

Activation is a **gate** for monetization. Never charge before first result ([Pricing Strategy](../business/PRICING_STRATEGY.md)).

---

### Retention target

Cohort: orgs that completed **first result** within 7 days of signup.

| Metric | Target | Source |
| ------ | ------ | ------ |
| **D7 return** | ≥ **50%** | MVP Definition / Metrics |
| **D30 return** | ≥ **35%** | Metrics |
| **WABO participation** | ≥ **60%** of weekly active orgs complete ≥1 result | WABO / WAB ratio |
| **Logo churn (paid)** | **< 5%/month** on Pro | Metrics |
| **Free → paid (30 days post-first-result)** | ≥ **8%** | Pricing Strategy |

---

### Timeframe

| Phase | Duration | Paying customers | Focus |
| ----- | -------- | ---------------- | ----- |
| **Pre-launch validation** | Weeks 1–4 | 0 | Real results, moderated test, instrumentation |
| **Design partners** | Months 2–3 | 0 (free) | n=20, outcome quality, D7 retention |
| **Private beta + first paid** | Months 3–6 | 1–25 | Manual billing OK; pricing test |
| **Repeatable conversion** | Months 6–9 | 25–60 | PLG + founder sales + content |
| **Scale to 100** | Months 9–12 | 60–100 | Referral + community + partners |

**Target: 100 paying customers within 12 months of first design-partner invite** (not 12 months from today if pre-launch slips).

If at month 9 paid count is **< 25**, pause scaling spend and fix retention or result quality before chasing volume.

---

### Failure criteria

Stop or pivot the GTM motion if **any** of these are true after the stated checkpoint:

| Checkpoint | Failure signal | Decision |
| ---------- | -------------- | -------- |
| **After 5 moderated tests** | < 4/5 reach usable first result without help | **No invite** — fix P0 gaps |
| **After 20 design partners (90 days)** | < 50% D7 after first result | **Pause paid** — fix retention loop |
| **After 20 paid conversions** | Free → paid < 4% at 30 days | **Reprice or reposition** — not more features |
| **After 50 paid** | Logo churn > 8%/month | **Stop acquisition** — fix value delivery |
| **At month 12** | < 40 paying | **Narrow ICP** to one vertical beachhead ([Business Model](../business/BUSINESS_MODEL.md) ICP 3) |
| **At any point** | Median TTFV > 10 min | **Product hold** — UX or execution broken |

Failure is information. The wrong response is building more surface area.

---

# Part 2 — Customer profile

All three are documented ICPs. Customer #100 is still **not** enterprise — [Business Model](../business/BUSINESS_MODEL.md) anti-ICP rules apply.

---

### Customer #1 — The design partner

**Who:** Solo consultant or agency-of-one, $80K–$400K revenue, 1–3 people, English-speaking, founder's existing network.

**Example:** Independent marketing consultant, 38, serves B2B SaaS clients. Uses Notion, Gmail, ChatGPT inconsistently. No full-time ops hire.

**Job this week:** Finish a client acquisition plan before a sales call on Thursday.

**Buying trigger:** Founder asks directly: "Can I watch you try to get something useful in 30 minutes?"

**What they pay for (when they convert):** A finished plan they would have billed 2 hours to produce — not "AI access."

**Success signal:** Completes first result in one session; quotes the output in a sales call; agrees to weekly check-in for 4 weeks.

**Price at conversion:** Pro at **$39/mo** or founder price **$29/mo** for 3 months — document which and why.

**Not customer #1:** Developer evaluating APIs, enterprise IT, hobbyist, anyone who wants to configure agents.

---

### Customer #10 — The early believer

**Who:** Same ICP 1 profile but **was not** in founder's inner circle. Arrived via warm intro, office hours, or first content piece.

**Example:** Real estate broker, 44, 2-person team, needs listing follow-up and outreach sequences monthly.

**Job this week:** Prepare follow-up for three cold leads from an open house.

**Buying trigger:** Second result in seven days — habit forming ([Retention Model](../business/RETENTION_MODEL.md): ≥ 2 results/week = power user).

**What they pay for:** Repeatable weekly progress on client work without re-explaining their market each time.

**Success signal:** Project with 2+ linked results; D30 activity; upgrades without being asked when trial ends.

**Channel lesson:** By #10, you know which **one** acquisition motion (intro vs content vs community) produced the highest first-result rate.

---

### Customer #100 — The self-serve convert

**Who:** Solo operator or 2–5 person shop, $100K–$1.5M revenue. Found product through content, peer referral, or vertical community — **not** founder calendar.

**Example:** Owner of a local service business (HVAC, legal, wellness), uses platform every Monday for weekly planning and twice more for client/outreach work.

**Job this week:** Monday priority set + one deliverable shipped before Friday.

**Buying trigger:** Trial ended after **5 results** or **14 days** ([Pricing Strategy](../business/PRICING_STRATEGY.md)); platform already part of weekly rhythm.

**What they pay for:** "This is where my business work lives" — history, projects, continue, outcomes — not a chat subscription.

**Success signal:** WABO member; 3+ results/month; paid 3+ months; referred at least one peer (even informally).

**Profile shift from #1:** Less hand-holding, higher expectation of self-serve reliability. Still ICP 1 — **not** ICP 2 (5–25 employees) as primary until after #100.

---

# Part 3 — Acquisition

### Every realistic channel (from [Growth Engine](../business/GROWTH_ENGINE.md))

| # | Channel | Speed | Cost | Trust | Scalability |
| - | ------- | ----- | ---- | ----- | ----------- |
| 1 | **Founder-led design partners** (direct outreach, network) | ★★★★★ | ★★★★★ (time only) | ★★★★★ | ★ |
| 2 | **Live demos / office hours** | ★★★★ | ★★★★ | ★★★★★ | ★★ |
| 3 | **Warm introductions** (customers → peers) | ★★★★ | ★★★★★ | ★★★★★ | ★★ |
| 4 | **Vertical communities** (brokers, consultants, MLM circles) | ★★★ | ★★★★ | ★★★★ | ★★★ |
| 5 | **Product-led growth** (try after seeing result story) | ★★★ | ★★★ | ★★★ | ★★★★ |
| 6 | **Referral program** (post-first-result) | ★★ | ★★★★ | ★★★★ | ★★★★ |
| 7 | **Content / SEO** (outcome guides, JTBD articles) | ★★ | ★★★ | ★★★ | ★★★★★ |
| 8 | **LinkedIn founder narrative** | ★★★ | ★★★★ | ★★★ | ★★★ |
| 9 | **Partner / coach affiliates** | ★★ | ★★★ | ★★★★ | ★★★ |
| 10 | **Vertical associations** (bulk trial) | ★★ | ★★ | ★★★★ | ★★★ |
| 11 | **Paid social / search** | ★★★★ | ★ | ★★ | ★★★★ |
| 12 | **Integration marketplace** (CRM adjacencies) | ★ | ★★ | ★★★ | ★★★★ |

*Scale: ★ = low/poor, ★★★★★ = high/excellent.*

---

### Recommended first three only

| Priority | Channel | Why now |
| -------- | ------- | ------- |
| **1** | **Founder-led design partners** | Product is not proven. You need observation, not scale. Matches MVP user test + n=20 design partner stage ([Metrics](../business/METRICS.md)). |
| **2** | **Live office hours** (weekly, 30 min, goal → result) | Builds trust without product maturity. Validates [Customer Journey](../business/CUSTOMER_JOURNEY.md) Discover → First Result in public. |
| **3** | **Warm introductions from happy design partners** | Cheapest paid-adjacent growth. Referral **program** (credits, codes) only after invitee first-result rate is proven — not before. |

**Explicitly defer until 25+ paying:** SEO at scale, paid ads, partner marketplace, association deals, referral automation.

---

# Part 4 — Week-by-week launch

*Assumes Week 1 starts when founding team commits to this plan. Weeks 1–4 align with [MVP Gap Analysis](../product/MVP_GAP_ANALYSIS.md) validation sprint.*

---

### Week 1 — Make the result real

| | |
| - | - |
| **Objectives** | Close P0 blockers: real completion, English FTU path, hide broken UI |
| **Deliverables** | Runtime enabled on staging; landing + login promise; disabled header controls removed |
| **Metrics** | Internal dogfood: 10 runs with **usable** output; 0 demo-text results shown to users |
| **Go / No-Go** | **Go** if ≥ 8/10 internal runs produce work a founder would send to a client. **No-Go** if still simulated — do not proceed to external users |

---

### Week 2 — Measure and containerize

| | |
| - | - |
| **Objectives** | Auto-project, link runs, funnel instrumentation |
| **Deliverables** | Project auto-create on first goal; `project_id` on runs; 4 events: signup, goal, intent_start, result_view |
| **Metrics** | TTFV p50 from events; 5 moderated sessions per [MVP Definition](../product/MVP_DEFINITION.md) |
| **Go / No-Go** | **Go** if ≥ 4/5 moderated users reach usable result unaided. **No-Go** → Week 1 repeat |

---

### Week 3 — Design partner recruitment

| | |
| - | - |
| **Objectives** | Fill first 10 design partner slots (target 20 total) |
| **Deliverables** | Partner list; intake form (ICP 1 only); weekly check-in calendar; feedback doc template |
| **Metrics** | 10 partners onboarded; ≥ 7 complete first result in week 3 |
| **Go / No-Go** | **Go** if first-result rate ≥ 70% among partners. **No-Go** → fix onboarding, not marketing |

---

### Week 4 — Retention signal

| | |
| - | - |
| **Objectives** | Prove D7 hypothesis on first partner cohort |
| **Deliverables** | Partner interview notes (5 minimum); weekly metrics review doc; pricing interview (willingness to pay at $29–49) |
| **Metrics** | D7 return ≥ 40% (directional); WABO ≥ 5 orgs; intent acceptance ≥ 85% |
| **Go / No-Go** | **Go** to expand to 20 partners + prepare manual billing for converters. **No-Go** if D7 < 25% — fix Continue / What's next before paid ask |

---

# Part 5 — Daily founder cadence

### Every day

| Role | Build (≤ 50% of day) | Measure (≥ 30% of day) |
| ---- | -------------------- | ---------------------- |
| **Technical founder** | Only [MVP Gap Analysis](../product/MVP_GAP_ANALYSIS.md) NOW/NEXT items tied to partner feedback | Goal → Result funnel; failed runs %; TTFV p50 |
| **Product / CEO founder** | Copy, onboarding, interview synthesis — not new modules | WABO; D7 cohort; partner blockers verbatim |
| **Growth founder** (or CEO) | Partner outreach, office hours prep, one story drafted | Pipeline: invited / signed up / first result / paid |

### Customer conversations

| Period | Target |
| ------ | ------ |
| **Weeks 1–4** | **10+/week** (moderated tests + partner calls) |
| **Months 2–3** | **8/week** (20 design partners on rotation) |
| **Months 4–6** | **5/week** (mix partners + early paid) |
| **Months 7–12** | **3/week minimum** (never zero — even at scale) |

Every conversation answers: *What did you need? Did you get it? Will you come back? Would you pay?*

### Roadmap change frequency

| Rule | Cadence |
| ---- | ------- |
| **NOW scope** | Changes only on **Monday** after weekly metrics — max 1 priority shift/week |
| **NEXT backlog** | Reordered **biweekly** from categorized feedback |
| **LATER / vision** | **Quarterly** — never daily |

If roadmap changes more than once per week, you are avoiding hard metrics.

---

# Part 6 — User feedback loop

### Collection

| Source | Method | Owner |
| ------ | ------ | ----- |
| Design partner calls | 15-min weekly; record notes in shared doc | CEO |
| Moderated tests | [MVP Definition](../product/MVP_DEFINITION.md) protocol | Product |
| In-product | One optional question on Result page: "Would you use this?" Y/N | Product |
| Support | Single email alias; tag every thread | CEO |
| Metrics | Funnel drops (goal abandoned, intent declined, failed run) | Technical |

No feedback tool procurement until 50+ orgs. Spreadsheet + calendar is enough.

### Categorization

| Tag | Meaning | Example |
| --- | ------- | ------- |
| **BLOCKER** | Cannot complete first result | Demo text, login fail |
| **TRUST** | Understands product but hesitates | Intent confusion |
| **QUALITY** | Result completes but not usable | Generic plan |
| **RETENTION** | Won't return | No continue path |
| **MONETIZE** | Would pay but can't | No billing |
| **NOISE** | Feature request outside NOW | CRM, marketplace |

### Prioritization

```text
BLOCKER → TRUST → QUALITY → RETENTION → MONETIZE → discard NOISE
```

Max **3** active product items. If a partner reports a BLOCKER, it preempts all NEXT work.

### Closing the loop

| Step | SLA |
| ---- | --- |
| Acknowledge feedback | 24 hours |
| Categorize + decide | 48 hours |
| Ship fix (NOW items) | **≤ 5 business days** |
| Tell user it shipped | Same day as deploy |

### Product change velocity

| Change type | Target time to production |
| ----------- | ------------------------- |
| Copy / hide broken UI | 24–48 hours |
| Funnel fix (project link, events) | ≤ 3 days |
| Result quality tuning | ≤ 1 week per iteration |
| New capability | **Not in first 100 phase** unless documented in NOW |

---

# Part 7 — Metrics dashboard

Ten metrics only. If it does not predict survival, it is not on this list.

| # | Metric | Definition | Weekly action if red |
| - | ------ | ---------- | -------------------- |
| 1 | **WABO** | Orgs with ≥1 completed result in last 7 days | Interview 3 churned orgs |
| 2 | **TTFV p50** | Signup → first result viewed | Walk through FTU live |
| 3 | **First result rate** | % signups → completed result (session 1) | Fix top funnel drop |
| 4 | **D7 after first result** | % returning day 7 | Fix Continue / What's next |
| 5 | **Goal → Result completion** | % goals started → result completed | Fix execution failures |
| 6 | **Failed result %** | % runs failed / total runs | Debug runtime + prompts |
| 7 | **Paying org count** | Active Pro/Business subscriptions | — |
| 8 | **Free → paid (30d)** | % first-result cohort converting | Adjust price/offer |
| 9 | **Logo churn (paid)** | % paid orgs canceling/month | Exit interviews |
| 10 | **MRR** | Monthly recurring revenue | — |

**Not on the dashboard:** total signups, tokens, agent runs, time-in-app, feature clicks ([Metrics](../business/METRICS.md) anti-metrics).

Review: **#1–6 daily** during validation; **all ten weekly** once billing live.

---

# Part 8 — Kill criteria

Assumptions that must be validated. Each has evidence, deadline, and decision if false.

| # | Assumption | Evidence needed | Deadline | If false |
| - | ---------- | --------------- | -------- | -------- |
| 1 | Solo operators will complete a first result without training | ≥ 80% first-result rate in n=20 partners | Month 3 | Narrow to hand-guided onboarding or vertical |
| 2 | Output is good enough to use in real business | ≥ 50% partners report "used or would use" output | Month 3 | Stop GTM; fix result quality per goal |
| 3 | Users return without reminders | D7 ≥ 50% after first result | Month 4 | Fix retention loop before paid |
| 4 | Users pay for outcomes at $29–49/mo | ≥ 8% free→paid at 30d in n=50 trials | Month 6 | Test $19 or annual; do not add features |
| 5 | One acquisition channel is repeatable | 30% of paid from non-founder channel by customer #25 | Month 7 | Double down on one channel; kill others |
| 6 | Paid users stay | Logo churn < 5%/mo at n=30 paid | Month 8 | Pause acquisition; fix value |
| 7 | WABO scales with paid base | WABO ≥ 40% of total orgs at n=100 orgs | Month 9 | Product not habit-forming — retention fix |
| 8 | Referral works after results | ≥ 15% paid from referral by customer #50 | Month 10 | Defer referral program; more office hours |
| 9 | Pro tier is sufficient (no team SKU needed) | < 10% paid requests multi-seat | Customer #75 | Accelerate Business tier only if demanded |
| 10 | 12-month path to 100 paid is viable | ≥ 60 paying at month 9 | Month 9 | Extend timeline or cut burn; no feature sprawl |

---

# Part 9 — Founder rules

Ten operating principles for the first 100 customers.

1. **Never invite users before the result is real** — simulated demo text is not a product ([MVP Gap Analysis](../product/MVP_GAP_ANALYSIS.md)).

2. **Never build without observing users** — every NOW item ties to a named partner or test session.

3. **Never ship features nobody requested** — LATER stays LATER; NOISE is discarded.

4. **Measure outcomes, not activity** — WABO and completed results beat signups and runs ([Metrics](../business/METRICS.md)).

5. **Never monetize before first result** — charge when value is proven, not when trial starts ([Pricing Strategy](../business/PRICING_STRATEGY.md)).

6. **One ICP until customer #50** — ICP 1 solo operator only; no enterprise, no developers ([Business Model](../business/BUSINESS_MODEL.md)).

7. **Three acquisition channels maximum** — founder-led, office hours, warm intro until 25 paid.

8. **Talk to customers every week** — zero conversation weeks are a failure mode.

9. **Roadmap moves on Mondays** — panic pivots mid-week are banned.

10. **Sell progress, not AI** — if marketing or pricing mentions models, rewrite it ([Pricing Strategy](../business/PRICING_STRATEGY.md)).

---

# Part 10 — The First 100 Story

*A realistic execution narrative. No heroics. Dates are relative to **T0 = first design partner invite**.*

---

**Today (pre-T0):** The product has the right journey shape — Today, Wow, Intent, Result — but default execution still returns internal demo text. Founding team does not recruit externally. Two weeks close P0 gaps: real results, landing page, instrumentation, moderated tests.

**T0 + 2 weeks:** Ten design partners onboard from founder network. ICP 1 only. Weekly 15-minute calls. No billing. First metric: 7/10 complete a usable result. Three fail — all execution quality, not UX confusion. Team fixes top goal (`find_clients`) output.

**T0 + 6 weeks:** Twenty design partners active. D7 return is 45% — below 50% target but directionally viable. Continue journey and project linking ship. Partners who return cite "didn't have to start over." Five partners say they would pay $30–40/month — recorded verbatim.

**T0 + 10 weeks:** First **3 paying** customers via manual invoice (Stripe link or wire). Pro at $39/mo. All three had ≥ 4 results in 30 days. First office hours session: 12 attendees, 4 signups, 2 first results live — conversion weak but trust high.

**T0 + 4 months:** **12 paying.** Free → paid at 10% on small sample. Content begins: one anonymized "client plan in 10 minutes" story from partner #4. SEO not invested yet. Acquisition is 90% founder network + intros.

**T0 + 6 months:** **25 paying.** First non-founder channel conversion: partner #8 refers broker peer who becomes #19. Referral is informal — no productized codes yet. TTFV median 4.2 minutes. One month logo churn spike (2/25) traced to result quality regression; team rolls back prompt change.

**T0 + 8 months:** **45 paying.** Office hours biweekly. WABO at 28 orgs/week. Outcome guides produce 2–3 signups/week. Paid ads tested at $500 — CAC too high; paused per channel ranking. ICP stays solo operator.

**T0 + 10 months:** **72 paying.** Referrals account for 18% of new paid. Manual billing replaced with self-serve Stripe for Pro. D30 after first result stabilizes at 38%. Customer #50 is content-led consultant — first proof of scalable channel.

**T0 + 12 months:** **100 paying.** MRR ~$4,200. ~88 Pro, ~12 Business (early team-of-two shops asking for second seat). WABO 55 orgs/week. Founders still do 3 customer calls/week. Product has not shipped Business Brain, marketplace, or CRM to users — by design.

**What did not happen:** Enterprise sales. API launch. Multi-language. Paid ads at scale. Feature parity with ChatGPT. Those were correctly postponed ([MVP Gap Analysis](../product/MVP_GAP_ANALYSIS.md)).

**What mattered:** Usable first result → return → weekly habit → pay → tell a peer.

---

**The next milestone after 100 customers is…**

**250 paying organizations with WABO ≥ 200 and repeatable non-founder acquisition ≥ 40% of new paid** — the [Metrics](../business/METRICS.md) "public launch" operating stage — followed by disciplined expansion into **ICP 2 (5–25 employees)** and **Business tier** without diluting the outcome-first promise.

---

## Document governance

| Action | Rule |
| ------ | ---- |
| Owner | CEO / founding team |
| Update | Monthly during pursuit of 100; at customer #25, #50, #75, #100 |
| Changes to success definition | Require alignment with [Pricing Strategy](../business/PRICING_STRATEGY.md) and [Metrics](../business/METRICS.md) |

*First 100 Customers v1.0 — operating playbook, not product vision.*
