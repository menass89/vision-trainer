import { afterEach, describe, expect, it, vi } from 'vitest';

import { conditionKey } from '@/core/displayCalibration';
import type { ParadigmId, ThresholdEstimate } from '@/types';

import { planProgramSession } from './programPlanner';

function threshold(
  id: string,
  spatialFrequencyCpd: number,
  thresholdContrast: number,
  paradigm: ParadigmId = 'contrast-detection'
): ThresholdEstimate {
  return {
    id,
    sessionId: 'session-1',
    blockId: `block-${id}`,
    conditionKey: conditionKey(spatialFrequencyCpd, 0, paradigm),
    paradigm,
    spatialFrequencyCpd,
    orientationDeg: 0,
    thresholdContrast,
    thresholdLog10: Math.log10(thresholdContrast),
    ciLow: thresholdContrast * 0.8,
    ciHigh: thresholdContrast * 1.2,
    trialCount: 20,
    lapseRate: 0,
    createdAt: '2026-06-06T10:20:00.000Z',
  };
}

describe('program planner', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prioritizes nearby low-frequency deficits from calibration thresholds', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const blocks = planProgramSession('sports-vision', 2, [
      threshold('bad-1-cpd', 1, 0.9),
      threshold('ok-2-cpd', 2, 0.12),
      threshold('strong-6-cpd', 6, 0.009),
      threshold('strong-12-cpd', 12, 0.02),
    ]);

    expect(blocks.find((block) => block.role === 'training')?.condition.spatialFrequencyCpd).toBe(1.5);
  });

  it('uses user-facing training labels instead of internal letters', () => {
    const blocks = planProgramSession('sports-vision', 2, []);
    const trainingLabels = blocks
      .filter((block) => block.role === 'training')
      .map((block) => block.label);

    expect(trainingLabels.length).toBeGreaterThan(0);
    expect(trainingLabels.every((label) => /cpd/.test(label))).toBe(true);
    expect(trainingLabels.every((label) => !/^Training [A-Z]$/.test(label))).toBe(true);
  });

  it('keeps the default daily session at 100 flashes', () => {
    const blocks = planProgramSession('sports-vision', 2, []);

    expect(blocks.reduce((sum, block) => sum + block.condition.trialsPerBlock, 0)).toBe(100);
  });
});
