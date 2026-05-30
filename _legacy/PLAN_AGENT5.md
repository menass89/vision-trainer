# Agent 5 — Implementation Plan: Condition-Based Vision Training

## A. Paradigm-to-Condition Mapping

**Myopia** (high SF deficit, blur compensation):
- **Lateral masking** (PRIMARY) — Polat 2009/2012 demonstrated 2-line VA improvement in myopes using collinear flanker facilitation at 6-12 cpd. The core RevitalVision paradigm.
- **Contrast detection** (SECONDARY) — baseline CSF improvement at high SF. Proven transfer from near-distance training to far (Polat 2014).
- **Backward masking** — Polat 2014 showed temporal processing speed gains (204ms -> 123ms for 6/6 VA) transfer to untrained functions. Include from session 8+.
- DROP: spatial masking, pedestal, dichoptic. No myopia-specific evidence.

**Presbyopia** (mid-SF at near distance, temporal processing):
- **Lateral masking** (PRIMARY) — Polat 2012 presbyopia study: 3-6 cpd near-distance training improved near VA by 1.6 lines without optical change.
- **Contrast detection** (SECONDARY) — 3-6 cpd range, establishes CSF baseline.
- **Backward masking** — temporal crowding reduction is the key presbyopia mechanism (Polat 2014 Fig 3). Include from session 5+.
- DROP: spatial masking, pedestal, dichoptic.

**Sports vision** (suprathreshold speed + ultra-fine discrimination):
- **Contrast detection** (PRIMARY) — broad SF range 1.5-12 cpd, suprathreshold speed training via progressive duration reduction.
- **Backward masking** (PRIMARY) — temporal processing speed is the core sports vision target. Start session 1.
- **Pedestal discrimination** — fine-grained contrast increment detection. Relevant for ball tracking / edge detection. Include from session 3+.
- DROP: lateral masking (not speed-relevant), spatial masking (no sports evidence), dichoptic (no evidence outside amblyopia).

## B. Difficulty Recalibration

| Parameter | Current | New |
|---|---|---|
| Stimulus duration | 60ms fixed | 80-320ms adaptive. Start 200ms, reduce by 20ms every 3 sessions toward 80ms floor |
| Gabor sigma | `sigmaPixels = pixelsPerCycle` (1 lambda) | `sigmaPixels = 2.5 * pixelsPerCycle` (2.5 lambda = ~3-5 deg VA at typical SF) |
| QUEST target | 82% correct | 79% correct (matches RevitalVision 1-up/3-down convergence) |
| QUEST prior | tGuess=-1 (10% contrast) | Seed from calibration: tGuess = measured threshold per SF |
| SF ranges | All conditions: 1.5, 3, 6, 12 cpd | Myopia: 6, 9, 12 cpd. Presbyopia: 3, 4.5, 6 cpd. Sports: 1.5, 3, 6, 12 cpd |
| Flanker distance | 3.5 lambda fixed | Start 4 lambda, decrease to 2 lambda over sessions (facilitation zone narrows with learning) |
| Flanker contrast | 60% fixed | Keep 60% — matches literature |
| Trials per block | 40 | 50 (reach 250-350 total across 5-7 blocks per session) |
| Session duration target | ~30 min | 30 min (unchanged, but enforce via block count not timer) |

**Key file changes:**
- `src/core/displayCalibration.ts`: change `sigmaPixels()` to return `2.5 * pixelsPerCycle(sf, profile)`
- `src/psychophysics/quest.ts`: change `DEFAULT_PARAMS.pThreshold` to 0.79
- `src/tasks/contrastDetection.ts`: add `durationMs` to `ContrastCondition`, make `trialsPerBlock: 50`
- New file: `src/programs/programConfig.ts` — SF ranges, duration schedule, paradigm lists per condition

## C. Onboarding + Calibration Flow

**Onboarding (new screen, ~30 seconds):**
1. Goal selection: 3 cards — "Sharper distance vision" (myopia) / "Better reading vision" (presbyopia) / "Faster visual reactions" (sports)
2. Store as `userGoal: 'myopia' | 'presbyopia' | 'sports'` in app store and IndexedDB

**Calibration sessions (2 sessions, ~15 min each):**
- Session 1: contrast detection only across program-specific SF range. 7 contrast levels x 4 SFs x 5 reps = 140 trials. Already implemented in `csfMeasurement.ts` — filter to relevant SFs.
- Session 2: repeat session 1 for test-retest reliability. Average the two profiles.
- Output: `CSFProfile` — threshold contrast per SF. Identifies starting SF (highest impaired SF where threshold < 15% contrast).
- Feed into QUEST: seed `tGuess` per condition from measured threshold instead of generic -1.

