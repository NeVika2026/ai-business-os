<!-- markdownlint-disable MD013 MD060 MD036 MD024 -->

# AI Business OS — Product Storyboard

**Format:** Scene-by-scene visual script  
**Status:** Draft for design approval  
**Rule:** After approval, all UI work follows this storyboard — not ad-hoc screens.

---

## Cast

**Alex** — solo founder, four-person consultancy, no time for another tool.  
**The OS** — never seen. Never named. One calm voice when invited.

---

## ACT I — ARRIVAL

---

### SCENE 01 · First Visit

**Screen title:** The Door  
**Route:** `/` → `/login`

**Purpose**  
One breath to understand what this is. No dashboard. No feature tour. A door, not a lobby.

**Emotion**  
Curiosity without commitment. *Maybe this is different.*

**Layout sketch**

```text
┌────────────────────────────────────────┐
│                                        │
│                                        │
│            AI Business OS              │
│                                        │
│     Turn business goals into           │
│     finished work — today.             │
│                                        │
│     ┌────────────────────────────┐     │
│     │  you@company.com           │     │
│     └────────────────────────────┘     │
│                                        │
│     ┌────────────────────────────┐     │
│     │        Continue            │     │
│     └────────────────────────────┘     │
│                                        │
│     No password. Link in your inbox.   │
│                                        │
└────────────────────────────────────────┘
```

**Transition**  
Fade from white. Email field receives focus. Submit → cut to **Scene 02** (inbox beat, off-screen) → hard cut to **Scene 03** on magic-link open.

**Animation**  
Logo and headline: single `wow-fade-in`, 0.5s. No carousel. No particles.

**Voice**  
None. Silence is intentional.

**Primary CTA**  
`Continue`

---

### SCENE 02 · Introduction

**Screen title:** Today — First Light  
**Route:** `/home` (first authenticated frame)

**Purpose**  
Alex lands inside the product for the first time. Not a dashboard — a briefing. One human question waiting.

**Emotion**  
Recognition. *It’s about my day, not software menus.*

**Layout sketch**

```text
┌────────────────────────────────────────┐
│  Today                                 │
│                                        │
│  Good morning, Alex.                   │
│                                        │
│  Let's make today productive.          │
│                                        │
│  Today starts with one clear priority. │
│                                        │
│  ( ◦ )  Включить приветствие           │
│                                        │
│  ─────────────────────────────────     │
│                                        │
│  What would you like to achieve today? │
│                                        │
│  ┌─────────────┐  ┌─────────────┐      │
│  │ 🎯 Find     │  │ 📈 Grow     │      │
│  │ more clients│  │ revenue     │      │
│  └─────────────┘  └─────────────┘      │
│  ┌─────────────┐  ┌─────────────┐      │
│  │ ✨ Launch   │  │ ✍️ Create   │      │
│  │ something   │  │ content     │      │
│  └─────────────┘  └─────────────┘      │
│         ... two more chips ...         │
│                                        │
└────────────────────────────────────────┘
```

**Transition**  
Cut from login callback. Shell appears instantly; content fades up in sequence: label → name → headline → chips.

**Animation**  
Greeting block: `wow-fade-in`. Voice pill: `wow-fade-in` + `wow-delay-1`. Goal grid: static — no stagger wave.

**Voice**  
Optional. User taps **«Включить приветствие»** → Russian welcome plays (Web Speech). Stop available. Never autoplays.

**Primary CTA**  
Goal chip — e.g. **Find more clients**

---

### SCENE 03 · Goal

**Screen title:** The Choice  
**Route:** `/home` → handoff → `/workspace`

**Purpose**  
Alex names the outcome. The platform accepts without forms, modules, or agent pickers.

**Emotion**  
Agency. *I said what I want. It didn’t ask me to configure anything.*

**Layout sketch — beat A: selection**

```text
┌────────────────────────────────────────┐
│  What would you like to achieve today? │
│                                        │
│  ┌══════════════════════════════════┐  │
│  ║ 🎯  Find more clients            ║  │  ← selected
│  └══════════════════════════════════┘  │
│                                        │
│  Getting ready for Find more clients…  │
│                                        │
└────────────────────────────────────────┘
```

**Layout sketch — beat B: arrival**

```text
┌────────────────────────────────────────┐
│                                        │
│  Nice choice, Alex.                    │
│                                        │
│  I'll prepare something practical      │
│  for find clients.                     │
│                                        │
│  This is tailored to your business —   │
│  not a generic template.               │
│                                        │
│              [ Continue → ]            │
│                                        │
└────────────────────────────────────────┘
```

