import type { TrialInterval, TrialRecord } from '../types';
import { buildTrialRecord as buildContrastTrialRecord, createContrastTrial, type ContrastCondition, type ContrastTrialPlan } from './contrastDetection';
import type { QuestStaircase } from '../psychophysics/quest';

export const DICHOPTIC_CONTRAST_CONDITIONS: ContrastCondition[] = [
  { paradigm: 'dichoptic-contrast', spatialFrequencyCpd: 1.5, orientationDeg: 0, trialsPerBlock: 36 },
  { paradigm: 'dichoptic-contrast', spatialFrequencyCpd: 3, orientationDeg: 45, trialsPerBlock: 36 },
  { paradigm: 'dichoptic-contrast', spatialFrequencyCpd: 6, orientationDeg: 90, trialsPerBlock: 36 },
  { paradigm: 'dichoptic-contrast', spatialFrequencyCpd: 12, orientationDeg: 135, trialsPerBlock: 36 }
];

export function createDichopticContrastTrial(
  staircase: QuestStaircase,
  condition: ContrastCondition,
  blockId: string,
  trialIndex: number
): ContrastTrialPlan {
  const plan = createContrastTrial(staircase, condition, blockId, trialIndex);
  return {
    ...plan,
    stimulus: {
      ...plan.stimulus,
      dichopticMode: 'cyan-only',
      dichopticPartner: {
        mode: 'red-only',
        contrast: Math.min(0.8, Math.max(0.05, plan.stimulus.contrast * 2))
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
