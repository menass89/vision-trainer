# Agent 1 — Implementation Plan: Condition-Specific Vision Trainer

## A. Paradigm-to-Condition Mapping

**Myopia** (high SF deficit, 6-12 cpd):
- **Lateral masking** (PRIMARY) — Polat et al. 2004 (PNAS): collinear flankers at 3lambda boost contrast sensitivity at high SF by 2x in myopes. FDA-cleared mechanism.
- **Contrast detection** (SECONDARY) — baseline CSF training at 6+12 cpd. Mandatory for threshold tracking.
- **Pedestal discrimination** — Adini et al. 2004: pedestal paradigm trains V1 gain control at high SF. Include from session 6.
- Skip: spatial masking (no myopia-specific evidence), backward masking (temporal processing, not spatial acuity), dichoptic (amblyopia-specific).

**Presbyopia** (mid SF at near distance, 3-6 cpd):
- **Lateral masking** (PRIMARY) — Polat 2009 (PNAS): presbyopia-specific study, 30 sessions improved near uncorrected acuity by ~2 lines. Core paradigm.
- **Contrast detection** (SECONDARY) — at 3+6 cpd.
- **Backward masking** — Lev & Polat 2015: temporal integration deficits worsen with age; backward masking trains temporal precision relevant to reading. Include from session 8.
- Skip: dichoptic, spatial masking, pedestal (no presbyopia evidence).

**Sports Vision** (suprathreshold speed + ultra-fine discrimination):
- **Contrast detection** (PRIMARY) — full SF range 1.5-12 cpd at reduced durations (80ms start, dropping toward threshold).
- **Backward masking** (PRIMARY) — trains temporal processing speed. Critical for fast-moving targets.
- **Spatial masking** — crowding resistance in cluttered visual scenes (Levi 2008). Include from session 4.
- **Pedestal discrimination** — fine discrimination at suprathreshold contrast. Include from session 8.
- Skip: dichoptic (no sports evidence), lateral masking (not speed-relevant).

## B. Difficulty Recalibration

**Stimulus duration**: Change from fixed 60ms to adaptive range:
- Myopia: 160ms start -> 80ms floor (high SF needs longer exposure)
- Presbyopia: 200ms start -> 100ms floor (age-related temporal deficit)
- Sports: 120ms start -> 40ms floor (speed is the training goal)
- `durationMs` in `GaborStimulus` becomes computed per-trial, not hardcoded

**Spatial frequency ranges per condition**:
- Myopia: [6, 12] cpd primary, [3] cpd warm-up only
- Presbyopia: [3, 6] cpd primary, [1.5] cpd warm-up only
- Sports: [1.5, 3, 6, 12] cpd all active

**Gabor size**: Current `sigmaPixels = pixelsPerCycle` yields sigma ~1 wavelength. RevitalVision uses 3-5 deg visual angle. Fix:
- Change `sigmaPixels()` to return `gaborSizeDeg * pixelsPerDegree / (2 * 2.35)` where `gaborSizeDeg = 4.0` (FWHM ~4 deg).
- This is ~4x larger than current implementation at 6 cpd.

**Staircase**: Keep QUEST (superior to 1-up/3-down for efficiency). Change:
- `pThreshold`: 0.82 -> 0.79 (matches RevitalVision)
- `tGuessSd`: 0.6 -> 0.8 (wider prior for calibration sessions)
- Add duration staircase for sports vision (second QUEST on `durationMs`)

## C. Onboarding + Calibration Flow

**Onboarding screen** (new component `Onboarding.tsx`):
1. Goal selection: myopia / presbyopia / sports vision (3 cards)
2. Stored in `UserProfile.diagnosisType` (rename values: `'myopia' | 'presbyopia' | 'sports-vision'`)
3. Display calibration (existing `CalibrationPanel` — keep as-is)

**Calibration sessions** (2 sessions, ~15 min each):
- Session 1: contrast detection across ALL 4 SFs, 30 trials each = 120 trials. Measures full CSF curve. Uses existing `csfMeasurement.ts` with method-of-constant-stimuli.
- Session 2: lateral masking at condition-relevant SFs, 30 trials each. Measures facilitation curve.
- Output: `CalibrationResult` stored in IndexedDB with per-SF thresholds.
- **Starting SF selection**: pick highest SF where threshold < 15% contrast (RevitalVision method). If none qualify, start at lowest SF in condition range.
- Feed into `sessionPlanner`: replace `paradigmsForSession()` milestone system with condition-aware planner that reads calibration result.