**Transition**  
Chip tap → chip border glows → status line → crossfade to Wow beat → Continue pushes to **Scene 04**.

**Animation**  
Selected chip: border accent, 200ms. Wow headline: `wow-rise-in`. Continue button: no pulse — confidence, not urgency.

**Voice**  
None.

**Primary CTA**  
`Continue` (Wow beat) → enters thinking

---

## ACT II — THE INVISIBLE WORK

---

### SCENE 04 · Thinking

**Screen title:** The Room Behind the Door  
**Route:** `/workspace` — Intent → Work

**Purpose**  
Show understanding before action. Then disappear while work happens. Alex never sees agents, graphs, or runtime.

**Emotion**  
Trust building. *It heard me right. Now it’s working — I don’t need to watch.*

**Layout sketch — beat A: mirror**

```text
┌────────────────────────────────────────┐
│  ← Today                               │
│                                        │
│  FIND CLIENTS                          │
│                                        │
│  Here's what I understood              │
│  ─────────────────────────             │
│  You want more clients for your        │
│  design consultancy.                   │
│                                        │
│  I'll deliver                          │
│  • Ideal customer profile              │
│  • Where to reach them                 │
│  • This week's action list             │
│  • Outreach message you can send       │
│                                        │
│  ┌────────────────────────────────┐    │
│  │         Start                  │    │
│  └────────────────────────────────┘    │
│                                        │
└────────────────────────────────────────┘
```

**Layout sketch — beat B: working**

```text
┌────────────────────────────────────────┐
│                                        │
│           ◌                            │
│                                        │
│  Preparing your client plan…           │
│                                        │
│  ✓ Connected today's goal              │
│                                        │
│  (no agent names · no progress bars    │
│   tied to fake percentages)            │
│                                        │
└────────────────────────────────────────┘
```

**Transition**  
Start → full-screen work state → dissolve when complete → **Scene 05**.

**Animation**  
Intent card: fade up. On Start: gentle opacity shift to working state. Completion: single fade to Result — no confetti.

**Voice**  
None during work. Silence = competence.

**Primary CTA**  
`Start` (beat A only)

---

### SCENE 05 · First Result

**Screen title:** The Payoff  
**Route:** `/results/[id]` — first completion

**Purpose**  
The movie’s midpoint. Alex receives finished work — not a chat log. One headline, one deliverable, one next step.

**Emotion**  
Relieved surprise. *I wasn’t sold a dashboard — I got something done.*

**Layout sketch**

```text
┌────────────────────────────────────────┐
│  ← Today                               │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ ✓ Your client acquisition plan   │  │
│  │   is ready.                      │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Reach studio founders on LinkedIn     │
│  this week.                            │
│  Find Clients · Saved to Client Growth │
│  · Today                               │
│                                        │
│  ┌─ IDEAL CUSTOMER ────────────────┐   │
│  │ • Runs a small product team…    │   │
│  └─────────────────────────────────┘   │
│  ┌─ WHERE TO REACH THEM ───────────┐   │
│  │ • LinkedIn · warm intros…       │   │
│  └─────────────────────────────────┘   │
│  ┌─ THIS WEEK ─────────────────────┐   │
│  │ Mon: …  Tue: …                  │   │
│  └─────────────────────────────────┘   │
│  ┌─ OUTREACH DRAFT ─────── [ Copy ]┐   │
│  │ Hi [Name], …                    │   │
│  └─────────────────────────────────┘   │
│                                        │
│  DO THIS NEXT                          │
│  ┌────────────────────────────────┐    │
│  │ Send your first outreach today →│    │
│  └────────────────────────────────┘    │
│  Continue tomorrow                     │
│                                        │
│  📁 Client Growth    History           │
│  Timeline ∨                            │
│                                        │
└────────────────────────────────────────┘
```

**Transition**  
Hard cut from working state — first frame is celebration strip, then headline rises. Feels like opening an envelope.

**Animation**  
Celebration: `wow-fade-in`. Headline: hold — no typewriter. Sections: static scroll. Primary CTA: last element in viewport on mobile.

**Voice**  
None. The text *is* the voice — one capable colleague on the page.

**Primary CTA**  
`Send your first outreach today` → scroll to outreach draft

---

### SCENE 06 · Registration

**Screen title:** Keep What You Earned  
**Route:** modal or `/login` completion — after first result

**Purpose**  
Account exists to **preserve** the result — not to gate it. Alex already received value; now the thread gets a home.

