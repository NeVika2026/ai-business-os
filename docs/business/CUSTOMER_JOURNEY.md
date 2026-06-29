<!-- markdownlint-disable MD013 MD060 MD036 MD024 -->

# AI Business OS — Customer Journey v1.0

**Status:** Strategic foundation  
**Date:** 2026-06-28  
**Question this document answers:** *How does a stranger become a paying advocate?*

**Related:** [Business Model](./BUSINESS_MODEL.md) · [Retention Model](./RETENTION_MODEL.md) · [Growth Engine](./GROWTH_ENGINE.md) · [MVP Definition](../product/MVP_DEFINITION.md)

---

## Journey overview

```text
Discover  →  Understand  →  First Result  →  Trust  →  Habit  →  Advocate  →  Expansion
```

Each stage has a **user feeling**, **product job**, and **business metric**.

---

## Stage 1 — Discover

**User feeling:** "This might be different from ChatGPT."

| Touchpoint | Job | Success |
| ---------- | --- | ------- |
| Landing / referral / content | Explain outcome OS in ≤ 30 seconds | Click to sign up |
| Social proof | Show real business results, not AI demos | Credibility |
| Vertical story | Broker / consultant / owner sees themselves | Identified ICP |

**Product requirements**

- Clear promise: *What you want → Result you can use*
- No architecture jargon on first screen
- Fast path to login

**Metric:** Visit → signup rate

---

## Stage 2 — Understand

**User feeling:** "It already gets what I need."

| Touchpoint | Job | Success |
| ---------- | --- | ------- |
| Login | Low friction; one sentence of promise | Authenticated |
| Home (Today) | Smart greeting + goals | Picks a goal |
| Personal welcome | Returning context if applicable | Feels known |

**Product requirements**

- SmartGreeting: time-aware, personal
- 3–6 plain-language goals
- No dashboard overload on first visit

**Metric:** Signup → goal selected rate

---

## Stage 3 — First Result

**User feeling:** "That was fast — and useful."

| Touchpoint | Job | Success |
| ---------- | --- | ------- |
| Wow moment | Emotional differentiation in first 60s | Continues |
| Intent confirmation | Proves understanding before work starts | Accepts intent |
| Progress | Meaningful loading, not spinner | Waits confidently |
| Result page | "Here's what I prepared for you" | Reads and uses output |
| Celebration | First result acknowledged professionally | Positive emotion |

**Product requirements**

- Flow: Goal → Wow → Intent → Result
- TTFV < 5 minutes (target < 3 after onboarding polish)
- Save to project in one tap

**Metrics:** TTFV, intent acceptance rate, first-result completion rate

---

## Stage 4 — Trust

**User feeling:** "It won't surprise me or waste my time."

| Touchpoint | Job | Success |
| ---------- | --- | ------- |
| Intent screen | Shows what will be analyzed and delivered | Starts work |
| Result quality | Usable without heavy editing | Uses deliverable |
| History | Past work is findable | Opens previous result |
| Failure handling | Human language, retry path | Returns after error |
| Billing transparency | No hidden AI charges | Understands plan |

**Product requirements**

- Never expose runtime failures as user-facing jargon
- Consistent English (or single locale) across journey
- Predictable pricing aligned to results

**Metrics:** Clarification rate (lower = clearer intent), result reuse rate, support tickets per user

---

## Stage 5 — Habit

**User feeling:** "This is where I start my business week."

| Touchpoint | Job | Success |
| ---------- | --- | ------- |
| Return to Home | Personal welcome + recommendation | Picks next goal |
| Continue previous work | One tap to resume | Opens project or result |
| Weekly rhythm | 2+ results per week | Becomes WAU |
| Projects | Work accumulates in one place | Creates project #2 |

**Product requirements**

- Continue journey on Home when prior work exists
- "What's next?" on every result
- History opens Results, never technical runs

**Metrics:** D7 / D30 retention, Weekly Active Businesses, results per active user per week

---

## Stage 6 — Advocate

**User feeling:** "You should try this for your business."

| Touchpoint | Job | Success |
| ---------- | --- | ------- |
| Share result | Export or share link | Sends to peer |
| Referral program | Reward for invited business | Referral signup |
| Community / content | User story in vertical | Organic mention |
| Review | NPS or testimonial | Public proof |

**Product requirements**

- Share-friendly result presentation
- Referral credit (see Growth Engine)
- No incentive to share internal AI mechanics

**Metrics:** Referral rate, NPS, organic signup %

---

## Stage 7 — Expansion

**User feeling:** "My whole team should work this way."

| Touchpoint | Job | Success |
| ---------- | --- | ------- |
| Seat invite | Colleague joins project | Team usage |
| Tier upgrade | Hits capacity after value | Pays more |
| Vertical pack | Deeper playbook for their industry | Add-on purchase |
| Integration | CRM / calendar connected | Stickier workflow |

**Product requirements**

- Shared projects (future)
- Clear upgrade path at cap
- Integration without breaking invisible UX

**Metrics:** Expansion revenue, seats per account, net revenue retention

---

## Journey map by persona

### Solo consultant (primary)

```text
LinkedIn post → Signup → "Find Clients" goal → Wow → Intent → Result
  → Saves to project → Returns Monday → "Increase Revenue" → Upgrade to Pro
```

### Real estate broker (beachhead)

```text
Peer referral → Signup → Personal welcome (yesterday's listing work)
  → "Find Clients" → Result with acquisition plan → Shares with office
  → Team inquiry → Business tier
```

---

## Failure modes by stage

| Stage | Failure | Recovery |
| ----- | ------- | -------- |
| Discover | Looks like generic AI chat | Outcome-first landing copy |
| Understand | Too many CTAs on Home | Single primary question |
| First Result | TTFV > 10 min | Shorten flow; fix errors |
| Trust | Bad or empty result | Quality bar; clarification question |
| Habit | No reason to return | Continue + What's next |
| Advocate | Nothing shareable | Export; celebration moment |
| Expansion | No team features | Roadmap honesty; waitlist |

---

## Alignment with product phases

| Product phase | Journey impact |
| ------------- | -------------- |
| 2.1 Invisible AI | Discover + Understand |
| 2.3 Result First | First Result + Trust |
| 2.4 Intent First | Trust |
| 2.5 Wow Moment | Discover + First Result |
| 4.0 Business Model | Expansion + pricing at Trust/Habit boundary |

---

*Journey acceptance criteria should be tested with 10+ moderated sessions per ICP before public launch.*
