# Vision Trainer — Open-Source Perceptual Learning Platform

## Mission
Reverse-engineer RevitalVision's FDA-cleared perceptual learning approach as a free, open-source Progressive Web App. Built on published science (Polat et al.), not proprietary code.

## Architecture — 12 Components (from 5-agent stochastic consensus)

### 1. Gabor Rendering Engine
- Generate Gabor patches via WebGL/Canvas at 1.5–12 cpd, 4+ orientations, arbitrary contrast
- Formula: G(x,y) = exp(-(x'²+y'²)/(2σ²)) × cos(2π·f·x' + φ), where σ = λ (lambda = 1/f)
- Support single-patch AND flanker configurations (collinear, orthogonal)
- 60ms stimulus presentations with sub-frame timing accuracy
- Parameters from literature: background luminance 40 cd/m², flanker contrast 60%, flanker distance 3–4λ

### 2. Task Paradigm Library (pluggable modules)
- **Contrast Detection**: Single Gabor, 2AFC temporal interval, detect which interval contains the target
- **Lateral Masking**: Target Gabor flanked by collinear high-contrast Gabor patches at 3–4λ distance
- **Spatial Masking**: Target surrounded by noise/texture mask
- **Backward Masking**: Target followed by mask after variable ISI (60–240ms)
- **Pedestal Discrimination**: Detect contrast increment on a visible pedestal
- Each paradigm is a module with its own stimulus config and trial logic

### 3. Adaptive Staircase Controller
- QUEST Bayesian threshold estimation (use jsQUEST library, MIT license)
- Parameters: beta=3.5, pThreshold=0.82, gamma=0.5 (for 2AFC), ~40 trials per run
- Independent staircases per condition × spatial frequency × orientation
- Anti-gaming: catch trials (5%), lapse rate estimation
- Output: threshold estimate + confidence interval per block

### 4. Cross-Session Progression Planner
- THE strategic layer (replaces RevitalVision's proprietary IP)
- Deficit-first heuristic: prioritize conditions where user threshold is furthest from population norms
- Start with low spatial frequencies (1.5–3 cpd), progress to high (6–12 cpd)
- Session structure: warm-up block → 2-3 training paradigm blocks → cool-down assessment
- Track threshold improvement velocity per condition to decide when to advance
- Periodic re-probing of "mastered" conditions to confirm retention
- ~40 sessions × 30 min, 3x/week target cadence

### 5. Dichoptic Training Module
- Different stimuli/contrast per eye via red-green anaglyph mode (primary)
- Amblyopic eye sees high-contrast game-critical elements
- Fellow eye sees low-contrast background
- Progressive contrast ratio equalization as suppression decreases
- Future: VR headset support for perfect optical separation

### 6. Calibration & Display Profiling
- First-run guided setup: viewing distance (ruler method or webcam), screen DPI detection
- Gamma estimation via perceptual brightness matching
- Refresh rate detection for timing accuracy
- Convert physical units (cpd, cd/m²) → pixel values using calibration profile
- Store display profile, prompt recalibration if device changes

### 7. Progress Dashboard
- CSF (Contrast Sensitivity Function) curves over time per spatial frequency
- Threshold improvement plots per paradigm
- Session completion streaks and adherence rate
- Projected improvement trajectory
- Before/after comparison view

### 8. Gamification & Adherence Layer
- Session streaks with visual streak counter
- Per-trial audio/visual micro-feedback (correct/incorrect)
- Milestone badges (10 sessions, 20 sessions, etc.)
- Session scheduling with 3x/week cadence reminders
- XP/level system based on threshold improvements, not just completion
- Does NOT alter stimulus parameters — pure wrapper

### 9. Local-First Data Store
- IndexedDB for all trial-level data (stimulus params, response, RT, threshold)
- User profile: demographics, diagnosis type, calibration data
- Session logs with full reproducibility metadata
- Export as JSON/CSV
- Optional cloud sync (future)

### 10. Clinician / Researcher Portal
- Prescribe locked protocols (select paradigms, set session counts)
- Monitor patient compliance remotely
- Export anonymized datasets
- Configure custom paradigm sequences
- Role-based access: patient mode (guided) vs self-directed mode

### 11. Assessment & Outcome Module
- Standardized CSF measurement (separate from training staircases)
- Pre/post comparison at 6+ spatial frequencies
- Method of constant stimuli (not adaptive) for unbiased measurement
- Visual acuity estimation from CSF curve
- Exportable clinical report (PDF)

### 12. Platform Shell (PWA)
- Progressive Web App, installable, offline-capable
- Single codebase: desktop browser + tablet
- No mobile phone (screen too small for calibrated Gabor work)
- Service worker for offline session execution
- Responsive layout for different screen sizes

## Tech Stack
- **Framework**: React + TypeScript (PWA)
- **Rendering**: WebGL via Canvas API for Gabor patches (GPU-accelerated)
- **Psychophysics**: jsQUEST (MIT) for adaptive staircases
- **State**: Zustand or similar lightweight store
- **Storage**: IndexedDB (via idb or Dexie.js)
- **Build**: Vite
- **Testing**: Vitest + Playwright for e2e

## Implementation Priority
1. Gabor Rendering Engine + Calibration (core foundation)
2. Contrast Detection task + Adaptive Staircase (minimum viable training)
3. Session flow + Local Data Store (usable sessions)
4. Progress Dashboard (user can see improvement)
5. Remaining paradigms (lateral masking, spatial masking, etc.)
6. Cross-Session Progression Planner
7. Gamification layer
8. Dichoptic module
9. Clinician portal
10. Assessment module

## Key Differentiators vs RevitalVision
- Open-source, free, transparent algorithms
- Dichoptic/binocular training (RevitalVision is monocular only)
- Gamification for adherence
- Local-first, user-owned data
- Research-extensible with open protocol schema
