# Vision Trainer — App Store Connect metadata

> Single source of truth for every text field in App Store Connect.
> **Language discipline:** this is a visual *training practice*, not a medical product.
> Never use **heal / cure / treat / therapy / diagnose / clinical / medical / FDA**.
> Allowed verbs: *train, practice, exercise, sharpen, challenge, track, measure (your own performance)*.

---

## Identity

| Field | Value | Limit |
|---|---|---|
| App name | `Vision Trainer` | 30 |
| Subtitle | `Daily contrast eye training` | 30 |
| Bundle ID | `co.menass.visiontrainer` | — |
| Primary category | Health & Fitness | — |
| Secondary category | Education | — |
| Age rating | 4+ | — |
| Price | Free | — |

> Category note: **Health & Fitness**, *not* Medical. "Medical" invites device-grade review and the
> Guideline 1.4.1 medical-claims bar. Framing as a training practice in Health & Fitness is both honest
> and lower-friction.

---

## Promotional text (≤170 chars — editable anytime, no review)

```
A quiet daily practice for sharper contrast vision. Adaptive Gabor exercises, your progress tracked on-device. No account. No data leaves your phone.
```

## Keywords (≤100 chars, comma-separated, no spaces)

```
vision,contrast,eye training,perceptual,gabor,acuity,eyesight,focus,sharpness,dichoptic
```

> Keywords name what the practice *is* (training, contrast, perceptual), never a clinical condition.
> Naming a condition in keywords pairs with the Health category to invite Guideline 1.4.1 scrutiny.

---

## Description (≤4000 chars)

```
Vision Trainer is a calm, daily practice for sharpening how you see contrast.

It is built on perceptual learning, the well-studied idea that the visual brain keeps
adapting when you challenge it with the right exercise, just slightly beyond what feels easy.
Each session shows you faint striped patterns (Gabor patches) and asks a simple question:
which flash held the pattern? An adaptive engine tunes the difficulty to your exact level,
trial after trial, so every session meets you where you are.

WHAT YOU GET
• Adaptive sessions that find your threshold automatically. Never too easy, never impossible.
• A clear picture of your contrast sensitivity over time, drawn as your own personal curve.
• A dichoptic mode with red/cyan separation, for those who like to train each eye differently.
• A quiet, focused interface designed to keep your eyes on the task and nothing else.

PRIVATE BY DESIGN
Everything stays on your device. No account to create, no sign-in, no cloud, no analytics,
no tracking. Your training history is yours alone. It never leaves your phone.

A FEW MINUTES A DAY
Short sessions, a gentle daily rhythm, and a streak to keep you coming back. Consistency is
the whole game with perceptual training, so the app is designed to be opened often and briefly.

A NOTE ON WHAT THIS IS
Vision Trainer is a training and practice tool for visual perception. It is not a medical
device. It does not diagnose, treat, or provide care for any condition, and it is not a
substitute for professional eye care. If you have any concern about your vision, please see
an eye-care professional.

Sharpen the way you see. A little, every day.
```

> Char count target: keep under 4000. The "A NOTE ON WHAT THIS IS" disclaimer is **mandatory** given
> the perceptual-vision subject and protects against Guideline 1.4.1 rejection.

---

## What's New (version 1.0.0)

```
First release. A calm daily practice for contrast vision. Adaptive Gabor sessions, your
progress tracked privately on-device, and a focused interface built to stay out of your way.
```

---

## URLs (must be live before submission — see /docs site)

| Field | URL |
|---|---|
| Privacy Policy URL | `https://menass-co.github.io/vision-trainer/privacy.html` |
| Support URL | `https://menass-co.github.io/vision-trainer/support.html` |
| Marketing URL (optional) | `https://menass-co.github.io/vision-trainer/` |

> Published via GitHub Pages from the `gh-pages` branch (root) of `MeNass-Co/vision-trainer`.
> Confirm the three URLs resolve before submission.

---

## App Privacy "nutrition label" (App Store Connect → App Privacy)

**Answer: Data Not Collected.**

- No data is collected, because nothing leaves the device. All training history, settings, and
  thresholds live in on-device storage (SQLite) only.
- No third-party SDKs, no analytics, no ad networks, no crash reporters that transmit data.
- This is a genuine selling point — the "Data Not Collected" badge is rare and trust-building.

> If a crash/analytics SDK is ever added, this section must be revised — today it is accurate.

---

## App Review notes (the private note to the Apple reviewer)

```
Vision Trainer is a visual perceptual-training practice (Gabor-patch contrast exercises with an
adaptive staircase). It is NOT a medical device: it makes no diagnostic or treatment claims, and
the description states this explicitly.

The app is fully local — no account, no login, no backend, no network calls. Reviewers can use it
immediately with no credentials: open the app, tap Begin, complete the short onboarding, and start
a session. All features are available offline on first launch.

The optional "daily reminder" uses local notifications only; the in-app explanation precedes the
system permission prompt.
```

---

## Export compliance

- Uses only standard OS-provided encryption (HTTPS at most, and the app makes no network calls).
- Answer the encryption question as **exempt** (no non-exempt encryption).

---

## Pre-submission claims-safety checklist

- [ ] No "heal / cure / treat / therapy / diagnose / clinical / medical / FDA" anywhere in copy or screenshots.
- [ ] No clinical condition is named or implied as a target ("amblyopia / lazy eye / strabismus") in copy, keywords, or screenshots. Describe the mechanism (dichoptic, red/cyan), never the condition.
- [ ] Description includes the "not a medical device" disclaimer.
- [ ] Screenshots use **seeded demo data** (a populated CSF curve + trend), never the empty `0.00` state.
- [ ] No screenshot shows a claim ("improve your eyesight in X days", etc.).
- [ ] Privacy + Support URLs resolve and render.
- [ ] App Privacy set to "Data Not Collected".
