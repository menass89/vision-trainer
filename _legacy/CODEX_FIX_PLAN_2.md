# Vision Trainer — Fix Plan Round 2

## FIX 1: Monocular eye mode
**Files**: `src/types.ts`, `src/store/useAppStore.ts`, `src/components/SessionFlow.tsx`, `src/data/db.ts`

Add an eye selection before starting a session:
- Add type `EyeMode = 'both' | 'left' | 'right'` to types.ts
- Add `eyeMode: EyeMode` field to SessionLog type
- Before "Start Guided Session", show 3 buttons: "Both Eyes", "Left Eye Only", "Right Eye Only"
- When monocular is selected, show a brief instruction: "Cover your [other] eye with your hand or an eye patch, then press Start"
- Store eyeMode in the session log so progress dashboard can filter/show per-eye data
- In ProgressDashboard, show separate CSF curves per eye mode if data exists

## FIX 2: Humanize the UI — remove jargon
**Files**: `src/components/ContrastTask.tsx`, `src/components/ProgressDashboard.tsx`, `src/components/CalibrationPanel.tsx`, `src/components/SessionFlow.tsx`, `src/components/TaskInstructions.tsx`

Replace technical jargon with human-readable labels everywhere in the UI:
- "cpd" → show as detail level: 1.5 cpd = "Coarse", 3 cpd = "Medium", 6 cpd = "Fine", 12 cpd = "Ultra-fine"
- In the task panel, instead of "3 cpd / 0 deg", show "Medium detail · Horizontal"
- Orientations: 0 = "Horizontal", 45 = "Diagonal ↗", 90 = "Vertical", 135 = "Diagonal ↘"
- "threshold" → "detection level"
- "sensitivity" → "sharpness score"
- "CSF" → "Vision Profile"
- "2AFC temporal interval" → remove this subtitle entirely, it means nothing to users
- "QUEST pThreshold 0.82, gamma 0.5" → remove this footer, it's debug info
- Keep technical values as small tooltips or secondary text for power users, not primary labels
- In the progress dashboard: label the graph lines clearly ("First session" and "Latest session" or similar)
- Replace "CSF gain" with "Vision improvement"
- Replace "Threshold estimates" with "Measurements taken"

## FIX 3: ITI timing + inline accuracy feedback
**Files**: `src/components/ContrastTask.tsx`, `src/styles.css`

1. Change inter-trial interval from 800ms to 1200ms
2. After the user responds, show a small colored dot/indicator RIGHT BELOW the stimulus canvas (not in the side panel):
   - Green circle + "✓" for correct
   - Red circle + "✗" for incorrect  
   - Show it during the 1200ms ITI, then it disappears when the next trial starts
3. Also show a running accuracy counter near the feedback dot: "12/15 correct"
4. The feedback should be subtle but visible without moving your eyes far from the stimulus area

## FIX 4: Label the progress dashboard graph
**Files**: `src/components/ProgressDashboard.tsx`, `src/styles.css`

1. Add a legend to the CSF chart showing what each line means:
   - Dashed line = "First session" (baseline)
   - Solid line = "Latest session" (current)
2. Add axis labels: X = "Detail level (coarse → fine)", Y = "Sharpness score"
3. If only one session exists, show only one line labeled "Current"

## FIX 5: Implement Gamification & Adherence Layer (Priority 5 from original plan)
**Files**: new `src/components/GamificationBar.tsx`, update `src/store/useAppStore.ts`, update `src/data/db.ts`, update `src/types.ts`, update `src/App.tsx`, update `src/components/ModuleStatus.tsx`

### XP & Level System
- Earn XP per trial: 10 XP base + 5 bonus if correct + difficulty multiplier (higher cpd = more XP)
- Level thresholds: Level 1 = 0 XP, Level 2 = 200 XP, Level 3 = 500 XP, etc. (roughly 1 level per 2 sessions)
- Store cumulative XP and level in IDB under a new 'gamification' object store

### Session Streaks
- Track consecutive days with completed sessions (already computed, just surface it)
- Show streak prominently in a top bar

