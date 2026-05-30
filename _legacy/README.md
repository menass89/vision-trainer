# Vision Trainer

Local-first perceptual learning PWA for contrast sensitivity training. Trains the visual cortex via calibrated Gabor patches, QUEST staircase psychophysics, and condition-specific programs (myopia, presbyopia, sports vision).

Wraps as a native iOS app via Capacitor.

## Stack

- **Frontend**: React 19 + TypeScript + Vite
- **State**: Zustand
- **Persistence**: IndexedDB (`idb`)
- **Rendering**: WebGL2 Gabor renderer
- **PWA**: `vite-plugin-pwa` (Workbox)
- **iOS wrapper**: Capacitor 8

## Scripts

```bash
npm run dev          # Vite dev server
npm run build        # Production web build (tsc + vite)
npm run preview      # Preview production build
npm run test         # Vitest

# iOS (Capacitor)
npm run cap:build    # Build for native shell
npm run cap:sync     # Build + sync to ios/
npm run cap:open     # Open Xcode workspace
```

## iOS Code Signing

Capacitor iOS uses automatic code signing. Before building or archiving:

1. Open `ios/App/App.xcworkspace` in Xcode.
2. Select the `App` target -> **Signing & Capabilities**.
3. Set your **Team** (Apple Developer account).

This populates `DEVELOPMENT_TEAM` in `ios/App/App.xcodeproj/project.pbxproj`. That file is tracked, so the change stays local only if you avoid committing the modified `project.pbxproj`.

## Architecture

```text
src/
├── App.tsx                  # Root layout + tab router
├── main.tsx                 # Entry + PWA registration
├── theme.ts                 # Time-of-day theme phases
├── types.ts                 # Domain types
├── assessment/              # CSF measurement
├── components/              # UI surfaces (tabs, screens, scenes)
├── core/                    # WebGL Gabor renderer, display calibration
├── data/                    # IndexedDB schema + queries
├── programs/                # Condition-specific training programs
├── session/                 # Session lifecycle planner
├── store/                   # Zustand store
├── tasks/                   # Psychophysics paradigms (registry)
└── utils/                   # Shared helpers
```

## Calibration

A browser-derived calibration profile (screen geometry, device pixel ratio) is created on first launch and persisted to IndexedDB. `viewingDistanceCm`, `gamma`, and `backgroundLuminanceCdM2` currently fall back to seeded defaults in `src/core/displayCalibration.ts` — physical calibration is approximate until a real measurement workflow is added.

## License

UNLICENSED — research/personal use.
