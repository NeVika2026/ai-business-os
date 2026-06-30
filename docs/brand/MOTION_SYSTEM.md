# Motion System — OSA v1

> **Status:** Brand Identity v1  
> **Implementation reference:** `app/globals.css` (`wow-fade-in`, `wow-rise-in`)  
> **Principle:** Motion confirms state — it does not perform intelligence

---

## 1. Role of motion

Motion in OSA brand expresses:

- **Arrival** — content is ready, not “thinking hard”
- **Continuity** — smooth handoff between steps
- **Restraint** — the system is calm; the user’s business is not a game

Motion must never simulate AI reasoning (pulsing brains, scanning lasers, matrix rain).

---

## 2. Brand motion temperament

| Attribute | Target |
| --------- | ------ |
| Duration | Short: 0.4–0.7s for UI entrance |
| Easing | `ease-out` — decelerate into place |
| Distance | Small: 6–10px vertical translate max |
| Looping | Avoid on brand screens except explicit loading with copy |
| Autoplay | **Forbidden** for decorative motion on login and first result |

---

## 3. Canonical patterns (existing)

| Class | Behavior | Use |
| ----- | -------- | --- |
| `wow-fade-in` | Opacity 0→1, translateY 6px, 0.55s | Welcome screens, first content paint |
| `wow-rise-in` | Opacity 0→1, translateY 10px, 0.7s | Secondary blocks, staggered lists |
| `wow-delay-1` | +0.15s delay | Second element in sequence only |

**Rule:** At most **one** animated entrance sequence per screen for brand surfaces. Primary CTA may share the same fade as headline — do not cascade more than two delayed children.

---

## 4. Orbit and logo motion

When Orbit is animated (future loader or brand moment):

| Allowed | Forbidden |
| ------- | --------- |
| Slow partial arc draw (≥1.2s, once) | Infinite spin as brand logo |
| Gentle opacity breathe on idle welcome | Bouncy elastic overshoot |
| Crossfade between mark and wordmark | Morphing into wasp or chat icon |

**Orbit spin** is reserved for **operational loading** with text (“Готовим результат…”) — not for logo lockups or favicon.

---

## 5. Screen-level rules

### Login (`/login`)

- Single `wow-fade-in` on content block.
- Voice welcome: no animation on button beyond default hover.
- No background particles or parallax.

### First request / first result

- Fade in result text after load — optional one `wow-fade-in`.
- No typewriter effect for AI output in brand v1.

### In-product (dashboard)

- Respect reduced motion: `prefers-reduced-motion: reduce` → disable translate, keep opacity or instant show.

---

## 6. Loading states

| Context | Motion |
| ------- | ------ |
| Waiting for AI | Static text or subtle indeterminate bar — no model branding |
| Form submit | Button disabled state only; no full-screen spinner theatre |
| Long operations | Progress copy updates; avoid multi-step fake checkpoints |

Copy during load uses neutral Russian: “Готовим результат…”, “Работаем над запросом…” — aligned with `lib/ai/router-messages.ts`.

---

## 7. Stagger and lists

- Maximum stagger step: **150ms** between items.
- Maximum items staggered: **3** on brand screens.
- Lists of business results: no cascade animation in v1.

---

## 8. Implementation notes

```css
/* Respect user preference — required for brand compliance */
@media (prefers-reduced-motion: reduce) {
  .wow-fade-in,
  .wow-rise-in {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

Engineering should add this when implementing motion beyond documentation.

---

## 9. Misuse — do not

- Animate every card on Home simultaneously
- Use spring physics for primary navigation
- Tie animation duration to API latency (fake delays)
- Loop attention-grabbing motion on idle login screen
- Use Orbit as a permanent spinning favicon

---

## 10. Cinematic Grammar

Product motion is governed by **Director's Cut** — the internal grammar of how OSA presents time on screen.

Every branded sequence follows the same five-beat structure:

```text
Тишина
  ↓
Пауза
  ↓
Появление
  ↓
Один жест
  ↓
Снова тишина
```

| Beat | Meaning |
| ---- | ------- |
| **Тишина** | Screen stable; nothing demands attention; user or system has finished the prior beat |
| **Пауза** | Intentional stillness before change — not lag, not loading theatre |
| **Появление** | One primary element enters (copy, Orbit, result) — `wow-fade-in` scale |
| **Один жест** | A single motion with meaning: Orbit completes an arc, button confirms, handoff resolves |
| **Снова тишина** | Motion stops; user decides next step |

**Forbidden:** meaningless animation — motion without a beat in this grammar.

Examples of meaningless animation (reject in design review):

- Cards that bounce on idle
- Staggered cascades across entire dashboards
- Parallax backgrounds on login
- Fake “typing” indicators when content is already available
- Multiple simultaneous self-animated elements (violates [BRAND_DNA.md](./BRAND_DNA.md) §8 — Living Orbit)

Director's Cut is the narrative layer; technical tokens (`wow-fade-in`, durations, easing) are the implementation layer. Both must agree.

When in doubt: cut the animation. Silence is on-brand.
