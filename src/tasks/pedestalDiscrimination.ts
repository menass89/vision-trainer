import type { GaborStimulus, TrialInterval, TrialRecord } from '../types';
import { contrastFromLog10, QuestStaircase } from '../psychophysics/quest';
import {
  buildTrialRecord as buildContrastTrialRecord,
  resolvePositiveNumber,
  type ContrastCondition,
  type ContrastTrialPlan
} from './contrastDetection';

const PEDESTAL_CONTRAST = 0.1;

export const PEDESTAL_DISCRIMINATION_CONDITIONS: ContrastCondition[] = [
  { paradigm: 'pedestal-discrimination', spatialFrequencyCpd: 1.5, orientationDeg: 0, gaborSizeDeg: 4, trialsPerBlock: 40 },
  { paradigm: 'pedestal-discrimination', spatialFrequencyCpd: 3, orientationDeg: 45, gaborSizeDeg: 4, trialsPerBlock: 40 },
  { paradigm: 'pedestal-discrimination', spatialFrequencyCpd: 6, orientationDeg: 90, gaborSizeDeg: 4, trialsPerBlock: 40 },
  { paradigm: 'pedestal-discrimination', spatialFrequencyCpd: 12, orientationDeg: 135, gaborSizeDeg: 4, trialsPerBlock: 40 }
];

export function createPedestalDiscriminationTrial(
  staircase: QuestStaircase,
  condition: ContrastCondition,
  blockId: string,
  trialIndex: number
): ContrastTrialPlan {
  const catchTrial = Math.random() < 0.05;
  const intensityLog10 = catchTrial ? -0.7 : staircase.nextIntensity();
  const increment = contrastFromLog10(intensityLog10) * 0.2;
  const targetInterval: TrialInterval = Math.random() < 0.5 ? 1 : 2;
  const durationMs = resolvePositiveNumber(condition.durationMs, 80);
  const gaborSizeDeg = resolvePositiveNumber(condition.gaborSizeDeg, 4);
  const comparisonStimulus: GaborStimulus = {
    spatialFrequencyCpd: condition.spatialFrequencyCpd,
    orientationDeg: condition.orientationDeg,
    contrast: PEDESTAL_CONTRAST,
    phaseRad: Math.random() * Math.PI * 2,
    durationMs,
    gaborSizeDeg,
    backgroundLuminanceCdM2: 40
  };

  return {
    blockId,
    condition: { ...condition, durationMs, gaborSizeDeg },
    trialIndex,
    targetInterval,
    intensityLog10,
    catchTrial,
    comparisonStimulus,
    stimulus: {
      ...comparisonStimulus,
      contrast: Math.min(0.9, PEDESTAL_CONTRAST + increment)
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
