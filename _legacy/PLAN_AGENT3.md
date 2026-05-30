# Agent 3 -- Implementation Plan: Vision Trainer Condition-Specific Programs

## A. Paradigm-to-Condition Mapping

### Myopia (high-SF deficit, 6-12 cpd)
- **Lateral masking** (primary): Polat 2009 PNAS -- 30 sessions of lateral masking at high SF improved VA by 1.5 lines in myopes. Flanker facilitation directly trains neural pooling at impaired frequencies.
- **Contrast detection** (secondary): Baseline CSF measurement + threshold tracking at 6/12 cpd. The "backbone" paradigm -- every session starts here.
- **Backward masking** (tertiary, sessions 10+): Polat 2014 showed backward masking training improved temporal processing speed at short ISIs (60-90ms), which generalizes to letter recognition speed. Add once contrast thresholds plateau.

Excluded: pedestal discrimination (no myopia-specific evidence), dichoptic (relevant only to amblyopia/binocular disorders), spatial masking (redundant with lateral masking for this population).

### Presbyopia (mid-SF deficit, 3-6 cpd at near distance)
- **Lateral masking** (primary): Polat 2012 Scientific Reports -- presbyopes trained on near-distance lateral masking at 3-6 cpd improved reading speed and near VA. Core paradigm.
- **Contrast detection** (secondary): CSF profiling at 3/6 cpd.
- **Spatial masking** (tertiary, sessions 8+): Surround suppression training improves figure-ground segregation for reading. Lev & Polat 2015 showed spatial masking effects transfer to text processing.

Excluded: backward masking (less relevant -- presbyopia is spatial not temporal), pedestal (insufficient evidence for near-vision), dichoptic (not indicated).

### Sports Vision (suprathreshold speed + ultra-fine discrimination)
- **Backward masking** (primary): Train temporal processing speed. Reduce masking at progressively shorter ISIs (240ms down to 40ms). Directly improves motion tracking and rapid target identification.
- **Contrast detection** (secondary): Suprathreshold discrimination at ALL frequencies (1.5-12 cpd). Train at near-threshold then push to speed.
- **Pedestal discrimination** (tertiary, sessions 5+): Increment detection on a visible pedestal trains fine contrast discrimination -- relevant to detecting targets against complex backgrounds (ball against sky, puck against ice).

Excluded: lateral masking (less relevant to dynamic vision), dichoptic (no sports-specific evidence), spatial masking (less evidence for speed improvement).

## B. Difficulty Recalibration

### Stimulus Duration
- Current: 60ms FIXED everywhere
- New: **condition-dependent adaptive range**
  - Myopia: 120ms start, range 80-200ms (spatial task, not speed-limited)
  - Presbyopia: 160ms start, range 100-320ms (older population, slower processing)
  - Sports: 80ms start, range 40-120ms (speed is the training goal)
- Implementation: Add `durationMs` field to each condition config, remove hardcoded `60` from all `create*Trial()` functions in `src/tasks/*.ts`

### Spatial Frequency Ranges
- Current: All paradigms use [1.5, 3, 6, 12] cpd uniformly
- New per-condition:
  - Myopia: [6, 8, 10, 12] cpd (high SF where deficit lives)
  - Presbyopia: [2, 3, 4, 6] cpd (reading-relevant mid SF)
  - Sports: [1.5, 3, 6, 12] cpd (full range for broad enhancement)
- Calibration session identifies the **highest impaired SF** (threshold > 15% contrast) per Polat's protocol; training starts there.

### Gabor Size
- Current: Not explicitly parameterized -- likely using a fixed pixel size
- New: **3-5 degrees visual angle**, computed from calibration:
  - `sizePx = sizeDeg * pixelsPerDegree` where `pixelsPerDegree = (dpi / 2.54) * viewingDistanceCm * tan(PI/180)`
  - `sigma = sizePx / 6` (standard: Gabor sigma = 1/6 of patch diameter)
  - RevitalVision uses 4 deg default. Use 4 deg for myopia/presbyopia, 3 deg for sports.
