<!-- markdownlint-disable MD013 MD060 MD036 MD024 -->

# AI Business OS — Result Experience Spec v1.0

**Status:** Experience specification (no implementation)  
**Date:** 2026-06-28  
**Scope:** The **first real Result** a customer sees — per supported goal  
**Related:** [First 7 Days](./FIRST_7_DAYS.md) · [Intent confirmation](../utils/intent/intent-confirmation.ts) · [User Value Engine](./USER_VALUE_ENGINE.md)

---

## Purpose

The Result page is not a report. It is the **payoff** — the moment the user decides whether this product is software or a colleague.

**Design constraints**

| Constraint | Rule |
| ---------- | ---- |
| **Maximum reading time** | 90 seconds to full comprehension |
| **Next action** | User knows exactly what to do next before leaving |
| **First fold** | Answers: *What did I get? What do I do now?* |
| **Tone** | One capable voice — not a committee of agents |

---

## Universal information hierarchy

Read order is fixed. Users may skim; hierarchy must work if they only read **Zone A + Zone F**.

```text
┌─────────────────────────────────────────────────────────────┐
│  ZONE A — Recognition                          (~5 sec)    │
│  [First visit only] One-line celebration                   │
│  HEADLINE: Key outcome in one sentence                     │
│  Sub: Goal title · Saved to [Project] · Today              │
├─────────────────────────────────────────────────────────────┤
│  ZONE B — Payoff                               (~45 sec)   │
│  MAIN DELIVERABLE (structured, scannable)                  │
│  • Section 1                                               │
│  • Section 2                                               │
│  • Section 3                                               │
│  [Optional] Copy-ready block (message, email, checklist)   │
├─────────────────────────────────────────────────────────────┤
│  ZONE C — Proof                                (~10 sec)   │
│  "What you asked for" — one line (collapsed on mobile)     │
├─────────────────────────────────────────────────────────────┤
│  ZONE D — Action                               (~10 sec)   │
│  ████████████████████████████████████████                  │
│  ONE PRIMARY CTA — verb + object + timeframe               │
│  Secondary: Continue tomorrow (text link only)             │
├─────────────────────────────────────────────────────────────┤
│  ZONE E — Anchor                               (~5 sec)    │
│  Project chip · History link                               │
├─────────────────────────────────────────────────────────────┤
│  ZONE F — Depth (below fold)                   (~15 sec)   │
│  Timeline (human labels) · Export when live                  │
└─────────────────────────────────────────────────────────────┘
```

### Wireframe — mobile first

```text
┌──────────────────────┐
│ ← Today              │
├──────────────────────┤
│ ✓ First result ready │  ← first session only
│                      │
│ KEY OUTCOME          │  ← H1, 1 line
│ Find Clients         │  ← goal · project
├──────────────────────┤
│ ┌──────────────────┐ │
│ │ IDEAL CUSTOMER   │ │
│ │ • bullet         │ │
│ │ • bullet         │ │
│ ├──────────────────┤ │
│ │ OUTREACH PLAN    │ │
│ │ 1. ...           │ │
│ │ 2. ...           │ │
│ ├──────────────────┤ │
│ │ THIS WEEK        │ │
│ │ □ Mon ...        │ │
│ └──────────────────┘ │
├──────────────────────┤
│ ┌──────────────────┐ │
│ │ Send first       │ │  ← sole primary CTA
│ │ outreach today → │ │
│ └──────────────────┘ │
│ Continue tomorrow    │  ← link
├──────────────────────┤
│ 📁 Client Growth     │
│ Timeline ∨           │
└──────────────────────┘
```

### Wireframe — desktop

```text
┌────────────────────────────────────────────────────────────────┐
│ ← History                                                        │
├───────────────────────────────┬──────────────────────────────────┤
│ KEY OUTCOME (H1)              │  ┌─────────────────────────────┐ │
│ Goal · Project · Date         │  │ DO THIS NEXT                │ │
│                               │  │ [ Primary CTA          ]    │ │
│ ┌───────────────────────────┐ │  │ Continue tomorrow           │ │
│ │ Main deliverable          │ │  ├─────────────────────────────┤ │
│ │ (sections)                │ │  │ 📁 Project name             │ │
│ └───────────────────────────┘ │  │ Timeline ∨                  │ │
└───────────────────────────────┴──────────────────────────────────┘
```

