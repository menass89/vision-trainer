# Agent 4 — Implementation Plan

## A. Paradigm-to-Condition Mapping

**Myopia** (high SF deficit, 6-12 cpd):
- **Lateral masking** — PRIMARY. Polat 2004 (Nature Neurosci): collinear flankers at 3lambda reduce contrast thresholds at high SF. RevitalVision's entire myopia program is lateral masking. Non-negotiable backbone.
- **Contrast detection** — SECONDARY. Baseline CSF measurement and warm-up. Every session starts here.
- **Pedestal discrimination** — TERTIARY, sessions 8+. Legge & Foley 1980: pedestal masking at high SF trains fine discrimination channels that lateral masking alone misses.

**Presbyopia** (mid SF at near distance, 3-6 cpd):
- **Lateral masking** — PRIMARY. Polat 2012 (Scientific Reports): 30 sessions improved uncorrected near VA by ~2 lines in presbyopes using lateral masking at 3-6 cpd.
- **Contrast detection** — SECONDARY. Warm-up and CSF tracking.
- **Backward masking** — TERTIARY, sessions 10+. Breitmeyer & Ogmen 2006: temporal processing deficits compound presbyopic blur. Training backward masking at mid-SF improves temporal integration.

**Sports vision** (suprathreshold speed + ultra-fine discrimination):
- **Lateral masking** — PRIMARY, but at suprathreshold contrasts (2-3x threshold) with reduced duration (80ms start, decrease to 40ms). Speed, not threshold.
- **Backward masking** — CO-PRIMARY. SOA staircased from 160ms down to 20ms. Trains temporal processing speed — direct relevance to tracking fast objects.
- **Spatial masking** — SECONDARY, sessions 6+. Crowding resistance training. Pelli 2004: spatial masking trains figure-ground segregation under noise — critical for extracting signals in complex visual scenes.

**DROP from all programs:** Dichoptic contrast (amblyopia-only, no evidence for these 3 conditions).

## B. Difficulty Recalibration

| Parameter | Current | New |
|---|---|---|
| Stimulus duration | 60ms fixed | 160ms initial, adaptive 80-320ms per condition |
| Gabor sigma | 1 lambda (sigmaPixels = pixelsPerCycle) | **3-5 deg visual angle**: `sigma = 2.5 * ppd` for myopia/presbyopia, `1.5 * ppd` for sports |
| QUEST prior | -1 log10 | -0.8 log10 (less aggressive start, RevitalVision starts easier) |
| QUEST pThreshold | 0.82 | **0.79** (1-up/3-down equivalent per RevitalVision patent) |
| SF range myopia | 1.5-12 cpd all | **6, 9, 12 cpd** (add 9 cpd to fill gap) |
| SF range presbyopia | 1.5-12 cpd all | **3, 4.5, 6 cpd** (add 4.5 cpd) |
| SF range sports | 1.5-12 cpd all | **1.5, 3, 6, 12 cpd** (full range, suprathreshold) |
| Flanker contrast | 60% fixed | Start 60%, reduce to 40% after session 15 (increase difficulty) |
| Flanker distance | 3.5 lambda fixed | Start 3 lambda, tighten to 2 lambda over 30 sessions |
| Trials/session | ~100 (warm-up 10 + 3x32 + 16) | **250** (warm-up 20 + 5x40 + assessment 30) |

**Duration adaptation rule:** Start at 160ms. If block threshold improves >10% from previous session at same condition, reduce by 20ms (floor 80ms). If threshold worsens >15%, increase by 20ms (ceiling 320ms).

**Gabor size fix in `displayCalibration.ts`:**
```
// Current: sigmaPixels = pixelsPerCycle (WAY too small)
// New: sigma = visualAngleDeg * pixelsPerDegree
export function sigmaPixels(spatialFrequencyCpd: number, profile: CalibrationProfile, gaborSizeDeg = 3): number {
  return (gaborSizeDeg / 2) * pixelsPerDegree(profile);
}
```

## C. Onboarding + Calibration Flow

**New file: `src/onboarding/goalSelection.ts`**
- 3-button screen: "Sharper distance vision" / "Clearer reading" / "Faster sports vision"
- Maps to `ProgramId: 'myopia' | 'presbyopia' | 'sports'`
- Store in `UserProfile.programId` (add field to type)

**Calibration sessions (2 sessions, ~15 min each):**

Session 1 — CSF profiling:
- Use existing `csfMeasurement.ts` but EXPAND: test at condition-specific SFs (not just 1.5/3/6/12)
- Add 4.5 and 9 cpd
- 6 SFs x 7 contrast levels x 5 reps = 210 trials (already close to current 140)
- Fit Weibull per SF to get full CSF curve
- Identify **worst SF** where threshold > 2x population norm = training start point

Session 2 — Paradigm-specific calibration:
- Run 30 trials each of lateral masking + the program's secondary paradigm at the 2 worst SFs from session 1
- Sets QUEST priors from real data instead of default -1
- Duration starts at 200ms to be comfortable

