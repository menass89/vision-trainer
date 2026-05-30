# Vision Trainer — Fix & Complete Plan

## PRIORITY 1: Fix the game (it's broken)

### Bug 1: Gabor patterns don't render in 50% of trials
**File**: `src/components/ContrastTask.tsx`
**Problem**: Lines 71-75 and 81-86. When targetInterval is NOT the current interval, the code calls `await wait(duration)` but never clears the canvas or shows a blank frame. The user sees nothing for the entire trial.
**Fix**: In both blank intervals, call `stageRef.current?.clear()` before waiting, so the user sees the uniform gray background (making the Gabor visible by contrast in the target interval).

### Bug 2: No user instructions — the game is incomprehensible
**File**: `src/components/ContrastTask.tsx`
**Problem**: User has no idea what they're supposed to do. No explanation of the 2AFC task.
**Fix**: Add an instruction panel that appears before the first trial explaining:
- "You will see two intervals. One contains a faint striped pattern (Gabor patch), the other is blank."
- "Press 1 if the pattern appeared in Interval 1, press 2 if it appeared in Interval 2."
- "The pattern will get harder to see as you improve — this is normal."
- Each paradigm should have its own explanation when we add more paradigms.

### Bug 3: Phase overlay blocks the canvas
**File**: `src/components/ContrastTask.tsx` and `src/styles.css`
**Problem**: The phase-overlay div with "Interval 1" / "Interval 2" text is likely covering the canvas or drawing attention away from the subtle Gabor pattern.
**Fix**: 
- During stimulus intervals, show only a tiny label in the corner, NOT centered text that obscures the pattern
- The fixation cross during 'fixation' phase is fine
- During 'response' phase, make the response buttons more prominent

### Bug 4: Trial doesn't auto-advance
**File**: `src/components/ContrastTask.tsx`
**Problem**: User must click "Begin Trial" for EVERY trial. This breaks flow for a 40-trial block.
**Fix**: After submitting a response, automatically start the next trial after a brief (800ms) inter-trial interval. Keep the manual "Begin Trial" button only for the very first trial of a block.

---

## PRIORITY 2: Add per-segment explanations

**File**: `src/components/ContrastTask.tsx` (new component `src/components/TaskInstructions.tsx`)

Add a brief explanation card that appears:
1. At the start of each block, explaining what that block does (warm-up, training, assessment)
2. At the start of each new paradigm type, explaining how it differs
3. Include a "Got it" button to dismiss

Content for each block role:
- **Warm-up**: "Easy warm-up round at low spatial frequency. Get your eyes adjusted."
- **Training**: "Main training block. The staircase will adapt to find your contrast threshold."
- **Assessment**: "Final assessment. We measure your current sensitivity to track improvement over sessions."

---

## PRIORITY 3: Implement missing paradigms (Task Paradigm Library)

**Files**: `src/tasks/lateralMasking.ts`, `src/tasks/spatialMasking.ts`, `src/tasks/backwardMasking.ts`, `src/tasks/pedestalDiscrimination.ts`, update `src/tasks/paradigmRegistry.ts`

Each paradigm module needs:
- A conditions array (like CONTRAST_DETECTION_CONDITIONS)
- A createTrial() function that builds the stimulus config
- A buildTrialRecord() function

### Lateral Masking
- Same as contrast detection BUT with flanker.enabled = true
- Collinear flankers at 3.5λ distance, 60% contrast
- Tests lateral interaction / collinear facilitation
- This is RevitalVision's PRIMARY paradigm

### Spatial Masking
- Target Gabor surrounded by randomly oriented Gabor patches (noise texture)
- The flankers have random orientations (not collinear)
- Tests crowding resistance

### Backward Masking
- Target Gabor followed by a full-field mask after variable ISI
- ISI starts at 240ms and adapts down
- Tests temporal processing speed

### Pedestal Discrimination
- Target is a contrast INCREMENT on a visible pedestal (base contrast ~10%)
- User detects which interval has the higher contrast
- Tests fine contrast discrimination

Update paradigmRegistry.ts to mark all as 'active' and export their trial creation functions.

---

## PRIORITY 4: Cross-Session Progression Planner

**File**: `src/session/sessionPlanner.ts`

Enhance planSession() to:
1. Track which paradigms have been trained and how many sessions on each
2. Introduce paradigms progressively: sessions 1-5 = contrast detection only, 6-10 = add lateral masking, 11-15 = add spatial masking, etc.
3. Within each paradigm, progress from low to high spatial frequencies
4. Use deficit-first within the available paradigm pool
5. Generate 4-5 blocks per session (not just 3) for a full 30-min session
6. Add variety — don't repeat the same condition in consecutive blocks

---

## PRIORITY 5: Gamification & Adherence Layer

**Files**: new `src/components/Gamification.tsx`, update `src/store/useAppStore.ts`, update `src/data/db.ts`

Add:
1. Session streak counter (already computed in ProgressDashboard, surface it prominently)
2. Per-trial audio feedback: a subtle "ding" for correct, silence for incorrect
3. Milestone badges stored in IDB: "First Session", "10 Sessions", "First Improvement", "Week Streak"
4. Session scheduling: show "Next session recommended: [date]" based on 3x/week cadence
5. XP system: gain XP for completing trials (more XP for harder conditions)
6. Level system based on cumulative XP

---

## PRIORITY 6: Dichoptic Training Module

**Files**: new `src/components/DichopticSetup.tsx`, new `src/tasks/dichopticContrast.ts`, update `src/core/gaborRenderer.ts`

1. Add an anaglyph rendering mode to GaborRenderer:
   - Split stimulus into red and cyan channels
   - Target eye gets high-contrast red channel, fellow eye gets low-contrast cyan
   - User wears red-cyan anaglyph glasses
2. Add calibration step for anaglyph: verify user can see content in each eye independently
3. Dichoptic contrast detection: same 2AFC task but with interocular contrast difference
4. Progressive contrast equalization: start with large interocular contrast ratio, reduce as suppression decreases

---

## PRIORITY 7: Assessment & Outcome Module

**Files**: new `src/components/Assessment.tsx`, new `src/assessment/csfMeasurement.ts`

1. Formal CSF measurement using method of constant stimuli (NOT adaptive staircase)
2. Present pre-determined contrast levels at 6 spatial frequencies
3. Compute full CSF curve with proper psychometric function fitting
4. Pre/post comparison report
5. Estimated Snellen acuity from CSF curve
6. Export as PDF report

---

## PRIORITY 8: Clinician / Researcher Portal

**Files**: new `src/components/ClinicianPortal.tsx`, new `src/clinic/protocolManager.ts`

1. Role selection on first launch (self-directed vs clinician-supervised)
2. Clinician can lock a protocol: specific paradigms, session count, progression rules
3. Patient compliance dashboard: sessions per week, threshold trends, missed sessions
4. Anonymized data export in research-standard CSV format
5. Protocol import/export as JSON files

---

## EXECUTION ORDER

Execute priorities 1-4 in this batch. They represent the core fixes needed to make the app functional and educational. Priorities 5-8 are enhancements for a later batch.

For each file you create or modify:
1. Ensure TypeScript compiles without errors
2. Match the existing code style (no semicolons is NOT the style — this project uses semicolons)
3. Use the existing type definitions from types.ts, extending only when necessary
4. Keep imports clean — no unused imports