---

## Generated vs deterministic (all goals)

| Element | Type | Notes |
| ------- | ---- | ----- |
| Page zones A–F order | **Deterministic** | Same every goal |
| Celebration (first result) | **Deterministic** template | Personalized with goal + name |
| Headline / key outcome | **Generated** | One sentence; must match intent promise |
| Section titles | **Deterministic** | From goal deliverable template |
| Section body | **Generated** | Business-specific prose |
| Copy-ready block | **Generated** | When goal includes outreach/content |
| Primary CTA label | **Deterministic** | Mapped per goal + result type |
| What's next href | **Deterministic** | Continuation map |
| Project name | **Deterministic** | From goal → default project title |
| Timeline labels | **Deterministic** | Requested → Started → Completed |
| Timeline timestamps | **Deterministic** | From run events |
| "What you asked for" | **Deterministic** | Bound intent text from confirmation |
| Payment prompt | **Deterministic** | After 3rd result in week only |

---

## Never appear (all goals)

| Forbidden | Why |
| --------- | --- |
| Agent names, team roster, traces | Invisible engine principle |
| OSA, Navigator, orchestrator, runtime | Jargon |
| Confidence %, execution plan, graph | Internal reasoning |
| Tokens, models, API, simulated | Not the product |
| Multiple primary CTAs | One decision per screen |
| Empty sections | Fail quality gate — don't ship |
| Disabled Export / Archive / Delete | Hide until live |
| Generic ChatGPT-style disclaimer wall | Kills trust |
| "Here are some ideas to consider" with no structure | Fails 90-second scan |
| Wall of text > 400 words before CTA | Exceeds reading budget |

---

## Supported goals

FTU chips surface six goals; **organize_business** and **understand_ai** are supported when selected elsewhere. All eight use the same hierarchy.

---

# Find Clients (`find_clients`)

**Intent promise:** Audience analysis · Customer profile · Acquisition strategy · Action plan

### 1. What appears first?

**Zone A:** Celebration (if first result): *"Your client acquisition plan is ready."*  
**Headline:** Who the ideal customer is + the single best channel to reach them this week.

### 2. What creates the wow?

The **Ideal Customer** section names a specific person (role, pain, trigger) — not "small businesses." User thinks: *it pictured someone I could call.*

### 3. What is immediately actionable?

- **This Week** checklist (3–5 items, Mon–Fri)  
- **Copy-ready:** One outreach message they can send today  
- **Primary CTA:** `Send your first outreach today`

### 4. What should never appear?

Pipeline CRM UI, lead lists pretending to be real contacts, fake company names.

### 5. Generated

Ideal customer narrative, channel recommendation, outreach copy, weekly checklist bodies.

### 6. Deterministic

Section order: Ideal Customer → Where to Reach Them → This Week → Outreach Draft. CTA label. Project default name: *Client Growth*.

### 7. "I would pay for this"

*I have a plan and a message I can send in the next hour — that would have taken me all afternoon.*

```text
┌──────────────────────┐
│ KEY OUTCOME          │
│ Reach [role] on      │
│ [channel] this week  │
├──────────────────────┤
│ IDEAL CUSTOMER       │
│ WHERE TO REACH THEM  │
│ THIS WEEK            │
│ ┌──────────────────┐ │
│ │ Outreach draft   │ │
│ └──────────────────┘ │
├──────────────────────┤
│ [ Send first outreach│
│   today           →] │
└──────────────────────┘
```

---

# Grow Revenue (`increase_revenue`)

**Intent promise:** Revenue opportunities · Priority actions · Action plan

### 1. What appears first?

**Headline:** The #1 revenue lever this week + expected impact in plain language (*"follow up 3 warm leads"*, not *"+15% ROI"*).

### 2. Wow?

**Priority stack** — exactly three actions ranked *do first / do second / do later* with one sentence why each.

### 3. Immediately actionable?

