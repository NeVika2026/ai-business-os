# Sonic Identity — OSA v1

> **Status:** Brand Identity v1 — rules only, no audio files  
> **Implementation reference:** `utils/voice/voice-welcome.ts`, `components/voice/VoiceWelcome.tsx`  
> **Principle:** Sound is optional, initiated by the user, and always in Russian for brand touchpoints

---

## 1. Role of sound in the brand

OSA uses sound sparingly. The product is visual and textual first; audio supports **welcome and orientation**, not constant feedback.

Sound brand attributes:

| Attribute | Description |
| --------- | ----------- |
| **Optional** | User taps to enable — never autoplay on login |
| **Human** | Spoken voice via Web Speech API or future recorded voice |
| **Calm** | Moderate rate, neutral pitch, no urgency |
| **Russian** | `ru-RU` for all brand welcome scripts |

There is no sonic logo (no sting, chime, or mnemonic tone) in v1.

---

## 2. Voice welcome — canonical pattern

**Control labels (fixed):**

- Enable: `Включить приветствие`
- Stop: `Остановить`

**Behavior:**

1. User taps enable.
2. If Web Speech API available → speak script at `rate: 0.94`, `pitch: 1`, `lang: ru-RU`.
3. If unavailable or error → show script as text block (left border accent, secondary text color).
4. On unmount or stop → `speechSynthesis.cancel()`.

**Scripts** live in `utils/voice/voice-welcome.ts`:

| Context | Constant |
| ------- | -------- |
| Login first screen | `LOGIN_VOICE_WELCOME_TEXT` |
| Home (returning) | `HOME_VOICE_WELCOME_TEXT` |

New surfaces must add a named constant — not inline strings in components.

---

## 3. Login welcome script (reference)

Purpose: orient first-time user — outcome first, registration later, no AI jargon.

Tone: calm colleague, not announcer, not sales.

Content criteria:

- Short sentences
- No model names, no “нейросеть” as self-description (user may say it; brand does not lead with it)
- Mentions first draft before account
- Matches [BRAND_DNA.md](./BRAND_DNA.md) temperament

---

## 4. What sound is not (v1)

| Excluded | Reason |
| -------- | ------ |
| Autoplay on page load | Violates trust and accessibility |
| Notification sounds per agent | Exposes machinery |
| Victory chimes on result | Gamification |
| Provider-branded voices | Breaks invisible engine |
| Background music | Off-brand for business OS |

---

## 5. Future audio layers (not v1)

When produced, these extend sonic identity without replacing voice welcome rules:

| Layer | Use |
| ----- | --- |
| **UI feedback** | Subtle click confirm — optional, system-muted |
| **Error** | No sound — text only |
| **Recorded human voice** | Replace synthesis for login welcome — same script, same controls |

Any new sound requires: user gesture to start, mute respect, Russian copy document.

---

## 6. Technical constraints

- Implement via `speakWelcomeText()` / `stopWelcomeSpeech()` — single module.
- Components: `components/voice/VoiceWelcome.tsx` only — wrappers pass `welcomeText`.
- Test: speech unavailable in Node test env → `isSpeechSynthesisSupported()` false.

---

## 7. Accessibility

- Buttons have `aria-label` matching visible Russian labels.
- Fallback text uses `aria-live="polite"` when shown.
- Do not rely on sound as the only channel for required information.
- Respect system volume; no override.

---

## 8. Misuse — do not

- Autoplay welcome on `/login`
- Play sound on every navigation
- Use English TTS on Russian-first screens
- Add “AI assistant speaking” visualization with waveforms and model names
- Replace calm voice with hype music bed

---

## 9. Checklist for new sonic touchpoints

- [ ] User gesture before play
- [ ] Stop control visible while playing
- [ ] Russian script in `utils/voice/`
- [ ] Text fallback if API missing
- [ ] No provider or model mention in script
- [ ] Cleanup on route leave

---

## 10. Sonic Logo

**Sonic Logo** is a mandatory part of the OSA brand identity.

It is the short, recognizable sound that marks the system's presence — distinct from voice welcome scripts and distinct from UI feedback clicks. It answers: *this is OSA, arriving calmly*.

| Phase | Requirement |
| ----- | ----------- |
| **Now (v2)** | A temporary Sonic Logo is permitted — synthesized tone, simple motif, or provisional recording |
| **Later** | Replaced by a professional studio recording without changing brand rules |

Rules:

- Sonic Logo is **never** autoplay on login or first visit — same gesture policy as voice welcome unless a future product decision defines a single branded moment with explicit user consent.
- Sonic Logo does not replace voice welcome; they may coexist but serve different roles (signature vs orientation).
- No provider association — the sound must not resemble vendor chimes or assistant defaults from platform OS.
- Duration: short — typically under 2 seconds for the core motif.
- Must work at low volume; must respect mute and `prefers-reduced-motion` / system accessibility settings.

Until the final asset exists, document the temporary implementation path in engineering handoff. The **obligation to have a Sonic Logo** stands even when the asset is interim.

See also: [BRAND_MANIFESTO.md](./BRAND_MANIFESTO.md) — why sound is part of system presence, not decoration.
