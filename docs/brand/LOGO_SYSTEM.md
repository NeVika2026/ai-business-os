# Logo System — Orbit v1

> **Status:** Brand Identity v1 — rules only, no artwork  
> **Mark name:** Orbit  
> **Product lockup:** OSA · AI Business OS (when text is required)

---

## 1. Components

| Component | Description |
| --------- | ----------- |
| **Orbit mark** | Primary sign: abstract orbital geometry (arc, ring, or focal point with path). Standalone symbol. |
| **Wordmark** | Set in product UI typeface (Geist Sans). “OSA” or “AI Business OS” — never custom display type in v1 specs. |
| **Lockup** | Mark + wordmark horizontal or stacked. Used where both recognition and name are needed. |

There is no insect logotype. Orbit is the only logo mark. A separate illustrative wasp may exist outside the logo system — see §11.

---

## 2. Why Orbit, not a letter or insect logotype

- **Not an insect logotype** — the logo mark must never be a literal wasp, bee, or cartoon insect. See [BRAND_DNA.md](./BRAND_DNA.md) §2 and §11 below.
- **Not a chat bubble** — avoids chatbot category.
- **Not a brain/circuit** — avoids generic AI clip art.
- **Orbit** scales from 16px favicon to signage without redraw as a character.

---

## 3. Construction principles (pre-geometry)

When final vectors are drawn, Orbit must satisfy:

1. **Single stroke weight family** — one optical weight for arc and ring; no mixed hairline and bold in the same mark.
2. **Clear center** — implied focal point; may be open (not a filled dot required).
3. **Asymmetric motion** — path suggests direction (clockwise default) without implying loading spinners in static form.
4. **Minimum curvature** — arcs readable at small sizes; avoid tight coils that moiré on screens.
5. **Square safe zone** — mark fits a 1:1 bounding box for app icons.

Exact measurements are deferred to design production; this document defines **constraints**, not SVG paths.

---

## 4. Clear space

- Clear space on all sides = **height of the inner orbital gap** (or ½ mark height if gap is ambiguous).
- No text, buttons, or imagery intrudes into clear space.
- On photography, use solid or `--surface-0` backing plate if contrast fails WCAG for the mark alone.

---

## 5. Minimum size

| Context | Minimum |
| ------- | ------- |
| Screen UI (mark only) | 20×20 CSS px |
| Favicon | 32×32 source art |
| Print | 8 mm mark height |

Below minimum, use wordmark only or simplified one-arc variant (to be defined in asset kit).

---

## 6. Color usage

| Mode | Mark |
| ---- | ---- |
| Light UI | `--accent` on `--surface-0` or `--surface-1` |
| On accent button | White mark on `--accent` fill |
| Monochrome | `--text-primary` only when color is impossible |

Full palette rules: [COLOR_SYSTEM.md](./COLOR_SYSTEM.md).

**Prohibited:** gradient fills inside the mark, rainbow AI palettes, neon glow as part of the static logo.

---

## 7. Wordmark rules

- **OSA** — uppercase, letterspacing default, semibold for headings only.
- **AI Business OS** — full product name for legal, login, and store listings.
- Do not translate the product name in the wordmark.
- No taglines in lockups (v1).

---

## 8. Misuse — do not

- Rotate Orbit as a loading spinner in brand placements (motion loading uses separate system — [MOTION_SYSTEM.md](./MOTION_SYSTEM.md)).
- Outline the mark with drop shadows for “depth brand”.
- Place on busy photography without plate.
- Combine with third-party AI vendor logos in one lockup.
- Distort, stretch, or recolor outside COLOR_SYSTEM.
- Use a literal insect silhouette **as the logo or app icon** — Orbit only in the logo system.
- Place a literal insect illustration adjacent to Orbit in product UI navigation or primary flows.

---

## 9. Coexistence with UI

- **Navigation:** mark or wordmark, not both repeated in every row.
- **Login / first screen:** wordmark optional; Orbit may appear small beside title — must not overpower primary CTA.
- **Favicon / app icon:** Orbit on `--surface-0` or soft `--accent-soft` plate.

---

## 11. Artistic OSA image (outside the logo)

The **logo** forbids a literal insect mark. The **brand** may still use an artistic image of the wasp (ОСА) in contexts separate from the logo system.

| Allowed | Not allowed |
| ------- | ----------- |
| Illustrations in marketing materials | Insect as logotype, favicon, or nav icon |
| Video and motion pieces | Product UI primary screens |
| Easter eggs and hidden moments | Confusion with Orbit mark |
| Merch and print collateral | Yellow-black warning palette as product UI theme |

Rules for artistic OSA imagery:

- **Artistic** — stylized, intentional, authored; not clip-art realism and not a mascot that replaces Orbit in the product.
- **Secondary** — never competes with Orbit on the same canvas.
- **Context-bound** — appears where the audience expects story or culture, not where they expect software chrome.
- **Temperament** — calm, precise, purposeful; not aggressive, not comic, not “cute assistant”.

Product UI continues to use Orbit and typography only. The wasp lives in the cultural layer — not in the operating layer.

---

## 10. Asset pipeline (later)

When assets are produced:

```
brand/
  orbit-mark.svg          # master
  orbit-mark-mono.svg
  lockup-horizontal.svg
  lockup-stacked.svg
  app-icon-*.png
```

Until then, engineering uses CSS tokens and typography only; no placeholder wasp assets.