- File: modify `src/core/gaborRenderer.ts` -- the `drawGaborPatch()` function needs a `sizeDeg` parameter piped from condition config.

### Staircase
- Current: QUEST with pThreshold=0.82, beta=3.5
- Change to: **pThreshold=0.79** (matches RevitalVision's 79% convergence point, 1-up/3-down equivalent)
- Keep QUEST (superior to transformed staircase for efficiency with limited trials). Just change `pThreshold` in `DEFAULT_PARAMS`.
- Add per-condition prior: calibration session sets `tGuess` from measured threshold instead of fixed -1.

## C. Onboarding + Calibration Flow

### Step 1: Goal Selection (new component `src/components/GoalSelection.tsx`)
- Single screen: "What do you want to improve?" -- 3 cards: Myopia / Presbyopia / Sports Vision
- Stores `goalType: 'myopia' | 'presbyopia' | 'sports'` on `UserProfile` (extend the existing `diagnosisType` field)

### Step 2: Calibration Sessions (2 sessions, ~15 min each)
- **Session 1**: Contrast detection at all 8 SFs (condition-specific range + 2 boundary SFs). 20 trials per SF = 160 trials. Measures raw CSF curve.
- **Session 2**: Lateral masking at the 4 target SFs with flankers. 20 trials per SF = 80 trials. Measures facilitation/suppression profile.
- Implementation: Extend `src/assessment/csfMeasurement.ts` -- already has `createAssessmentTrials()` with 5 contrasts x 4 SFs. Expand to condition-specific SF set, increase to 20 trials/SF using QUEST (not method of constant stimuli).
- Output: Per-SF threshold map stored in IndexedDB. Feed into `sessionPlanner` to set starting SF and `tGuess` for training staircases.

### Step 3: Profile Generation
- Identify weakest SF (highest threshold) within the condition range
- Set training starting point at that SF
- If all thresholds < 5% contrast (near-normal CSF): flag as "mild deficit" and use full SF range with shorter duration targets for speed training

## D. Program Structure (30 sessions, 3x/week)

### Universal Session Structure
- Warm-up: 10 trials contrast detection at easiest trained SF (fixed)
- Training blocks: 3 blocks x 60 trials = 180 trials (core work)
- Cool-down assessment: 20 trials at primary training SF (track progress)
- Total: ~210 trials, ~25-30 min

### Paradigm Rotation by Phase

**Myopia:**
- Sessions 1-2: Calibration (as above)
- Sessions 3-10: 100% lateral masking at [6, 8, 10, 12] cpd. Deficit-first (weakest SF gets 2 of 3 blocks).
- Sessions 11-20: 70% lateral masking + 30% backward masking. BM unlocks when LM threshold improves >0.2 log units from baseline.
- Sessions 21-30: 50% lateral masking + 30% backward masking + 20% contrast detection (consolidation). Duration drops toward floor (80ms).

**Presbyopia:**
- Sessions 1-2: Calibration
- Sessions 3-9: 100% lateral masking at [2, 3, 4, 6] cpd. Duration starts at 160ms.
- Sessions 10-20: 70% lateral masking + 30% spatial masking. SM trains surround suppression for reading.
- Sessions 21-30: 50% lateral masking + 30% spatial masking + 20% contrast detection. Duration at 100ms.

**Sports:**
- Sessions 1-2: Calibration
- Sessions 3-7: 60% backward masking + 40% contrast detection. Full SF range. Focus on temporal speed.
- Sessions 8-20: 50% backward masking + 30% pedestal discrimination + 20% contrast detection. Duration floor at 40ms.
- Sessions 21-30: Equal split BM/PD/CD. Ultra-short durations, near-threshold discrimination.

### Progression Logic
- Within each session: deficit-first ordering (weakest SF gets priority blocks) -- already implemented in `selectDeficitCondition()`
- Across sessions: paradigm % allocation shifts per phase table above
- Duration adaptation: reduce by 10ms per session once threshold stabilizes (CI width < 0.15 log units for 2 consecutive sessions)

## E. Architecture Changes

### New Files (3)
1. **`src/programs/programConfig.ts`** -- Condition configs: SF ranges, duration ranges, paradigm phase tables, Gabor sizes per goal type. Pure data, ~80 lines.
2. **`src/components/GoalSelection.tsx`** -- Onboarding goal picker. Simple 3-card UI. ~60 lines.
3. **`src/programs/programPlanner.ts`** -- Maps (goalType, sessionNumber, thresholds) to paradigm allocation percentages and duration. Replaces ad-hoc logic in sessionPlanner. ~100 lines.

### Modified Files (7)
1. **`src/types.ts`** -- Add `GoalType = 'myopia' | 'presbyopia' | 'sports'` to `UserProfile`. Add `goalType` field. Add `sizeDeg` to `GaborStimulus`. (~5 line change)
2. **`src/session/sessionPlanner.ts`** -- Import `programPlanner`, use it in `planSession()` to select paradigms based on goal + session number instead of hardcoded contrast-detection. Route to condition-specific SF arrays. (~30 line change)
3. **`src/psychophysics/quest.ts`** -- Change `pThreshold` default from 0.82 to 0.79. Allow `tGuess` override from calibration data. (~3 line change)
4. **`src/tasks/contrastDetection.ts`** (and lateralMasking, spatialMasking, backwardMasking, pedestalDiscrimination) -- Replace hardcoded `durationMs: 60` with `condition.durationMs ?? 120`. Accept `sizeDeg` in condition. (~2 lines each, 5 files)
5. **`src/core/gaborRenderer.ts`** -- Add `sizeDeg` parameter to `drawGaborPatch()`, compute `sizePx` from calibration's `pixelsPerDegree`. Default 4 deg. (~10 line change)
6. **`src/assessment/csfMeasurement.ts`** -- Accept SF array from programConfig instead of hardcoded. Use QUEST instead of constant stimuli for efficiency. (~20 line change)
7. **`src/store/useAppStore.ts`** -- Add `goalType` to state, persist it, gate session start on calibration completion. (~15 line change)
8. **`src/App.tsx`** -- Show GoalSelection when no goalType set. Gate main UI behind calibration completion. (~10 line change)

### Untouched
- `src/data/db.ts` -- IndexedDB schema handles new fields via flexible key-value stores
- `src/components/GaborCanvas.tsx`, `ContrastTask.tsx` -- Rendering pipeline unchanged, just receives different params
- `src/progress/csf.ts` -- CSF curve fitting works with any SF set
- Gamification system -- unchanged

## F. macOS .dmg Packaging

### Decision: **Tauri v2**

### Why Tauri over Electron
- Binary size: ~8MB vs ~150MB (Electron bundles Chromium)
- RAM: ~30MB vs ~200MB (uses system WebView)
- macOS WebView2 (WKWebView) is excellent -- Safari's rendering engine handles WebGL2 Gabor patches perfectly
- Vite integration is native (Tauri's official template is Vite-based)
- The app is purely client-side -- no Node.js APIs needed, which eliminates Electron's main advantage

### Implementation
1. `npm create tauri-app` in existing project, select Vite + React template
2. Add `src-tauri/` directory with `tauri.conf.json`, `main.rs` (minimal, ~20 lines)
3. `tauri.conf.json`: set `bundle.macOS.dmg` format, app identifier `com.visiontrainer.app`, window size 1280x900
4. Keep PWA manifest for web fallback -- Tauri and PWA coexist naturally
5. Build: `npm run tauri build` produces `.dmg` directly
6. Code signing: use Apple Developer ID (or ad-hoc for personal use). Tauri supports `tauri signer` for update signatures.

### Trade-off acknowledged
- WKWebView has minor WebGL2 quirks vs Chromium -- test Gabor rendering on macOS 13+ specifically
- No Windows/Linux without additional CI -- but user only asked for macOS
- Tauri v2 is stable (released Oct 2024), well-documented, active maintenance
