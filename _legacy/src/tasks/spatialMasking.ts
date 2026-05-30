import type { TrialInterval, TrialRecord } from '../types';
import { contrastFromLog10, QuestStaircase } from '../psychophysics/quest';
import {
  buildTrialRecord as buildContrastTrialRecord,
  resolvePositiveNumber,
  type ContrastCondition,
  type ContrastTrialPlan
} from './contrastDetection';

export const SPATIAL_MASKING_CONDITIONS: ContrastCondition[] = [
  { paradigm: 'spatial-masking', spatialFrequencyCpd: 1.5, orientationDeg: 0, gaborSizeDeg: 4, trialsPerBlock: 40 },
  { paradigm: 'spatial-masking', spatialFrequencyCpd: 3, orientationDeg: 45, gaborSizeDeg: 4, trialsPerBlock: 40 },
  { paradigm: 'spatial-masking', spatialFrequencyCpd: 6, orientationDeg: 90, gaborSizeDeg: 4, trialsPerBlock: 40 },
  { paradigm: 'spatial-masking', spatialFrequencyCpd: 12, orientationDeg: 135, gaborSizeDeg: 4, trialsPerBlock: 40 }
];

export function createSpatialMaskingTrial(
  staircase: QuestStaircase,
  condition: ContrastCondition,
  blockId: string,
  trialIndex: number
): ContrastTrialPlan {
  const catchTrial = Math.random() < 0.05;
  const intensityLog10 = catchTrial ? -0.2 : staircase.nextIntensity();
  const targetInterval: TrialInterval = Math.random() < 0.5 ? 1 : 2;
  const durationMs = resolvePositiveNumber(condition.durationMs, 70);
  const gaborSizeDeg = resolvePositiveNumber(condition.gaborSizeDeg, 4);

  return {
    blockId,
    condition: { ...condition, durationMs, gaborSizeDeg },
    trialIndex,
    targetInterval,
    intensityLog10,
    catchTrial,
    stimulus: {
      spatialFrequencyCpd: condition.spatialFrequencyCpd,
      orientationDeg: condition.orientationDeg,
      contrast: contrastFromLog10(intensityLog10),
      phaseRad: Math.random() * Math.PI * 2,
      durationMs,
      gaborSizeDeg,
      backgroundLuminanceCdM2: 40,
      mask: {
        enabled: true,
        kind: 'surround',
        contrast: 0.35,
        elementCount: 12,
        seed: Math.random() * 1000
      }
    }
  };
}

export function buildTrialRecord(
  sessionId: string,
  plan: ContrastTrialPlan,
  responseInterval: TrialInterval | null,
  reactionTimeMs: number | null
): TrialRecord {
  return buildContrastTrialRecord(sessionId, plan, responseInterval, reactionTimeMs);
}
