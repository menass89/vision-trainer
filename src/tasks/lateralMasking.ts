import type { TrialInterval, TrialRecord } from '../types';
import { contrastFromLog10, QuestStaircase } from '../psychophysics/quest';
import {
  buildTrialRecord as buildContrastTrialRecord,
  type ContrastCondition,
  type ContrastTrialPlan
} from './contrastDetection';

export const LATERAL_MASKING_CONDITIONS: ContrastCondition[] = [
  { paradigm: 'lateral-masking', spatialFrequencyCpd: 1.5, orientationDeg: 0, trialsPerBlock: 40 },
  { paradigm: 'lateral-masking', spatialFrequencyCpd: 3, orientationDeg: 45, trialsPerBlock: 40 },
  { paradigm: 'lateral-masking', spatialFrequencyCpd: 6, orientationDeg: 90, trialsPerBlock: 40 },
  { paradigm: 'lateral-masking', spatialFrequencyCpd: 12, orientationDeg: 135, trialsPerBlock: 40 }
];

export function createLateralMaskingTrial(
  staircase: QuestStaircase,
  condition: ContrastCondition,
  blockId: string,
  trialIndex: number
): ContrastTrialPlan {
  const catchTrial = Math.random() < 0.05;
  const intensityLog10 = catchTrial ? -0.2 : staircase.nextIntensity();
  const targetInterval: TrialInterval = Math.random() < 0.5 ? 1 : 2;

  return {
    blockId,
    condition,
    trialIndex,
    targetInterval,
    intensityLog10,
    catchTrial,
    stimulus: {
      spatialFrequencyCpd: condition.spatialFrequencyCpd,
      orientationDeg: condition.orientationDeg,
      contrast: contrastFromLog10(intensityLog10),
      phaseRad: Math.random() * Math.PI * 2,
      durationMs: 60,
      backgroundLuminanceCdM2: 40,
      flanker: {
        enabled: true,
        mode: 'collinear',
        distanceLambda: 3.5,
        contrast: 0.6
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
