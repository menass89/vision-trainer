# Measurement Confidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one product-wide measurement confidence state that drives Today, Progress, post-session insight, and next-target language.

**Architecture:** Add a pure presenter helper for threshold quality and reliability. Thread its output into existing presenter view models, then surface it in existing screens/components without adding a new route.

**Tech Stack:** TypeScript, React Native, Expo Router, Zustand, Vitest.

---

## File Map

- Create `src/presenters/reliability.ts`: pure confidence helpers and human band labels.
- Create `src/presenters/reliability.test.ts`: threshold quality and reliability tests.
- Modify `src/presenters/types.ts`: add `MeasurementConfidenceView` and attach it to Today, Progress, PostSession.
- Modify `src/presenters/derive.ts`: use reliability helpers; suppress overconfident trend language when data is not reliable.
- Modify `src/presenters/derive.test.ts`: assert Today/Progress/PostSession confidence behavior.
- Modify `src/app/(tabs)/index.tsx`: show confidence/next-action language on Today.
- Modify `src/app/(tabs)/progress.tsx`: show confidence in Vision Profile and plain-language graph labels.
- Modify `src/components/session/PostSessionInsight.tsx`: use confidence copy and retest-oriented CTA language.
- Modify `src/components/progress/ContributorRows.tsx`: show human band labels beside cpd.

## Task 1: Central Reliability Helper

- [ ] Write failing tests in `src/presenters/reliability.test.ts`.

Expected cases:
- `isThresholdSuspicious` is true when `trialCount < 10`.
- true when `lapseRate > 0.15`.
- true when `ciLow <= 0`.
- true when `ciHigh / ciLow > 8`.
- `deriveMeasurementConfidence` returns `needs-retest` for latest suspicious session.
- returns `provisional` for fewer than 3 completed sessions with usable thresholds.
- returns `reliable` for 3+ usable completed sessions.
- `humanBandLabel(1)` returns broad-shape language; `humanBandLabel(6)` returns detail language.

Run: `npx vitest run src/presenters/reliability.test.ts`
Expected: fail because file/functions do not exist.

- [ ] Implement `src/presenters/reliability.ts`.

Exports:
- `MeasurementConfidenceTier = 'provisional' | 'reliable' | 'needs-retest'`
- `MeasurementConfidenceView`
- `isThresholdSuspicious(threshold)`
- `humanBandLabel(cpd)`
- `deriveMeasurementConfidence(sessions, thresholds, latestSessionId?)`

Rules:
- Suspicious threshold if `trialCount < 10 || lapseRate > 0.15 || ciLow <= 0 || ciHigh / ciLow > 8`.
- Latest suspicious session wins as `needs-retest`.
- Fewer than 3 completed sessions with usable thresholds is `provisional`.
- Otherwise `reliable`.

- [ ] Run `npx vitest run src/presenters/reliability.test.ts`.
Expected: pass.

## Task 2: Presenter Integration

- [ ] Add failing assertions to `src/presenters/derive.test.ts`.

Expected:
- Empty/first-session Today has `measurementConfidence.tier === 'provisional'`.
- Suspicious latest session makes Today and Progress `needs-retest`.
- Progress with fewer than 3 usable sessions reports `verdict: 'holding'`.
- Progress ignores suspicious thresholds for headline/sparkline trend.
- Post-session insight uses the same tier as central helper.

Run: `npx vitest run src/presenters/derive.test.ts`
Expected: fail because view models do not expose confidence yet.

- [ ] Modify `src/presenters/types.ts` and `src/presenters/derive.ts`.

Implementation:
- Add `measurementConfidence` to `TodayView`, `ProgressView`, and `PostSessionInsightView`.
- Use `deriveMeasurementConfidence` in all three derivations.
- Compute progress metrics from usable thresholds only.
- If confidence is not `reliable`, force `verdict: 'holding'` and no improvement/regression claims.

- [ ] Run `npx vitest run src/presenters/reliability.test.ts src/presenters/derive.test.ts`.
Expected: pass.

## Task 3: Surface Confidence in UI

- [ ] Update Today screen.

Behavior:
- Home subcopy says `Building baseline X/3`, `Reliable reading`, or `Retest recommended`.
- If session already done today, avoid making `Train again` feel required.

- [ ] Update Progress screen.

Behavior:
- Vision profile card displays confidence label.
- Graph helper copy uses `Contrast sensitivity estimate`.
- Contributor rows include human band labels.
- Provisional/retest states do not show overconfident improvement/regression.

- [ ] Update PostSessionInsight.

Behavior:
- `needs-retest` state makes retest guidance primary in copy.
- `provisional` state shows baseline progress X/3.
- `reliable` state can mention change only when central confidence allows it.

## Task 4: Verification

- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npx vitest run`.
- [ ] Launch/reload simulator and verify no redbox on Today/Progress/session.
- [ ] Commit as `feat(progress): surface measurement confidence`.
- [ ] Push branch.
- [ ] Run `coderabbit review --agent -t committed`; fix only critical/major issues.

## Acceptance Criteria

- One helper owns measurement confidence logic.
- Suspicious sessions are visible but do not silently drive headline trend language.
- Today, Progress, and PostSession use the same confidence tier.
- Provisional states frame baseline-building as expected, not failure.
- No new major screen, cloud, export, privacy, or program-map work in this slice.
