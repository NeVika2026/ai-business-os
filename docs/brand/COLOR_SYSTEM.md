# Color System — OSA v1

> **Status:** Brand Identity v1  
> **Implementation reference:** `styles/tokens.css`  
> **Principle:** Light, calm, operational — not dashboard dark mode by default

---

## 1. Role of color in the brand

Color supports **clarity and one clear action per screen**. It does not decorate, alarm, or imply “AI magic” through gradients.

OSA brand color is **confident blue-violet accent on neutral surfaces** — professional, not playful.

---

## 2. Core tokens (light — primary brand mode)

| Token | Value | Use |
| ----- | ----- | --- |
| `--surface-0` | `#ffffff` | Page background, cards on white |
| `--surface-1` | `#f7f8fb` | Subtle panels, input backgrounds |
| `--surface-2` | `#eef1f7` | Hover, chips, secondary plates |
| `--text-primary` | `#10131a` | Headlines, body |
| `--text-secondary` | `#5b6472` | Supporting copy, placeholders |
| `--border-subtle` | `#dfe4ec` | Dividers, input borders |
| `--accent` | `#3d4fe0` | Primary actions, Orbit mark, focus rings |
| `--accent-soft` | `#eef0ff` | Soft highlights, focus halo |

These values are the **canonical brand colors** until a formal rebrand amends tokens.

---

## 3. Dark mode

`[data-theme='dark']` exists for technical surfaces; **brand-first experiences** (login, first result, welcome) default to **light**.

| Token | Dark value |
| ----- | ---------- |
| `--surface-0` | `#0b0f1a` |
| `--accent` | `#7c8cff` |

Do not use dark theme for first-touch onboarding without explicit product decision.

---

## 4. Semantic mapping

| Meaning | Color |
| ------- | ----- |
| Primary action | `--accent` fill, white label |
| Secondary action | `--surface-0` + `--border-subtle` border |
| Destructive | System red outside brand palette — use sparingly, never as brand accent |
| Success | No brand green in v1 — use text confirmation, not celebration UI |
| Disabled | Reduced opacity on existing colors, no new grays |

---

## 5. Prohibited patterns

- Full-screen gradients as brand background
- Purple-to-pink “AI” gradients
- Yellow-black (wasp association)
- Neon glow, glassmorphism stacks, heavy shadows as identity
- Multiple accent hues competing on one screen
- Provider brand colors (OpenAI green, Anthropic tan, etc.) anywhere in product UI

---

## 6. Orbit mark on color

| Background | Mark color |
| ---------- | ---------- |
| `--surface-0` | `--accent` |
| `--surface-1` | `--accent` |
| `--accent` button | `#ffffff` |
| Photography | White or `--accent` on scrim plate |

---

## 7. Accessibility

- Text on `--surface-0`: `--text-primary` and `--text-secondary` must meet WCAG AA for body sizes.
- `--accent` buttons: white text only.
- Focus: `ring-2 ring-[var(--accent)]` or `ring-[var(--accent-soft)]` — never remove focus indicators for minimalism.

---

## 8. Typography color

- Headlines: `--text-primary`
- Subheads and hints: `--text-secondary`
- Links inline: `--accent`, underline on hover optional
- No colored body paragraphs for decoration

---

## 9. Extension (later)

Charts, status badges, and marketplace modules may need a **secondary semantic palette**. Extensions must not replace or dilute `--accent` as the single brand action color.

Document additions in this file with version bump (v1.1).
