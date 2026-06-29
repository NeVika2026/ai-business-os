<!-- markdownlint-disable MD013 MD060 MD036 -->

# AI Business OS — Business Metrics v1.0

**Status:** Strategic foundation  
**Date:** 2026-06-28  
**Question this document answers:** *How do we know the business is working?*

**Related:** [Business Model](./BUSINESS_MODEL.md) · [Retention Model](./RETENTION_MODEL.md) · [Growth Engine](./GROWTH_ENGINE.md) · [Pricing Strategy](./PRICING_STRATEGY.md)

---

## Metrics philosophy

Measure **business outcomes for users**, not AI activity. Every metric should answer: *Are more businesses getting useful work done on the platform?*

Avoid optimizing token volume, run count, or feature clicks in isolation.

---

## North Star Metric

### Weekly Active Businesses with Outcomes (WABO)

**Definition:** Count of distinct organizations that completed **≥ 1 business result** in the trailing 7 days.

| Property | Detail |
| -------- | ------ |
| **Why** | Combines activation, retention, and value delivery |
| **Unit** | Organization (business), not user session |
| **Outcome** | `agent_run` status = completed, surfaced as Result |
| **Excludes** | Failed runs, internal test orgs, pending runs |

**North Star question:** *How many businesses got real work done this week?*

### Supporting North Star inputs

| Input | Relationship |
| ----- | ------------ |
| New businesses with first result | Top of funnel |
| Returning businesses | Retention |
| Results per active business | Depth |
| Paid businesses in WABO | Monetization quality |

---

## Core metric definitions

### 1. TTFV — Time to First Value

**Definition:** Elapsed time from **account created** to **first completed result** viewed by user.

| Target | Stage |
| ------ | ----- |
| < 10 min | MVP acceptable |
| < 5 min | Launch target |
| < 3 min | Optimized (post-Wow + Intent) |

**Segments:** By ICP, by goal, by device, by referral source.

**Why it matters:** TTFV predicts D7 retention and paid conversion more than signup volume.

---

### 2. Weekly Active Businesses (WAB)

**Definition:** Distinct organizations with **≥ 1 meaningful action** in trailing 7 days.

Meaningful actions (count toward WAB):

- Completed a result
- Started a goal (handoff created)
- Opened and continued previous work

**WAB vs WABO:** WAB includes exploration; WABO requires completed outcome. **WABO is North Star.**

| Target (post-launch) | Value |
| -------------------- | ----- |
| WABO / WAB ratio | > 60% (most active businesses complete work) |
| WoW WABO growth | Positive for first 6 months |

---

### 3. Business Outcomes

**Definition:** Count of **completed results** tagged by goal category.

| Goal category | Example outcome |
| ------------- | --------------- |
| `find_clients` | Acquisition plan delivered |
| `increase_revenue` | Revenue action plan |
| `create_content` | Content draft or calendar |
| `launch_project` | Launch milestone plan |
| `automate_routine` | Automation opportunity map |

**Reporting**

- Outcomes per org per week
- Outcome mix by ICP / vertical
- Outcome quality proxy: user saved to project, exported, or returned to same result

---

### 4. Recommendation Acceptance

**Definition:** Rate at which users accept platform guidance.

| Recommendation type | Acceptance event |
| ------------------- | ---------------- |
| Intent confirmation | User taps **Start** |
| Clarification answer | User selects one option |
| Home continuation | User taps recommended goal / continue |
| What's next | User clicks primary next step on result |
| Personal welcome suggestion | User starts recommended goal within session |

**Formula:** `accepted recommendations / shown recommendations`

| Target | Interpretation |
| ------ | -------------- |
| Intent Start > 85% | Understanding is clear |
| Clarification < 25% of sessions | Goals are specific enough |
| What's next CTR > 40% | Results drive forward motion |

**Why it matters:** Acceptance is a leading indicator of trust and retention.

---

### 5. Retention

