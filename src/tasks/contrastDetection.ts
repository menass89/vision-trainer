import type { GaborStimulus, Orientation, ParadigmId, TrialInterval, TrialRecord } from '../types';
import { conditionKey } from '../core/displayCalibration';
import { uuid } from '../core/uuid';
import { contrastFromLog10, QuestStaircase } from '../psychophysics/quest';

export type ContrastCondition = {
  paradigm: ParadigmId;
  spatialFrequencyCpd: number;
  orientationDeg: Orientation;
  trialsPerBlock: number;
  durationMs?: number;
  gaborSizeDeg?: number;
};

export const CONTRAST_DETECTION_CONDITIONS: ContrastCondition[] = [
  { paradigm: 'contrast-detection', spatialFrequencyCpd: 1.5, orientationDeg: 0, trialsPerBlock: 40 },
  { paradigm: 'contrast-detection', spatialFrequencyCpd: 3, orientationDeg: 45, trialsPerBlock: 40 },
  { paradigm: 'contrast-detection', spatialFrequencyCpd: 6, orientationDeg: 90, trialsPerBlock: 40 },
  { paradigm: 'contrast-detection', spatialFrequencyCpd: 12, orientationDeg: 135, trialsPerBlock: 40 }
];

export type ContrastTrialPlan = {
  blockId: string;
  condition: ContrastCondition;
  trialIndex: number;
  targetInterval: TrialInterval;
  stimulus: GaborStimulus;
  comparisonStimulus?: GaborStimulus;
  maskStimulus?: GaborStimulus;
  maskDelayMs?: number;
  maskInBothIntervals?: boolean;
  intensityLog10: number;
  catchTrial: boolean;
};

export function pickTrainingCondition(completedSessions: number): ContrastCondition {
  if (completedSessions < 3) {
    return CONTRAST_DETECTION_CONDITIONS[completedSessions % 2];
  }
  return CONTRAST_DETECTION_CONDITIONS[completedSessions % CONTRAST_DETECTION_CONDITIONS.length];
}

export function createContrastTrial(
  staircase: QuestStaircase,
  condition: ContrastCondition,
  blockId: string,
  trialIndex: number
): ContrastTrialPlan {
  const catchTrial = Math.random() < 0.05;
  const intensityLog10 = catchTrial ? -0.2 : staircase.nextIntensity();
  const contrast = contrastFromLog10(intensityLog10);
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
      contrast,
      phaseRad: Math.random() * Math.PI * 2,
      durationMs: condition.durationMs ?? 160,
      gaborSizeDeg: condition.gaborSizeDeg,
      backgroundLuminanceCdM2: 40
    }
  };
}

export function buildTrialRecord(
  sessionId: string,
  plan: ContrastTrialPlan,
  responseInterval: TrialInterval | null,
  reactionTimeMs: number | null
): TrialRecord {
  const correct = responseInterval === plan.targetInterval;
  return {
    id: `trial-${uuid()}`,
    sessionId,
    blockId: plan.blockId,
    paradigm: plan.condition.paradigm,
    conditionKey: conditionKey(
      plan.condition.spatialFrequencyCpd,
      plan.condition.orientationDeg,
      plan.condition.paradigm,
      plan.stimulus.durationMs,
      plan.stimulus.gaborSizeDeg
    ),
    trialIndex: plan.trialIndex,
    stimulus: plan.stimulus,
    targetInterval: plan.targetInterval,
    responseInterval,
    correct,
    reactionTimeMs,
    intensityLog10: plan.intensityLog10,
    catchTrial: plan.catchTrial,
    createdAt: new Date().toISOString()
  };
}
