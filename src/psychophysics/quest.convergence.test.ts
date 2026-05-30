import { describe, expect, it } from 'vitest';

import { QuestStaircase, type QuestParameters } from './quest';

function mulberry32(seed: number): () => number {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const gamma = 0.5;
const delta = 0.02;
const beta = 3.5;
const params: QuestParameters = {
  tGuess: -1,
  tGuessSd: 0.6,
  pThreshold: gamma + (1 - gamma - delta) * (1 - Math.exp(-1)),
  beta,
  delta,
  gamma,
  grain: 0.01,
  range: 3
};

describe('QuestStaircase', () => {
  it('converges on a synthetic observer threshold', () => {
    const prng = mulberry32(42);
    const staircase = new QuestStaircase(params);
    const tTrue = -1.2;
    const trialCount = 100;

    for (let trial = 0; trial < trialCount; trial += 1) {
      const x = staircase.nextIntensity();
      const probabilityCorrect =
        gamma + (1 - gamma - delta) * (1 - Math.exp(-Math.pow(10, beta * (x - tTrue))));
      staircase.record(x, prng() < probabilityCorrect);
    }

    expect(Math.abs(staircase.estimate().thresholdLog10 - tTrue)).toBeLessThanOrEqual(0.15);
    expect(staircase.trialCount()).toBe(trialCount);
  });

  it('rejects a non-positive guessed threshold deviation', () => {
    expect(() => new QuestStaircase({ ...params, tGuessSd: 0 })).toThrow(
      'Invalid QUEST params: require tGuessSd > 0.'
    );
  });
});