### Milestone Badges
- Define milestones: "First Session", "5 Sessions", "10 Sessions", "First Improvement", "3-Day Streak", "Week Streak", "All Paradigms Tried"
- Store earned badges in IDB
- Show earned badges in the gamification bar

### Session Scheduling
- After completing a session, show: "Great work! Next session recommended: [day after tomorrow]"
- Based on 3x/week cadence with rest days between

### Audio Feedback
- Use Web Audio API to generate simple tones (no audio files needed):
  - Correct: short 880Hz sine tone, 100ms, soft volume
  - Level up: ascending chord (440Hz → 660Hz → 880Hz)
- Mute toggle in settings

### GamificationBar Component
- Horizontal bar at the top of the app showing: Level, XP progress bar, streak, latest badge
- Always visible, not just during training

### Update ModuleStatus
- Mark "Gamification & Adherence Layer" as active (green)

## FIX 6: Implement Assessment & Outcome Module (Priority 7 from original plan)
**Files**: new `src/components/Assessment.tsx`, new `src/assessment/csfMeasurement.ts`, update `src/components/SessionFlow.tsx`, update `src/components/ModuleStatus.tsx`

### CSF Measurement (Method of Constant Stimuli)
- NOT adaptive staircase — use fixed contrast levels to build proper psychometric function
- At each of 4 spatial frequencies (1.5, 3, 6, 12 cpd), present 7 contrast levels (logarithmically spaced)
- 5 repetitions each = 4 × 7 × 5 = 140 trials total (~15 min)
- Fit Weibull psychometric function to get threshold at each frequency
- This gives an unbiased CSF measurement

### Assessment Flow
- Add "Run Full Assessment" button alongside "Start Guided Session"
- Shows a brief explanation: "This 15-minute test measures your vision profile precisely. Run it before starting training and every 10 sessions to track improvement."
- Results stored separately from training data

### Report
- Show before/after CSF comparison
- Estimated visual acuity change (using Regan & Neima 1983 CSF-to-VA correlation)
- Percentage improvement per spatial frequency
- Store assessment results in IDB

### Update ModuleStatus
- Mark "Assessment & Outcome Module" as active (green)

## FIX 7: Implement Dichoptic Training Module
**Files**: new `src/components/DichopticSetup.tsx`, new `src/tasks/dichopticContrast.ts`, update `src/core/gaborRenderer.ts`, update `src/types.ts`, update `src/session/sessionPlanner.ts`, update `src/components/ModuleStatus.tsx`

### Anaglyph Rendering
- Add a new rendering mode to gaborRenderer.ts fragment shader:
  - When dichoptic mode is active, render Gabor in RED channel only (for dominant eye) or CYAN channel only (for non-dominant eye)
  - Add uniform `u_dichopticMode` (0=off, 1=red-only, 2=cyan-only)
  - User wears red-cyan anaglyph glasses (cheap, ~$3)

### Dichoptic Setup
- New component for first-time dichoptic setup:
  - Ask which eye is dominant (or provide a simple dominance test)
  - Show a red patch and a cyan patch — verify user can see each with correct eye through glasses
  - Set interocular contrast ratio (start at 80% dominant / 20% non-dominant)

### Dichoptic Training Task
- Same 2AFC contrast detection as monocular, but:
  - Target Gabor rendered to non-dominant eye (cyan channel) at adapted contrast
  - Background/flankers rendered to dominant eye (red channel)
  - Forces binocular combination, reduces suppression
- Progression: gradually equalize contrast ratio as suppression decreases (e.g., 80/20 → 70/30 → ... → 50/50)

### Integration
- Add "Dichoptic Training" as a session type option alongside regular training
- Unlock after session 5 (user has learned the basic task)
- Session planner includes dichoptic blocks when enabled

### Update ModuleStatus
- Mark "Dichoptic Training Module" as active (green)

## EXECUTION ORDER
Execute ALL fixes 1-7. After all changes, verify with: npx tsc --noEmit && npx vite build
