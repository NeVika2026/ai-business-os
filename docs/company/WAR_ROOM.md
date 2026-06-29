# WAR ROOM

**Week of:** 30 June 2026  
**Updated:** Monday 30 June 2026  
**Rule:** Rewrite every Monday. Delete everything above. No archive.

---

# NORTH STAR

Ship one real result a stranger would use — then measure it.

---

# THIS WEEK'S SINGLE GOAL

**Enable real completion on the goal → Result path and pass the internal 8/10 usable-output bar.**

Everything else is secondary.

---

# TOP 5 RISKS

| # | Risk | P | Impact | Owner | Deadline |
| - | ---- | - | ------ | ----- | -------- |
| 1 | Default path still returns demo text, not business work | High | Critical | Engineering | Wed 2 Jul |
| 2 | We invite users before moderated test passes | Med | Critical | CEO | Fri 4 Jul |
| 3 | No funnel instrumentation — flying blind on TTFV | High | High | Engineering | Tue 1 Jul |
| 4 | Team builds NEXT/LATER while NOW is open | Med | High | CEO | Mon 30 Jun |
| 5 | Strategy docs replace shipping | Low | Med | CEO | Mon 30 Jun |

---

# TOP 5 ASSUMPTIONS

| # | We believe | Prove / disprove | By |
| - | ---------- | ---------------- | -- |
| 1 | Solo owners will use output from `find_clients` goal | 8/10 internal runs rated usable | Wed 2 Jul |
| 2 | Intent confirmation increases trust without killing TTFV | 5 moderated tests; intent Start ≥ 85% | Fri 4 Jul |
| 3 | Auto-project + linked run drives D7 return | Dogfood: 10 runs with project_id set | Thu 3 Jul |
| 4 | Magic link is acceptable friction for design partners | Partner intake notes on login delay | Fri 4 Jul |
| 5 | English FTU copy is sufficient for ICP 1 | Zero locale confusion in moderated tests | Fri 4 Jul |

---

# CUSTOMER VOICES

1. —
2. —
3. —
4. —
5. —

---

# WHAT WE LEARNED THIS WEEK

*Monday — empty until Friday.*

---

# WHAT WE STOPPED DOING

- Writing new strategy documents
- Inviting design partners until real results ship
- Showing disabled search and notifications in header
- Shipping simulated/demo text to any external user
- Cabinet merge, CRM in nav, marketplace, academy on roadmap
- Weekly roadmap changes outside Monday review
- Treating UX shape as proof of product value

---

# NEXT DECISION

**Go / No-Go: run 5 moderated user tests this week?**

If **Go** (real results on staging by Wed): recruitment starts Wed; tests Thu–Fri.  
If **No-Go**: only internal dogfood; no partner outreach.

**If solved:** We stop debating readiness and start learning from strangers.

---

# SHIP LIST

| Ship | Owner | Customer outcome | Metric |
| ---- | ----- | ---------------- | ------ |
| Runtime completion on goal flow (staging) | Engineering | Usable plan/draft, not demo text | 8/10 internal "would use" |
| English FTU copy (login + errors + result) | Product | Product feels finished | 0 RU strings on FTU path |
| Auto-create project + link run | Engineering | Work has a home | 100% new goals → project_id |
| Events: signup, goal, intent_start, result_view | Engineering | TTFV measurable | 4 events firing in staging |
| Landing page (promise + login CTA) | Product | 30-second comprehension | Qualitative in moderated test |
| Hide disabled header + stub Result actions | Engineering | No "broken product" signals | 0 disabled FTU chrome |
| Internal dogfood protocol (10 runs) | CEO | Team eats own cooking | 10 completed runs logged |

---

# BLOCKERS

| Blocker | Owner | Missing decision |
| ------- | ----- | ---------------- |
| `RUNTIME_BRIDGE_ENABLED` off in prod path | Engineering | Which provider + env for staging cohort? |
| No `project_id` on goal flow runs | Engineering | None — ship Tue |
| No analytics events | Engineering | Event schema sign-off (30 min) |
| No landing page | Product | Copy approval — one paragraph |
| Zero customer quotes | CEO | Go/No-Go on moderated tests |
| Uncommitted product/docs on branch | Engineering | Commit or discard before dogfood |

---

# END OF WEEK REVIEW

*Complete Friday. Three each. One change for next week.*

**Wins:**  
1. —  
2. —  
3. —

**Failures:**  
1. —  
2. —  
3. —

**Surprises:**  
1. —  
2. —  
3. —

**One change next week:** —
