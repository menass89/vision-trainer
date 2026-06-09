import { describe, expect, it } from 'vitest';

import type { SessionLog, ThresholdEstimate } from '@/types';

import { derivePostSessionInsight, deriveProgressView, deriveTodayView } from './derive';

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
  createdAt: string,
  spatialFrequencyCpd = 4
): ThresholdEstimate {
  return {
    id,
    sessionId,
    blockId: `block-${id}`,
    conditionKey: `contrast-detection:${spatialFrequencyCpd}:90`,
    paradigm: 'contrast-detection',
    spatialFrequencyCpd,
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
      csfReferences: [],
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

  it('derives norm and target graph references from measured spatial frequencies', () => {
    const today = fixedNow.toISOString();
    const sessions = [session('session-1', today)];
    const thresholds = [
      threshold('threshold-1', 'session-1', 0.02, today, 1.5),
      threshold('threshold-2', 'session-1', 0.05, today, 12),
    ];

    const progressView = deriveProgressView(sessions, thresholds, fixedNow);

    expect(progressView.csfReferences).toEqual([
      {
        label: 'Target',
        points: [
          { spatialFrequency: 1.5, sensitivity: 63.9 },
          { spatialFrequency: 12, sensitivity: 28.8 },
        ],
      },
      {
        label: 'Norm',
        points: [
          { spatialFrequency: 1.5, sensitivity: 55.6 },
          { spatialFrequency: 12, sensitivity: 25 },
        ],
      },
    ]);
  });

  it('marks the first sessions as a provisional baseline', () => {
    const today = fixedNow.toISOString();
    const sessions = [session('session-1', today)];
    const thresholds = [threshold('threshold-1', 'session-1', 0.05, today, 1)];

    expect(derivePostSessionInsight(sessions, thresholds, 'session-1')).toMatchObject({
      status: 'provisional',
      title: 'Baseline started',
      confidenceLabel: 'Provisional',
      sessionsUntilReliable: 2,
    });
  });

  it('surfaces a reliable session insight once the baseline has enough completed sessions', () => {
    const day1 = new globalThis.Date(2026, 4, 29).toISOString();
    const day2 = new globalThis.Date(2026, 4, 30).toISOString();
    const day3 = fixedNow.toISOString();
    const sessions = [
      session('session-1', day1),
      session('session-2', day2),
      session('session-3', day3),
    ];
    const thresholds = [
      threshold('threshold-1', 'session-1', 0.04, day1, 2),
      threshold('threshold-2', 'session-2', 0.03, day2, 2),
      threshold('threshold-3', 'session-3', 0.02, day3, 2),
    ];

    expect(derivePostSessionInsight(sessions, thresholds, 'session-3')).toMatchObject({
      status: 'reliable',
      title: 'Session insight',
      confidenceLabel: 'Reliable',
      measuredBandsLabel: '2 cpd',
      deltaLabel: 'Improving',
      deltaPercent: 50,
    });
  });

  it('asks for a retest when a completed session has suspicious response quality', () => {
    const day1 = new globalThis.Date(2026, 4, 29).toISOString();
    const day2 = new globalThis.Date(2026, 4, 30).toISOString();
    const day3 = fixedNow.toISOString();
    const sessions = [
      session('session-1', day1),
      session('session-2', day2),
      session('session-3', day3),
    ];
    const suspicious = {
      ...threshold('threshold-3', 'session-3', 0.02, day3, 2),
      ciLow: 0.005,
      ciHigh: 0.2,
      lapseRate: 0.22,
    };
    const thresholds = [
      threshold('threshold-1', 'session-1', 0.04, day1, 2),
      threshold('threshold-2', 'session-2', 0.03, day2, 2),
      suspicious,
    ];

    expect(derivePostSessionInsight(sessions, thresholds, 'session-3')).toMatchObject({
      status: 'needs-retest',
      title: 'Retest recommended',
      confidenceLabel: 'Needs retest',
      deltaLabel: 'Uncertain',
    });
  });
});