**Architecture:** New `src/onboarding/` directory with `GoalSelection.tsx` and `CalibrationSession.tsx`. Modify `App.tsx` routing: if no `userGoal` set, show onboarding; if < 2 calibration sessions, show calibration; else show training.

## D. Program Structure (30 sessions)

**Phase 1 — Foundation (sessions 1-10):**
- Primary paradigm only (lateral masking for myopia/presbyopia, contrast detection + backward masking for sports)
- Start at calibration-identified SF, duration 200ms
- 5 blocks x 50 trials = 250 trials/session
- Reduce duration by 20ms at session 4, 7, 10

**Phase 2 — Expansion (sessions 11-20):**
- Add secondary paradigm (alternate blocks: 3 primary + 2 secondary)
- Duration reaches 120ms by session 15
- SF range expands: add adjacent SF once current SF threshold improves >30%
- 6 blocks x 50 trials = 300 trials/session

**Phase 3 — Consolidation (sessions 21-30):**
- Add tertiary paradigm where specified (backward masking for myopia/presbyopia, pedestal for sports)
- Duration reaches 80ms floor
- Full SF range active
- 7 blocks x 50 trials = 350 trials/session
- Sessions 25 and 30: include CSF re-assessment block to measure transfer

**Paradigm rotation within session:** deficit-first ordering (already implemented in `selectDeficitCondition`) applied per-paradigm. Warm-up block always uses primary paradigm at easiest SF.

## E. Architecture Changes

**New files (3):**
- `src/programs/programConfig.ts` — condition-specific parameter tables (SF ranges, paradigm lists, duration schedules, phase boundaries)
- `src/onboarding/GoalSelection.tsx` — goal picker component
- `src/onboarding/CalibrationSession.tsx` — wraps existing `csfMeasurement.ts` with SF filtering and 2-session logic

**Modified files (7, surgical):**
- `src/types.ts` — add `UserGoal` type, add `durationMs` to `ContrastCondition`, add `userGoal` + `calibrationProfile` to stored types
- `src/store/useAppStore.ts` — add `userGoal`, `calibrationProfile`, `setUserGoal()`, `completeCalibration()` state/actions
- `src/core/displayCalibration.ts` — change `sigmaPixels()` multiplier from 1 to 2.5
- `src/psychophysics/quest.ts` — change `pThreshold` default to 0.79; accept optional `tGuess` override from calibration
- `src/session/sessionPlanner.ts` — `planSession()` accepts `UserGoal` + `calibrationProfile`, filters paradigms/SFs per `programConfig`, computes block count from phase, implements duration schedule
- `src/tasks/contrastDetection.ts` — `ContrastCondition` gets `durationMs` field; `trialsPerBlock` default to 50; add condition factories per goal
- `src/App.tsx` — routing logic: onboarding -> calibration -> training
- `src/components/SessionFlow.tsx` — pass `userGoal` to planner, show phase indicator

**Untouched:** All 6 paradigm task files (except contrastDetection condition type), GaborRenderer WebGL shaders, IndexedDB schema, gamification system, audio utilities.

## F. macOS .dmg Packaging

**Decision: Tauri v2.** Not Electron.

**Rationale:**
- Binary size: Tauri ~8MB vs Electron ~150MB. Vision trainer is a single-purpose app, no need for bundled Chromium.
- Performance: Tauri uses system WebView (WebKit on macOS). WebGL2 Gabor rendering already works in Safari/WebKit. Zero porting risk.
- The existing Vite + React PWA becomes the Tauri frontend with zero changes — Tauri wraps the `vite build` output directly.
- Tauri v2 has stable macOS `.dmg` bundling via `tauri-bundler` with code signing support.

**Implementation:**
1. `cargo install create-tauri-app` then `npx @tauri-apps/cli init` in project root
2. Configure `tauri.conf.json`: `build.devUrl = "http://localhost:5173"`, `build.frontendDist = "../dist"`, bundle identifier `com.visiontrainer.app`
3. `src-tauri/` directory auto-created with Rust backend (minimal — no native APIs needed)
4. `npm run tauri build` produces `.dmg` in `src-tauri/target/release/bundle/dmg/`
5. Keep PWA plugin for web fallback — Tauri and VitePWA coexist without conflict
6. Add to `package.json` scripts: `"tauri:dev": "npx tauri dev"`, `"tauri:build": "npx tauri build"`

**Dependencies to add:** `@tauri-apps/cli` (devDep), `@tauri-apps/api` (dep). Rust toolchain required on build machine (`rustup`).

**Code signing:** Use `tauri.conf.json` > `bundle.macOS.signingIdentity` with Apple Developer ID for Gatekeeper. Without signing, users must right-click > Open on first launch — acceptable for personal/open-source use.
