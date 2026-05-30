# Agent 2 — Implementation Plan: Condition-Specific Vision Training

## A. Paradigm-to-Condition Mapping

**Myopia** (goal: improve high-SF contrast sensitivity, reduce blur adaptation)
- **Lateral masking** (primary) — Polat 2004, 2009: collinear facilitation at 6+12 cpd drives cortical sharpening. RevitalVision's core mechanism.
- **Contrast detection** (baseline/warm-up) — pure threshold tracking at 6, 12 cpd. Anchors CSF measurement.
- **Spatial masking** — Dosher & Lu 2005: external noise exclusion training improves signal extraction in noisy retinal input. Directly relevant to degraded optics.
- Exclude: backward masking (temporal processing, not spatial acuity), pedestal (increment detection, weak myopia evidence), dichoptic (binocular balance, not the deficit).

**Presbyopia** (goal: improve near-vision contrast at reading SFs)
- **Lateral masking** (primary) — Polat 2012: presbyopes gained 1.6 Snellen lines via collinear facilitation at 3+6 cpd.
- **Contrast detection** — baseline at 3, 6 cpd.
- **Backward masking** — Andersen & Ni 2008: temporal integration training compensates for slower neural processing in aging visual cortex. Presbyopia correlates with temporal processing decline.
- **Pedestal discrimination** — Georgeson & Meese 2006: increment detection on suprathreshold pedestals trains fine contrast discrimination at reading distances.
- Exclude: dichoptic (unless amblyopia comorbidity), spatial masking (less evidence for aging cortex).

**Sports Vision** (goal: suprathreshold speed, ultra-fine discrimination, temporal processing)
- **Backward masking** (primary) — critical for rapid object recognition under time pressure. Train at progressively shorter SOAs.
- **Contrast detection** — suprathreshold, fast presentation (80ms target).
- **Lateral masking** — crowding resistance: flanker distances reduced to 2.5lambda to train extraction from cluttered visual fields.
- **Pedestal discrimination** — fine discrimination at suprathreshold levels. Sports athletes need to detect minute contrast differences, not threshold-level signals.
- Exclude: dichoptic (no deficit to correct), spatial masking (noise exclusion less relevant than speed).

## B. Difficulty Recalibration

**Stimulus duration:** Change from fixed 60ms to condition-dependent range.
- Myopia: 120ms initial -> 80ms floor (acuity needs integration time)
- Presbyopia: 160ms initial -> 80ms floor (aging cortex is slower)
- Sports: 120ms initial -> 60ms floor (speed is the training target)
- Duration decreases by 10ms every 3 sessions if threshold improves >15%

**Spatial frequencies per condition:**
- Myopia: [6, 12] cpd primary, [3] cpd warm-up only
- Presbyopia: [3, 6] cpd primary, [1.5] cpd warm-up only
- Sports: [3, 6, 12] cpd all active from session 1

**Gabor size:** Current `sigmaPixels = pixelsPerCycle` (1 lambda). RevitalVision uses 3-5 deg.
- Change: `sigmaPixels = gaborSigmaDeg * pixelsPerDegree(profile)` where `gaborSigmaDeg = 1.5` (yielding ~3 deg total patch = 4*sigma).
- Add `gaborSigmaDeg` to `ContrastCondition`. Compute in `gaborRenderer.ts` uniform `u_sigmaPx`.

**Staircase:** Keep QUEST (superior to 1-up/3-down for efficiency). Change `pThreshold` from 0.82 to 0.79 to match RevitalVision. Keep beta=3.5, delta=0.03. Seed `tGuess` from calibration profile instead of fixed -1.

**Flankers:** Keep 60% contrast, 3.5lambda for myopia/presbyopia. Sports: reduce to 2.5lambda after session 10.

## C. Onboarding + Calibration Flow

**Step 1: Goal selection** (new component `Onboarding.tsx`)
- 3-card UI: "Sharpen distance vision" / "Improve reading vision" / "Faster visual processing"
- Stores `programType: 'myopia' | 'presbyopia' | 'sports'` in `UserProfile`

**Step 2: Display calibration** (existing `CalibrationPanel.tsx` — keep as-is)

**Step 3: Initial CSF profiling** (2 sessions, repurpose existing `csfMeasurement.ts`)
- Session 1: Contrast detection only, all 4 SFs [1.5, 3, 6, 12 cpd], 25 QUEST trials each = 100 trials total (~12 min)
- Session 2: Lateral masking, same 4 SFs, 25 trials each = 100 trials total
- Output: `CSFProfile` object with per-SF thresholds for both paradigms
- Find "entry SF": highest SF where threshold < 15% contrast (matches RevitalVision logic)
- Store in new `calibrationProfiles` IndexedDB store

**How it feeds into program customization:**
- `sessionPlanner.ts` reads `CSFProfile.entrySF` + `programType`
- QUEST `tGuess` seeded from measured threshold at that SF (not default -1)
- Paradigm selection filtered by condition mapping (section A)
- Duration set per condition defaults (section B)

## D. Program Structure