**Trial count**: calibration = 120 trials/session. Training = 250 trials/session (closer to RevitalVision's 210-350).

## D. Program Structure

**30 sessions, 3x/week, ~30 min each**:

### Myopia (sessions 1-30):
- S1-2: Calibration (contrast detection + lateral masking across all SFs)
- S3-8: Lateral masking at starting SF (the weakest high-SF). 6 blocks x 40 trials = 240 trials.
- S9-14: Add pedestal discrimination. Alternate blocks: 4 lateral + 2 pedestal.
- S15-22: Progress to next SF once threshold improves >25%. Mix paradigms.
- S23-28: Fine-tuning at highest achievable SF.
- S29-30: Post-assessment (same as calibration — measure improvement).

### Presbyopia (sessions 1-30):
- S1-2: Calibration
- S3-10: Lateral masking at 3+6 cpd. Pure facilitation training.
- S11-18: Add backward masking. Alternate: 4 lateral + 2 backward.
- S19-28: Mix at progressed difficulty (shorter durations, higher SF if threshold allows).
- S29-30: Post-assessment.

### Sports Vision (sessions 1-30):
- S1-2: Calibration
- S3-6: Contrast detection + backward masking at all SFs. Focus on speed.
- S7-14: Add spatial masking (crowding). Duration staircase active — push toward floor.
- S15-22: Add pedestal discrimination. All 4 paradigms rotating.
- S23-28: All paradigms at maximum difficulty. Shortest durations.
- S29-30: Post-assessment.

**Block structure per session**: warm-up (10 trials, easy contrast detection) + 5 training blocks x 48 trials + cool-down assessment (10 trials) = 260 total.

**Progression rule**: advance SF when 3 consecutive sessions show threshold improvement >25% from calibration baseline at current SF. Duration decreases 10ms every 2 sessions until floor.

## E. Architecture Changes

### New files (3):
1. **`src/programs/conditionProgram.ts`** — defines `ConditionProgram` type with paradigm schedule, SF ranges, duration ranges per condition. Pure config, ~80 lines.
2. **`src/components/Onboarding.tsx`** — goal selection UI. 3 cards, stores to `UserProfile.diagnosisType`. ~60 lines.
3. **`src/session/calibrationPlanner.ts`** — plans calibration sessions (which SFs/paradigms to measure, trial counts). ~50 lines.

### Modified files (6):
1. **`src/types.ts`** — add `'myopia' | 'sports-vision'` to `diagnosisType` union. Add `ConditionGoal` type. Add `calibrationComplete: boolean` to `UserProfile`.
2. **`src/session/sessionPlanner.ts`** — replace `paradigmsForSession()` milestone array with lookup into `conditionProgram`. `planSession()` takes `conditionGoal` param, selects paradigms + SFs from program config instead of hardcoded milestones.
3. **`src/tasks/contrastDetection.ts`** — remove hardcoded `durationMs: 60`. Accept duration from condition program config. ~3 line change.
4. **`src/tasks/lateralMasking.ts`** — same duration change. ~3 lines.
5. **`src/core/displayCalibration.ts`** — fix `sigmaPixels()` to compute from `gaborSizeDeg` constant (4.0) instead of equaling `pixelsPerCycle`. ~5 line change.
6. **`src/components/SessionFlow.tsx`** — add onboarding gate: if `!profile.calibrationComplete`, show `Onboarding` then calibration flow before training. ~20 lines.
7. **`src/store/useAppStore.ts`** — add `conditionGoal` to state, persist to IndexedDB.

### Untouched: `quest.ts` (only `pThreshold` default changes), `gaborRenderer.ts` (shader is correct — sigma change flows through `displayCalibration`), `paradigmRegistry.ts` (no structural change, just consumed differently by planner), all masking/pedestal/dichoptic task files (duration parameterized through existing `durationMs` field).

## F. macOS .dmg Packaging

**Pick: Tauri v2.** Not Electron.

**Why Tauri over Electron:**
- Bundle size: ~8MB vs ~150MB+ (Electron ships Chromium)
- Uses system WebView (WebKit on macOS) — the app already runs in Safari-compatible WebView
- WebGL2 works in macOS WebKit since Safari 15
- Rust backend = no Node.js runtime needed
- `@tauri-apps/cli` generates .dmg natively via `tauri build`
- PWA coexistence: keep `vite-plugin-pwa` for web deployment, Tauri wraps the same Vite output

**Implementation:**
1. `npm install -D @tauri-apps/cli @tauri-apps/api`
2. `npx tauri init` — creates `src-tauri/` with `tauri.conf.json`
3. Set `build.distDir` to `../dist`, `build.devUrl` to `http://localhost:5173`
4. `tauri.conf.json` bundle config: `{ "macOS": { "dmg": { "appName": "Vision Trainer" } } }`
5. `npx tauri build` produces `.dmg` in `src-tauri/target/release/bundle/dmg/`
6. Code signing: use `APPLE_SIGNING_IDENTITY` env var for notarization (optional, can distribute unsigned for personal use)

**PWA preservation:** Keep the existing PWA config. Tauri and PWA share the same `dist/` output. The service worker auto-disables inside Tauri's WebView (no `navigator.serviceWorker` in WKWebView by default).

**Risk:** WebKit color accuracy for vision research is less validated than Chromium. Mitigation: the existing gamma correction in `displayCalibration.ts` handles this. For clinical-grade work, add a luminance calibration step with a hardware colorimeter — out of scope for v1.
