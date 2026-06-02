import { describe, expect, it } from 'vitest';

import type { SessionLog, ThresholdEstimate } from '@/types';

import { deriveProgressView, deriveTodayView } from './derive';

function session(id: string, startedAt: string): SessionLog {
  return {
    id,
    startedAt,
    completedAt: startedAt,
    status: 'completed',
    eyeMode: 'both',
    sessionType: 'guided',
    calibrationId: 'calibration-1',
    protocolVersion: 'mvp-0.2',
    plannedBlocks: [],
    completedTrials: 16,
    metadata: {},
  };
}

function threshold(
  id: string,
  sessionId: string,
  thresholdContrast: number,
  createdAt: string
): ThresholdEstimate {
  return {
    id,
    sessionId,
    blockId: `block-${id}`,
    conditionKey: 'contrast-detection:4:90',
    paradigm: 'contrast-detection',
    spatialFrequencyCpd: 4,
    orientationDeg: 90,
    thresholdContrast,
    thresholdLog10: Math.log10(thresholdContrast),
    ciLow: thresholdContrast * 0.8,
    ciHigh: thresholdContrast * 1.2,
    trialCount: 16,
    lapseRate: 0,
    createdAt,
  };
}

describe('presenter derivation', () => {
  const fixedNow = new globalThis.Date(2026, 4, 31);

  it('derives empty today and progress states', () => {
    expect(deriveTodayView([], [], fixedNow)).toMatchObject({
      contrastSensitivity: 0,
      dailyProgress: 0,
      streakDays: 0,
      sessionDoneToday: false,
      nextTargetLabel: 'First session · 4 min',
      verdict: 'holding',
    });
    expect(deriveProgressView([], [], fixedNow)).toEqual({
      headlineAcuity: 0,
      previousAcuity: 0,
      verdict: 'holding',
      delta: 0,
      sparkline: [],
      csf: [],
      csfReferences: [
        { label: 'Target', sensitivity: 200 },
        { label: 'Norm', sensitivity: 120 },
      ],
      contributors: [],
    });
  });

  it('derives populated today and progress states', () => {
    const yesterday = new globalThis.Date(2026, 4, 30).toISOString();
    const today = fixedNow.toISOString();
    const sessions = [session('session-1', yesterday), session('session-2', today)];
    const thresholds = [
      threshold('threshold-1', 'session-1', 0.04, yesterday),
      threshold('threshold-2', 'session-2', 0.02, today),
    ];

    const todayView = deriveTodayView(sessions, thresholds, fixedNow);
    const progressView = deriveProgressView(sessions, thresholds, fixedNow);

    expect(todayView.contrastSensitivity).toBeGreaterThan(0);
    expect(todayView.streakDays).toBe(2);
    expect(todayView.sessionDoneToday).toBe(true);
    // fixedNow is Sun 2026-05-31 → today lit, yesterday (Sat) sits in last week.
    expect(todayView.weekDays).toEqual([true, false, false, false, false, false, false]);
    expect(progressView.sparkline).toHaveLength(2);
    expect(progressView.csf).toEqual([{ spatialFrequency: 4, sensitivity: 50 }]);
    expect(progressView.contributors[0]?.norm).toBeGreaterThan(0);
    expect(Number.isFinite(progressView.contributors[0]?.norm)).toBe(true);
  });
});