**Emotion**  
Ownership. *This is mine. I don’t want to lose what I just built.*

**Layout sketch**

```text
┌────────────────────────────────────────┐
│                                        │
│     Your first result is saved.        │
│                                        │
│     Confirm your email to keep         │
│     Client Growth and your history     │
│     if you switch devices.             │
│                                        │
│     ┌────────────────────────────┐     │
│     │  alex@studio.com      ✓    │     │
│     └────────────────────────────┘     │
│                                        │
│     ┌────────────────────────────┐     │
│     │      Save my work          │     │
│     └────────────────────────────┘     │
│                                        │
│     Continue without saving →          │
│                                        │
└────────────────────────────────────────┘
```

**Transition**  
Slide up from bottom (mobile) or centered card (desktop) over dimmed Result. Dismiss → return to Result. Confirm → cut to **Scene 07**.

**Animation**  
Backdrop: 200ms fade. Card: `wow-rise-in` 0.4s. No shaking icons.

**Voice**  
None.

**Primary CTA**  
`Save my work`

---

## ACT III — RETURN

---

### SCENE 07 · Today

**Screen title:** Day Two — The Briefing  
**Route:** `/home` — returning user

**Purpose**  
Today is not six equal doors. It is **where you left off** — one recommendation, one priority.

**Emotion**  
Continuity. *It remembers. I’m not starting over.*

**Layout sketch**

```text
┌────────────────────────────────────────┐
│  Today                                 │
│                                        │
│  Good morning, Alex.                   │
│                                        │
│  Let's make today productive.          │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ Yesterday we prepared outreach   │  │
│  │ for your design consultancy.     │  │
│  └──────────────────────────────────┘  │
│                                        │
│  What would you like to achieve today? │
│  (chips — secondary to continue)       │
│                                        │
└────────────────────────────────────────┘
```

**Transition**  
App open → Today loads from cache → personal welcome fades in before chips.

**Animation**  
Personal welcome: `wow-fade-in`. Chips: no animation — stable surface.

**Voice**  
None on return visits. Voice welcome hidden.

**Primary CTA**  
Implicit: read welcome → choose chip OR **Scene 08**

---

### SCENE 08 · Continue

**Screen title:** One Tap Back  
**Route:** `/home` — Continue block

**Purpose**  
Fastest path to progress. The product’s retention hinge.

**Emotion**  
Momentum. *I'm actually doing the growth work.*

**Layout sketch**

```text
┌────────────────────────────────────────┐
│  IN PROGRESS                           │
│                                        │
│  Continue where you left off           │
│                                        │
│  Client Growth                         │
│                                        │
│  This is the fastest way back          │
│  to progress.                          │
│                                        │
│  ┌────────────────────────────────┐    │
│  │      Continue working          │    │
│  └────────────────────────────────┘    │
│                                        │
└────────────────────────────────────────┘
```

**Transition**  
Continue tap → push to `/projects/[id]` or resume handoff → **Scene 04** (thinking) or project surface.

**Animation**  
Card: accent border glow on hover only. Button: standard press state — no bounce.

**Voice**  
None.

**Primary CTA**  
`Continue working`

---

### SCENE 09 · Result

**Screen title:** The Second Payoff  
**Route:** `/results/[id]` — repeat visit

**Purpose**  
Same structure as first result — no celebration strip. Proof that the system is reliable, not a one-time demo.

**Emotion**  
Competence. *Same quality. Deeper thread.*

**Layout sketch**

```text
┌────────────────────────────────────────┐
│  ← Today                               │
│                                        │
│  Follow up with three warm leads       │
│  before Friday.                        │
│  Find Clients · Client Growth · Today  │
│                                        │
│  ┌─ FOLLOW-UP SEQUENCE ──────────────┐ │
│  │ Day 1: …                        │ │
│  └───────────────────────────────────┘ │
│  ┌─ MESSAGE VARIANTS ──────────────┐ │
│  │ …                               │ │
│  └───────────────────────────────────┘ │
│                                        │
│  DO THIS NEXT                          │
│  ┌────────────────────────────────┐    │
│  │ Send your first outreach today →│    │
│  └────────────────────────────────┘    │
│  Continue tomorrow                     │
│                                        │
│  (no celebration · no payment banner   │
│   until third result)                  │
│                                        │
└────────────────────────────────────────┘
```

**Transition**  
From work completion → same dissolve as Scene 05. From History → instant load, scroll at headline.