**30 sessions, 3x/week, ~30 min each (~250 trials/session)**

Block structure per session: warm-up (20 trials) + 3 training blocks (70 trials each) + assessment (20 trials) = 250 trials

**Myopia progression:**
- Sessions 1-2: Calibration (see C)
- Sessions 3-10: Lateral masking at entry SF + one SF below. Contrast detection warm-up/assessment.
- Sessions 11-20: Add spatial masking. Rotate paradigms across training blocks. Duration drops 10ms/3 sessions.
- Sessions 21-30: Focus on weakest SF. Duration at floor. Add second orientation.

**Presbyopia progression:**
- Sessions 1-2: Calibration
- Sessions 3-10: Lateral masking 3+6 cpd. Contrast detection baseline.
- Sessions 11-20: Add backward masking (SOA starts 200ms, drops by 20ms/session). Add pedestal discrimination.
- Sessions 21-30: All 3 paradigms rotate. Duration at floor. Target: 0.5 log-unit improvement.

**Sports progression:**
- Sessions 1-2: Calibration
- Sessions 3-10: Backward masking (SOA 160ms->100ms). Contrast detection at 120ms duration.
- Sessions 11-20: Add lateral masking with tight flankers (2.5lambda). Add pedestal discrimination at suprathreshold.
- Sessions 21-30: All paradigms, duration at 60ms floor, suprathreshold speed emphasis.

**Paradigm rotation within session:** deficit-first (existing `selectDeficitCondition` logic) filtered to condition-appropriate paradigms only.

## E. Architecture Changes

Minimal file changes, maximum impact:

1. **`src/types.ts`** — Add `ProgramType = 'myopia' | 'presbyopia' | 'sports'` to `UserProfile`. Add `CSFProfile` type. Add `durationMs` and `gaborSigmaDeg` to `ContrastCondition`.

2. **`src/session/sessionPlanner.ts`** — Replace `paradigmsForSession()` milestone system with `paradigmsForProgram(programType, sessionNumber)` lookup table. Replace fixed trial counts with 250-trial budget. Seed QUEST from CSF profile.

3. **`src/session/programConfig.ts`** (NEW) — Single config file: `PROGRAM_CONFIGS` record mapping each `ProgramType` to `{ paradigms, sfRange, durationRange, flankerDistance, trialBudget }`. ~80 lines.

4. **`src/tasks/contrastDetection.ts`** + all paradigm files — Change `durationMs: 60` to `durationMs: condition.durationMs ?? 120`. One-line change per file.

5. **`src/core/gaborRenderer.ts`** — Change `sigmaPixels()` call to use `condition.gaborSigmaDeg * pixelsPerDegree(profile)` when `gaborSigmaDeg` is provided. ~3 lines in the render setup.

6. **`src/psychophysics/quest.ts`** — Change `pThreshold` default from 0.82 to 0.79. Accept optional `tGuess` override in constructor.

7. **`src/components/Onboarding.tsx`** (NEW) — 3-card goal selection + CSF profiling flow. ~120 lines. Gated in `App.tsx` before main UI.

8. **`src/assessment/csfMeasurement.ts`** — Add `buildCSFProfile()` that takes calibration session results and computes entry SF + per-SF thresholds.

9. **`src/data/db.ts`** — Add `csfProfiles` store to schema, bump DB version.

10. **`src/store/useAppStore.ts`** — Add `programType` state, `setProgram()` action, gate session start on completed calibration.

**Files unchanged:** `gaborRenderer.ts` WebGL shaders (sigma already a uniform), `displayCalibration.ts`, all component files except `App.tsx` (routing gate).

## F. macOS .dmg Packaging

**Pick: Tauri v2.** Not Electron.

**Why Tauri over Electron:**
- Bundle size: ~5MB vs ~150MB. For a vision training app, bloat is embarrassing.
- Performance: native WebView (WebKit on macOS) vs Chromium. Lower memory, faster GPU access for WebGL Gabor rendering.
- The app is a pure frontend SPA with IndexedDB. No Node.js APIs needed. Tauri's Rust backend is overkill but costs nothing.
- Vite integration is first-class (`@tauri-apps/cli` works with existing `vite.config.ts`).

**Implementation:**
```
cargo install tauri-cli
cd ~/Projects/vision-trainer
npm install @tauri-apps/cli @tauri-apps/api
npx tauri init   # creates src-tauri/ with Cargo.toml + tauri.conf.json
npx tauri build  # produces .dmg
```

**Config (`src-tauri/tauri.conf.json`):**
- `window.width: 1200, height: 800, minWidth: 1024, minHeight: 768`
- `window.title: "Vision Trainer"`
- `bundle.identifier: "com.visiontrainer.app"`
- `bundle.macOS.dmg: true`
- Keep PWA manifest for web fallback. Tauri wraps the same Vite build.

**What stays:** Service worker, IndexedDB, all existing web code. The .dmg is just a native shell around the same SPA.

**Signing:** For distribution, need Apple Developer ID ($99/yr). For personal use, `--target universal-apple-darwin` unsigned works fine with Gatekeeper bypass.
