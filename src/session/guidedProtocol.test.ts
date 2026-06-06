import { describe, expect, it } from 'vitest';

import type { SessionLog, ThresholdEstimate } from '@/types';

import { buildGuidedSessionBlocks, questParamsForCondition } from './guidedProtocol';

function completedSession(id: string): SessionLog {
  return {
    id,
    startedAt: '2026-06-06T10:00:00.000Z',
    completedAt: '2026-06-06T10:30:00.000Z',
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
  spatialFrequencyCpd: number,
  thresholdContrast: number,
  paradigm: ThresholdEstimate['paradigm'] = 'contrast-detection'
): ThresholdEstimate {
  return {
    id,
    sessionId: 'session-1',
    blockId: `block-${id}`,
    conditionKey: `${paradigm}:${spatialFrequencyCpd.toFixed(1)}cpd:0deg`,
    paradigm,
    spatialFrequencyCpd,
    orientationDeg: 0,
    thresholdContrast,
    thresholdLog10: Math.log10(thresholdContrast),
    ciLow: thresholdContrast * 0.8,
    ciHigh: thresholdContrast * 1.2,
    trialCount: 10,
    lapseRate: 0,
    createdAt: '2026-06-06T10:20:00.000Z',
  };
}

describe('guided protocol planning', () => {
  it('uses a research-dose program after baseline instead of two short blocks', () => {
    const blocks = buildGuidedSessionBlocks({
      sessionsCompleted: 1,
      thresholds: [threshold('baseline-1', 1.5, 0.03)],
      visionGoal: 'sports-vision',
    });

    expect(blocks.reduce((sum, block) => sum + block.trialsPerBlock, 0)).toBe(250);
    expect(blocks[0]?.trialsPerBlock).toBe(20);
    expect(blocks.at(-1)?.trialsPerBlock).toBe(30);
  });

  it('initializes a matching condition at the measured threshold', () => {
    const params = questParamsForCondition(
      {
        paradigm: 'contrast-detection',
        spatialFrequencyCpd: 6,
        orientationDeg: 90,
        trialsPerBlock: 40,
        durationMs: 120,
        gaborSizeDeg: 3,
      },
      [threshold('baseline-6', 6, 0.08)]
    );

    expect(params.tGuess).toBeCloseTo(Math.log10(0.08), 3);
    expect(params.tGuessSd).toBeLessThan(0.25);
  });

  it('projects the current eyesight curve to unmeasured spatial frequencies', () => {
    const params = questParamsForCondition(
      {
        paradigm: 'contrast-detection',
        spatialFrequencyCpd: 12,
        orientationDeg: 135,
        trialsPerBlock: 40,
        durationMs: 120,
        gaborSizeDeg: 3,
      },
      [threshold('baseline-1-5', 1.5, 0.018)]
    );

    expect(params.tGuess).toBeCloseTo(Math.log10(0.04), 3);
  });

  it('keeps the projected threshold finite for unsupported spatial frequencies', () => {
    const params = questParamsForCondition(
      {
        paradigm: 'contrast-detection',
        spatialFrequencyCpd: 99,
        orientationDeg: 135,
        trialsPerBlock: 40,
        durationMs: 120,
        gaborSizeDeg: 3,
      },
      [threshold('baseline-99', 99, 0.04)]
    );

    expect(Number.isFinite(params.tGuess)).toBe(true);
  });
});