- Action #1 expanded with steps completable in &lt; 30 minutes  
- **Primary CTA:** `Do priority #1 today`

### 4. Never appear?

Revenue charts without data, fabricated funnel metrics, financial projections as facts.

### 5. Generated

Opportunity analysis, priority rationales, step-by-step for #1.

### 6. Deterministic

Three-tier priority layout. Section titles. Project: *Revenue Growth*.

### 7. Pay moment

*I know what to work on first — and it's only one thing.*

```text
│ PRIORITY #1  ← expanded
│ PRIORITY #2  ← collapsed
│ PRIORITY #3  ← collapsed
│ [ Do priority #1 today → ]
```

---

# Launch Business (`launch_project`)

*FTU chip label: "Launch something new".*

**Intent promise:** Launch overview · Milestone plan · First steps checklist

### 1. What appears first?

**Headline:** What launches + by when (e.g. *"Soft launch in 3 weeks — start with offer validation"*).

### 2. Wow?

**Milestone map** — 4–6 milestones as a vertical timeline with only the **first milestone** expanded.

### 3. Immediately actionable?

- First milestone broken into 3 tasks due this week  
- **Primary CTA:** `Complete milestone 1, step 1`

### 4. Never appear?

Gantt charts, dependency graphs, project-management chrome.

### 5. Generated

Milestone descriptions, first-milestone tasks, launch overview prose.

### 6. Deterministic

Milestone timeline scaffold. Project name from user context or *New Launch*.

### 7. Pay moment

*My launch stopped being a fog — I have a sequence.*

```text
│ ○ Milestone 1 ●━━━━  ← expanded
│ ○ Milestone 2        │
│ ○ Milestone 3        │
│ [ Complete step 1 → ]
```

---

# Improve Marketing / Create Content (`create_content`)

**Intent promise:** Content ideas · Draft assets · Publishing plan

### 1. What appears first?

**Headline:** The one content piece to publish first + channel.

### 2. Wow?

A **complete draft** — post, email, or script — in a copy box, not bullet ideas only.

### 3. Immediately actionable?

- Draft ready to edit  
- 2-week publishing rhythm (3 bullets max)  
- **Primary CTA:** `Publish or schedule this draft`

### 4. Never appear?

Stock-image suggestions, hashtag spam, 20 topic ideas without one draft.

### 5. Generated

Draft body, topic rationale, publishing cadence.

### 6. Deterministic

Copy box placement. Sections: Draft → Why this piece → Publishing rhythm. Project: *Content*.

### 7. Pay moment

*I didn't stare at a blank page — I have something to post.*

```text
│ ┌────────────────────┐
│ │ [Full draft text]  │
│ │                    │
│ └────────────────────┘
│ [ Publish this draft → ]
```

---

# Automate Routine Work (`automate_routine`)

**Intent promise:** Automation opportunities · Recommended first workflow · Action plan

### 1. What appears first?

**Headline:** The one repetitive task to automate first + hours saved per week (honest estimate range).

### 2. Wow?

**Before / After** — two columns, five rows max: manual today vs automated tomorrow.

### 3. Immediately actionable?

- First workflow as numbered steps (what to automate, not tool config)  
- **Primary CTA:** `Set up step 1 this week`

### 4. Never appear?

Zapier-style node graphs, integration logos, "connect 12 apps."

### 5. Generated

Task identification, before/after rows, workflow steps.

### 6. Deterministic

Before/After table format. Project: *Operations*.

### 7. Pay moment

*I can see exactly what's eating my week — and the first fix.*

```text
│ BEFORE    │ AFTER
│ ──────────┼─────────
│ ...       │ ...
│ [ Set up step 1 → ]
```

---

# Help Me Decide (`dont_know`)

*FTU chip label: "Help me decide".*

**Intent promise:** Recommended focus · Suggested first goal · Simple action plan

### 1. What appears first?

**Headline:** One recommended focus in user language (*"Start with client growth"* or *"Get organized first"*) — matches clarification answer.

### 2. Wow?

Platform **chooses** — user sees one path, not six options replayed.

### 3. Immediately actionable?

- 3-step plan for the recommended focus only  
- **Primary CTA:** `Start with step 1 on Today`