**Feed into program:** Store `CalibrationResult` in IndexedDB with `startingSfCpd`, `questPriors` per condition, `startDurationMs`. The sessionPlanner reads this to build blocks.

## D. Program Structure

**30 sessions, 3x/week:**

| Phase | Sessions | Focus |
|---|---|---|
| Foundation | 1-2 | Calibration (CSF + paradigm-specific) |
| Ramp | 3-8 | Primary paradigm only (lateral masking), single worst SF, long durations (160-200ms) |
| Expansion | 9-18 | Add secondary paradigm, expand to 2 SFs, duration starts dropping |
| Integration | 19-26 | Add tertiary paradigm, all program SFs, flanker distance tightening |
| Mastery | 27-30 | Full difficulty, recalibration assessment at session 28, comparison to baseline |

**Per-session structure (sessions 3+):**
1. Warm-up: 20 trials contrast detection at easiest trained SF
2. Training blocks: 5 blocks x 40 trials = 200 trials. Paradigm rotation based on phase.
3. Assessment: 30 trials at primary paradigm + worst SF (tracks progress curve)

**Paradigm rotation in training blocks (example: myopia, integration phase):**
- Block 1-2: lateral masking at worst SF
- Block 3: lateral masking at second SF
- Block 4: pedestal discrimination at worst SF
- Block 5: lateral masking at third SF

**Difficulty progression** is driven by 3 levers that advance independently:
1. QUEST threshold (automatic per-trial)
2. Duration (per-session, rule in section B)
3. Flanker distance/contrast (per-phase milestones)

## E. Architecture Changes

**New files (3):**
- `src/onboarding/goalSelection.ts` — ProgramId type + goal-to-config mapping
- `src/onboarding/calibrationSession.ts` — 2-session calibration logic, stores CalibrationResult
- `src/programs/programConfig.ts` — per-program SF ranges, paradigm schedule, phase definitions, duration/flanker progression tables

**Modified files (6 surgical edits):**

1. **`src/types.ts`** — Add `ProgramId` type, add `programId` to `UserProfile`, add `CalibrationResult` type, add `startDurationMs` to `GaborStimulus` (or just use existing `durationMs` dynamically)

2. **`src/core/displayCalibration.ts`** — Fix `sigmaPixels()` to accept `gaborSizeDeg` parameter (default 3). One function signature change.

3. **`src/session/sessionPlanner.ts`** — Replace `paradigmsForSession()` with `paradigmsForPhase(programId, sessionNumber)` that reads from programConfig. Replace hardcoded milestone array with program-aware lookup. Keep `selectDeficitCondition` and `planSession` structure — just change what feeds them.

4. **`src/tasks/contrastDetection.ts`** + **`lateralMasking.ts`** + other paradigm files — Change `durationMs: 60` to `durationMs` parameter passed from session planner. Add condition-specific SF arrays (remove hardcoded 1.5/3/6/12, read from programConfig).

5. **`src/psychophysics/quest.ts`** — Change `DEFAULT_PARAMS.pThreshold` from 0.82 to 0.79. Add constructor option to seed from calibration priors.

6. **`src/store/useAppStore.ts`** — Add `programId` to state, add `setProgram` action, gate `startSession` on calibration completion.

7. **`src/components/SessionFlow.tsx`** — Add onboarding gate: if no programId, show goal selection. If calibration incomplete, route to calibration flow.

**Untouched:** GaborRenderer (WebGL shader is fine), db.ts (just add new object stores), gamification, progress/csf.ts.

## F. macOS .dmg Packaging

**Pick: Tauri v2.** Not Electron.

Rationale:
- Bundle size: ~8MB vs Electron's ~150MB. Vision trainer is a single-purpose app.
- Performance: Tauri uses system WebView (WebKit on macOS). No Chromium overhead. Critical for precise 60Hz stimulus timing — fewer layers between requestAnimationFrame and display.
- Vite integration: Tauri has first-class Vite support (`@tauri-apps/cli`). The existing `vite.config.ts` needs zero changes.
- PWA coexistence: Keep `vite-plugin-pwa` for web distribution. Tauri wraps the same build output — no fork.

**Implementation:**
```bash
npm install -D @tauri-apps/cli@latest
npx tauri init  # generates src-tauri/ with Cargo.toml + tauri.conf.json
```

**tauri.conf.json key settings:**
- `bundle.macOS.dmg` — enables .dmg output
- `window.fullscreen: false`, `window.width: 1280`, `window.height: 800`
- `window.decorations: true` (standard title bar)
- No Rust backend code needed — pure frontend app, all storage is IndexedDB via WebKit

**Build:** `npx tauri build --target universal-apple-darwin` produces a universal .dmg (Intel + Apple Silicon).

**Signing:** For distribution outside App Store, use `codesign` with Developer ID certificate + `notarytool` for notarization. Without Apple Developer account, users get Gatekeeper warning but can still open via right-click > Open.
