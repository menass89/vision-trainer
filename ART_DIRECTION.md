# Vision Trainer — Art Direction

> The visual soul. This is the blueprint for this app and the apps that follow it.
> Read it before designing or building any screen.

## The one-line soul

**Lunar Instrument.** A black optical-instrument field where the science *is* the art:
the Gabor patch — an interference wave windowed in a Gaussian — rendered as a tactile
celestial body. Cool, nocturnal, instrument-grade. Moonlight, not firelight. A few
deliberate moments of art floating in disciplined emptiness — never decoration, never
gamification.

## Why this, not the obvious thing

The category reflex for a vision app is white-and-teal clinical, or a cartoon eyeball.
We refuse both. Our hero object already exists and it is a *physics* object: a sinusoidal
grating under a Gaussian envelope — literally light made visible, fringes suspended in the
dark. Where Moonlitt must fetch a moon to get its celestial body, we *have* ours. The
arbitrage is total: the art is not painted onto the app, it **is** the measurement.

## The palette (locked, from `src/theme/tokens.ts`)

- **Base** `#080A0D` — near-black, faint cool tint. The void. (NOT indigo — we keep black.)
- **Raised / card** `#0E1316` / `#12181C` — barely-there elevation.
- **Accent — Instrument Cyan** `#33D2D6` — the single living hue. One accent, held with discipline.
- **Accent glow** `rgba(51,210,214,0.30)` — the bloom of the accent into black.
- **Text** `#EFF3F4` / `#A7B2B4` / `#67726F` — primary / secondary / muted.
- **Verdict** improving `#5FD0B0` · holding `#8A9099` · regressing `#E0607A` (data only, sparingly).

Work in these tokens only. Never raw `#000`/`#fff`. Every neutral is already tinted cool.

## The five steals (named, with what we take and what we leave)

| Source | Steal | Leave |
|---|---|---|
| **(Not Boring) Weather** | the **matte tactile hero sphere** (soft-shadowed, claylike, prehensile) + **brutalist mono numerals** — heavy display title, then `LABEL ········ VALUE` rows, uppercase, tabular, hairline dividers | their light background, their playful tone |
| **Moonlitt** | the **frosted-glass instrument cards** + **fine constellation-grade luminous points** (sparingly) | nocturnal indigo, weather/data clutter |
| **Endel** | the **generative wavefield that breathes** behind the hero + the **ascetic discipline** (zero chrome, zero badge) | nothing — it is the luxury-instrument benchmark |
| **Bevel** | the **floating liquid-glass tab bar** (detached, rounded, `expo-glass-effect` on iOS 26) | — |
| **Opal** | the **focal bloom radiating cyan into the black field** | all gamification: flames, badges, levels, "Get PRO", leaderboards, collectible gems |

## The hero: the Gabor as celestial body

The home screen's center of gravity. The actual Gabor stimulus, rendered large and
luminous as a celestial object:

- Sinusoidal cyan grating under a Gaussian window → reads as a glowing sphere with
  interference fringes (rings/bands), not a flat texture.
- Soft radial bloom behind it (Opal), breathing slowly (Endel, ~4s sine), scale 1.0→1.06.
- Tactile, matte, soft-shadowed — a body you could almost cup in your hand ((Not Boring)).
- It doubles as the day's progress indicator (the `BaselineRing` becomes its halo / orbit),
  so the art carries information — never decoration alone.

## Type — brutalist mono counterpoint to the soft field

- **Hero / display:** Inter Bold/SemiBold, large, tight tracking (already in tokens: `hero` 47, `display` 88).
- **Data rows:** uppercase + tabular figures + letter-spacing, on hairline dividers —
  the (Not Boring) `ILLUMINATION ········ 0%` cadence. Softness of the field vs. coldness
  of the numerals is the whole tension.
- (Optional later steal: a true monospace face for numerals — flagged, not yet adopted.)

## How much art — the restraint rule

> "Quelques moments d'art, mais pas abuser." — several, not one, never crowded.

The art moments, ranked:
1. **Today** — the Gabor celestial body + breathing wavefield bloom (the signature).
2. **Tab bar** — floating liquid glass (Bevel).
3. **Progress** — the contrast curve drawn as a celestial trajectory / orbit; one frosted card.
4. **Onboarding** — sequential text reveal + the breathing orb as a smaller cousin of the hero.
5. **Accent constellation points** — fine luminous dots, used *once or twice*, never scattered.

Everything else stays empty, black, and quiet. Emptiness is the luxury.

## The scientific boundary (non-negotiable)

`src/app/session.tsx` stays a clean, neutral dark measurement field. **No bloom, no
gradient, no celestial treatment behind the stimulus** — the Gabor patches are a
contrast-sensitivity *measurement*, and a glowing background would corrupt the very thing
we measure. The art lives everywhere the science does not.

## Motion

- Breathing: ~4s sine in/out, opacity 0.5→0.9, scale 1.0→1.06.
- Entrances: 280ms ease-out, 32ms stagger. Never bounce. Never animate layout props.
- Respect `useReducedMotion` everywhere — freeze to the mid state, never strobe.

## The bar

If anyone can look at a screen and say "an AI made that" without hesitation, it has failed.
The target is the opposite: a stranger opens it, feels the difference in three seconds
without knowing why, and never mistakes it for the thousand white-and-teal vision apps.
