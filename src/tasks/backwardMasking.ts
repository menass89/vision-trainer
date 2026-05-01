import type { GaborStimulus, TrialInterval, TrialRecord } from '../types';
import { QuestStaircase } from '../psychophysics/quest';
import {
  buildTrialRecord as buildContrastTrialRecord,
  type ContrastCondition,
  type ContrastTrialPlan
} from './contrastDetection';

const STARTING_ISI_MS = 240;
const MIN_ISI_MS = 40;

export const BACKWARD_MASKING_CONDITIONS: ContrastCondition[] = [
  { paradigm: 'backward-masking', spatialFrequencyCpd: 1.5, orientationDeg: 0, trialsPerBlock: 40 },
  { paradigm: 'backward-masking', spatialFrequencyCpd: 3, orientationDeg: 45, trialsPerBlock: 40 },
  { paradigm: 'backward-masking', spatialFrequencyCpd: 6, orientationDeg: 90, trialsPerBlock: 40 },
  { paradigm: 'backward-masking', spatialFrequencyCpd: 12, orientationDeg: 135, trialsPerBlock: 40 }
];

export function createBackwardMaskingTrial(
  staircase: QuestStaircase,
  condition: ContrastCondition,
  blockId: string,
  trialIndex: number
): ContrastTrialPlan {
  const catchTrial = Math.random() < 0.05;
  const intensityLog10 = catchTrial || trialIndex === 0 ? Math.log10(STARTING_ISI_MS / 1000) : staircase.nextIntensity();
  const isiMs = Math.max(MIN_ISI_MS, Math.round(Math.pow(10, intensityLog10) * 1000));
  const targetInterval: TrialInterval = Math.random() < 0.5 ? 1 : 2;
  const baseStimulus: GaborStimulus = {
    spatialFrequencyCpd: condition.spatialFrequencyCpd,
    orientationDeg: condition.orientationDeg,
    contrast: 0.18,
    phaseRad: Math.random() * Math.PI * 2,
    durationMs: 50,
    backgroundLuminanceCdM2: 40
  };

  return {
    blockId,
    condition,
    trialIndex,
    targetInterval,
    intensityLog10,
    catchTrial,
    stimulus: baseStimulus,
    maskDelayMs: isiMs,
    maskInBothIntervals: true,
    maskStimulus: {
      ...baseStimulus,
      contrast: 0,
      durationMs: 80,
      mask: {
        enabled: true,
        kind: 'full-field',
        contrast: 0.55,
        elementCount: 1,
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