**Animation**  
None on celebration (absent). Content fade-in 0.3s if from loading.

**Voice**  
None.

**Primary CTA**  
Goal-mapped CTA — e.g. `Send your first outreach today`

---

## ACT IV — RHYTHM

---

### SCENE 10 · Weekly Review

**Screen title:** Friday — The Week in One Screen  
**Route:** `/home` — weekly beat (or dedicated weekly frame)

**Purpose**  
Close the loop. Alex sees progress without digging through history. Sets up next week in one glance.

**Emotion**  
Ownership and calm pride. *This is how I run my week now.*

**Layout sketch**

```text
┌────────────────────────────────────────┐
│  Today                                 │
│                                        │
│  Good afternoon, Alex.                 │
│                                        │
│  YOUR WEEK                             │
│  ─────────────────────────             │
│  3 results completed                   │
│  Client Growth · active                │
│                                        │
│  ✓ Client acquisition plan             │
│  ✓ Outreach sequence                   │
│  ✓ Follow-up before client call        │
│                                        │
│  MOVED FORWARD                         │
│  "You started client growth — next     │
│   step: one-page offer summary."       │
│                                        │
│  ┌────────────────────────────────┐    │
│  │   Set up next week →           │    │
│  └────────────────────────────────┘    │
│                                        │
└────────────────────────────────────────┘
```

**Transition**  
Friday open or first visit after 3+ results → weekly block expands below greeting. Other days: collapsed one-liner.

**Animation**  
Weekly block: `wow-fade-in` on first expand only. List items: no stagger.

**Voice**  
None.

**Primary CTA**  
`Set up next week`

---

### SCENE 11 · Upgrade

**Screen title:** Momentum — Not a Paywall  
**Route:** `/results/[id]` banner or `/settings`

**Purpose**  
Ask for payment **after** value is proven — when Alex has results worth keeping. Quiet, not alarmist.

**Emotion**  
Fairness. *I'd pay to keep this — not because someone nagged me.*

**Layout sketch — on Result (after 3rd result)**

```text
┌────────────────────────────────────────┐
│  … deliverable …                       │
│  … primary CTA …                       │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ You're building momentum.        │  │
│  │ 2 results left this month on     │  │
│  │ the free plan.                   │  │
│  │                                  │  │
│  │ [ Keep projects & history —      │  │
│  │   upgrade ]                      │  │
│  └──────────────────────────────────┘  │
│                                        │
│  📁 Client Growth                      │
└────────────────────────────────────────┘
```

**Layout sketch — Settings (full upgrade)**

```text
┌────────────────────────────────────────┐
│  Settings                              │
│                                        │
│  YOUR PLAN                             │
│  Free — 2 results left this month      │
│                                        │
│  Pro                                   │
│  Weekly progress · 5 projects          │
│  Full history                          │
│                                        │
│  ┌────────────────────────────────┐    │
│  │        Upgrade to Pro          │    │
│  └────────────────────────────────┘    │
│                                        │
└────────────────────────────────────────┘
```

**Transition**  
Banner: fades in below CTA after third result view — never blocks reading deliverable. Upgrade tap → Settings slide.

**Animation**  
Banner: 0.4s fade-up once per session. No countdown timers. No flashing.

**Voice**  
None.

**Primary CTA**  
`Keep your projects and history — upgrade`

---

## END CARD

```text
┌────────────────────────────────────────┐
│                                        │
│   The product is not a movie about AI. │
│                                        │
│   It is a movie about Alex getting     │
│   one important thing done —           │
│   then another —                       │
│   until the week runs itself.           │
│                                        │
└────────────────────────────────────────┘
```

---

## Storyboard index

| # | Scene | Screen title | Route |
| - | ----- | -------------- | ----- |
| 01 | First Visit | The Door | `/login` |
| 02 | Introduction | Today — First Light | `/home` |
| 03 | Goal | The Choice | `/home` → `/workspace` |
| 04 | Thinking | The Room Behind the Door | `/workspace` |
| 05 | First Result | The Payoff | `/results/[id]` |
| 06 | Registration | Keep What You Earned | modal / confirm |
| 07 | Today | Day Two — The Briefing | `/home` |
| 08 | Continue | One Tap Back | `/home` |
| 09 | Result | The Second Payoff | `/results/[id]` |
| 10 | Weekly Review | Friday — The Week in One Screen | `/home` |
| 11 | Upgrade | Momentum — Not a Paywall | Result banner / `/settings` |

---

*Approved storyboard = law for UI. Revise here first; then build.*