| Metric | Definition | Target (hypothesis) |
| ------ | ---------- | ------------------- |
| **D1** | % with activity day after signup | > 40% |
| **D7** | % with activity 7 days after signup | > 30% |
| **D30** | % with activity 30 days after signup | > 25% |
| **D7 after first result** | Cohort conditioned on first result | > 50% |
| **D30 after first result** | Same cohort | > 35% |
| **Logo churn** | % orgs cancel per month | < 5% Pro |
| **Net revenue retention** | MRR from cohort including expansion | > 100% Business+ |

---

### 6. Expansion Revenue

**Definition:** MRR from existing customers beyond their starting tier — upgrades, seats, add-ons.

| Component | Examples |
| --------- | -------- |
| Tier upgrade | Starter → Pro → Business |
| Seat add-on | +1 team member |
| Vertical pack | Real estate playbook |
| Result packs | One-time capacity bump |

| Metric | Target |
| ------ | ------ |
| Expansion MRR % of total MRR | > 20% by month 12 |
| % of WAU on paid tier | > 15% at steady state |
| Upgrade within 30 days of cap hit | > 30% |

---

## Funnel metrics

```text
Visit → Signup → Goal Selected → Wow Continued → Intent Accepted
  → First Result → Project Saved → D7 Return → Paid → Expansion
```

| Stage | Metric |
| ----- | ------ |
| Visit → Signup | Landing conversion |
| Signup → Goal | Activation |
| Goal → Intent Start | Wow + intent funnel |
| Intent → Result | Execution success rate |
| Result → Save | Depth |
| Result → D7 | Retention |
| D7 → Paid | Monetization |

---

## Smile moment metrics (Phase 2.5+)

| Metric | Definition | Target |
| ------ | ---------- | ------ |
| **First minute satisfaction** | Post-session survey or proxy (continued past Wow) | > 80% |
| **Smile moment rate** | % first sessions reaching Wow + first result | > 70% |
| **Completion rate** | % started goals → completed result | > 75% |
| **Return next day** | % first-result users back within 24h | > 25% |

---

## Instrumentation map

| Product event | Metric |
| ------------- | ------ |
| `intent_confirmation_shown` | Recommendation funnel |
| `intent_confirmation_accepted` | Intent acceptance |
| `intent_clarification_shown` | Clarification rate |
| `wow_moment_shown` | Smile funnel |
| `wow_moment_continued` | Wow → Intent conversion |
| `home_handoff_created` | Goal activation |
| Result page view (completed) | Business outcome |
| Project save | Depth / retention |

*Wire events to analytics warehouse before public launch.*

---

## Dashboard hierarchy

### Executive (weekly)

1. WABO (North Star)
2. New businesses with first result
3. D7 / D30 retention (first-result cohort)
4. MRR + expansion %
5. TTFV median

### Product (daily)

1. Goal → Result completion rate
2. Intent / Wow funnel
3. Failed results %
4. Recommendation acceptance
5. TTFV p50 / p90

### Growth (weekly)

1. Signups by channel
2. Referral activations
3. Organic vs paid mix
4. CAC / LTV (when paid scales)

---

## Targets by stage

| Stage | WABO | Paying orgs | Focus |
| ----- | ---- | ----------- | ----- |
| Design partners (n=20) | 10 | 0 | TTFV + outcome quality |
| Private beta (n=100) | 40 | 10 | Retention + pricing test |
| Public launch | 200+ | 50+ | Growth engine on |
| Year 1 | 2,000+ | 500+ | Expansion revenue |

*Targets are hypotheses — revise after 90 days of real data.*

---

## Anti-metrics (do not optimize)

| Anti-metric | Why |
| ----------- | --- |
| Total tokens consumed | Incentivizes cost, not value |
| Agent runs without completion | Activity without outcome |
| Time in app without result | Engagement theater |
| Raw signups | Vanity without activation |
| Feature adoption (internal tools) | Conflicts with invisible AI |

---

## Review cadence

| Cadence | Review |
| ------- | ------ |
| Daily | Funnel health, failures |
| Weekly | WABO, retention cohorts |
| Monthly | Pricing, expansion, channel mix |
| Quarterly | North Star, targets, ICP focus |

---

*One metric owner per core KPI. No metric without a defined action when it moves.*