### 4. Never appear?

Re-listing all goal chips, confidence scores, "you could also…" before primary path.

### 5. Generated

Rationale for focus, 3-step plan content.

### 6. Deterministic

Single-path layout. CTA returns to Home with recommended goal pre-selected. Project: *Getting Started*.

### 7. Pay moment

*I was stuck — now I have one move.*

```text
│ RECOMMENDED FOCUS
│ WHY THIS FIRST
│ 3 STEPS
│ [ Start step 1 on Today → ]
```

---

# Organize Business (`organize_business`)

*Not on FTU chips; supported when chosen.*

**Intent promise:** Organization overview · Suggested structure · Priority cleanup steps

### 1. What appears first?

**Headline:** The single biggest organizational mess to fix first.

### 2. Wow?

**Suggested structure** — three buckets (e.g. Clients / Delivery / Admin) with what goes where — not a full taxonomy.

### 3. Immediately actionable?

- Priority cleanup: 3 tasks, &lt; 1 hour each  
- **Primary CTA:** `Do cleanup #1 today`

### 4. Never appear?

Empty folder trees, Notion clone, migrate-everything-now pressure.

### 5–7. Generated / Deterministic / Pay

Generated: bucket contents, cleanup tasks. Deterministic: three-bucket layout. Pay: *I know what to file first instead of reorganizing everything.*

---

# Learn AI (`understand_ai`)

*Supported; deprioritized for first 100 customers.*

**Intent promise:** Plain-language overview · Recommended first use cases · Starter plan

### 1. What appears first?

**Headline:** How this platform helps **this business** — not how AI works.

### 2. Wow?

**First use case** tied to their stated business — bridges to a real goal (*"Run Find Clients next"*).

### 3. Immediately actionable?

- Starter plan: 3 sessions over 2 weeks mapped to goals  
- **Primary CTA:** `Try Find Clients next`

### 4. Never appear?

Model comparisons, token limits, prompt engineering tips, AI hype.

### 5–7.

Generated: use case examples. Deterministic: bridge CTA to `find_clients`. Pay: *This is for my business, not a tech demo.*

---

## 90-second reading budget

| Zone | Seconds | Words (max) |
| ---- | ------- | ----------- |
| A Recognition | 5 | 20 |
| B Payoff | 45 | 250 |
| C Proof | 10 | 30 |
| D Action | 10 | 15 |
| E Anchor | 5 | 10 |
| F Depth | 15 | 80 (collapsed) |
| **Total** | **90** | **~405** |

**Rule:** If Zone B exceeds 250 words, collapse lowest section behind "Show more."

---

## Primary CTA map (deterministic)

| Goal | Primary CTA |
| ---- | ----------- |
| find_clients | Send your first outreach today |
| increase_revenue | Do priority #1 today |
| launch_project | Complete milestone 1, step 1 |
| create_content | Publish or schedule this draft |
| automate_routine | Set up step 1 this week |
| organize_business | Do cleanup #1 today |
| understand_ai | Try Find Clients next |
| dont_know | Start with step 1 on Today |

Secondary link (all goals): **Continue tomorrow** → Home with continuation context.

---

## First-result celebration (deterministic)

Shown once per org, Zone A only:

```text
✓  Your first result is ready.
   Everything below is yours to use today.
```

Never: confetti overload, gamification badges, share-to-Twitter prompts on first result.

---

## Quality bar before ship

A Result passes review when a design partner answers **yes** to all three:

1. **Would you use this in real work this week?**
2. **Do you know the next action without scrolling back up?**
3. **Does this match what you approved on Intent Confirmation?**

If any **no** — regenerate or fail the run; do not show the page.

---

## Payment moment on Result (experience only)

Not on first Result. After **third Result in seven days**, a quiet banner below Zone D:

```text
You're building momentum. 3 results left this month on the free plan.
[ Keep your projects and history — upgrade ]
```

User is happy to pay because Zones B + E contain work they'd lose — not because of the banner.

---

*Experience specification only. Aligns with [Intent templates](../utils/intent/intent-confirmation.ts) and [First 7 Days](./FIRST_7_DAYS.md) payment moment.*
