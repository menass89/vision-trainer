import { describe, expect, it } from 'vitest';

import { contrastFromLog10, QuestStaircase } from '@/psychophysics/quest';

import { FIRST_SESSION_QUEST_PARAMS } from './calibrationQuest';

describe('first session calibration QUEST parameters', () => {
  it('starts obvious, becomes harder after correct responses, and recovers after a miss', () => {
    const staircase = new QuestStaircase(FIRST_SESSION_QUEST_PARAMS[0]);
    const firstIntensity = staircase.nextIntensity();
    const firstContrast = contrastFromLog10(firstIntensity);

    for (let trial = 0; trial < 9; trial += 1) {
      const intensity = staircase.nextIntensity();
      staircase.record(intensity, true);
    }

    const harderIntensity = staircase.nextIntensity();
    const harderContrast = contrastFromLog10(harderIntensity);
    staircase.record(harderIntensity, false);
    const recoveredContrast = contrastFromLog10(staircase.nextIntensity());

    expect(firstContrast).toBeGreaterThanOrEqual(0.6);
    expect(harderContrast).toBeLessThan(firstContrast * 0.65);
    expect(recoveredContrast).toBeGreaterThan(harderContrast);
  });
});
