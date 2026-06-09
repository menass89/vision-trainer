import { describe, expect, it } from 'vitest';

import type { SessionLog, ThresholdEstimate } from '@/types';

import {
  deriveMeasurementConfidence,
  humanBandLabel,
  isThresholdSuspicious,
} from './reliability';

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
    completedTrials: 20,
    metadata: {},
  };
}

function threshold(
  id: string,
  sessionId: string,
  createdAt: string,
  overrides: Partial<ThresholdEstimate> = {}
): ThresholdEstimate {
  return {
    id,
    sessionId,
    blockId: `block-${id}`,
    conditionKey: 'contrast-detection:2:90',
    paradigm: 'contrast-detection',
    spatialFrequencyCpd: 2,
    orientationDeg: 90,
    thresholdContrast: 0.04,
    thresholdLog10: Math.log10(0.04),
    ciLow: 0.032,
    ciHigh: 0.048,
    trialCount: 20,
    lapseRate: 0.02,
    createdAt,
    ...overrides,
  };
}

describe('measurement reliability', () => {
  it('flags thresholds with too few trials', () => {
    expect(isThresholdSuspicious(threshold('t1', 's1', '2026-06-09T10:00:00.000Z', { trialCount: 9 }))).toBe(true);
  });

  it('flags thresholds with high lapse rate', () => {
    expect(isThresholdSuspicious(threshold('t1', 's1', '2026-06-09T10:00:00.000Z', { lapseRate: 0.16 }))).toBe(true);
  });

  it('flags thresholds with invalid or too-wide confidence intervals', () => {
    expect(isThresholdSuspicious(threshold('t1', 's1', '2026-06-09T10:00:00.000Z', { ciLow: 0 }))).toBe(true);
    expect(isThresholdSuspicious(threshold('t2', 's1', '2026-06-09T10:00:00.000Z', { ciLow: 0.01, ciHigh: 0.09 }))).toBe(true);
  });

  it('marks fewer than three usable sessions as provisional', () => {
    const day1 = '2026-06-07T10:00:00.000Z';
    const day2 = '2026-06-08T10:00:00.000Z';
    const sessions = [session('s1', day1), session('s2', day2)];
    const thresholds = [threshold('t1', 's1', day1), threshold('t2', 's2', day2)];

    expect(deriveMeasurementConfidence(sessions, thresholds)).toMatchObject({
      tier: 'provisional',
      canDriveTrend: false,
      baselineStep: 2,
      baselineTarget: 3,
    });
  });

  it('marks the latest suspicious session as needing retest', () => {
    const day1 = '2026-06-07T10:00:00.000Z';
    const day2 = '2026-06-08T10:00:00.000Z';
    const day3 = '2026-06-09T10:00:00.000Z';
    const sessions = [session('s1', day1), session('s2', day2), session('s3', day3)];
    const thresholds = [
      threshold('t1', 's1', day1),
      threshold('t2', 's2', day2),
      threshold('t3', 's3', day3, { lapseRate: 0.25 }),
    ];

    expect(deriveMeasurementConfidence(sessions, thresholds, 's3')).toMatchObject({
      tier: 'needs-retest',
      canDriveTrend: false,
      latestSessionSuspicious: true,
    });
  });

  it('marks three usable sessions as reliable', () => {
    const day1 = '2026-06-07T10:00:00.000Z';
    const day2 = '2026-06-08T10:00:00.000Z';
    const day3 = '2026-06-09T10:00:00.000Z';
    const sessions = [session('s1', day1), session('s2', day2), session('s3', day3)];
    const thresholds = [
      threshold('t1', 's1', day1),
      threshold('t2', 's2', day2),
      threshold('t3', 's3', day3),
    ];

    expect(deriveMeasurementConfidence(sessions, thresholds, 's3')).toMatchObject({
      tier: 'reliable',
      canDriveTrend: true,
      label: 'Reliable reading',
    });
  });

  it('translates spatial-frequency bands into plain language', () => {
    expect(humanBandLabel(1)).toBe('Broad shapes');
    expect(humanBandLabel(3)).toBe('Everyday detail');
    expect(humanBandLabel(12)).toBe('Fine detail');
  });
});
