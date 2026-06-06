import { conditionKey } from '@/core/displayCalibration';
import { uuid } from '@/core/uuid';
import type { QuestParameters } from '@/psychophysics/quest';
import { planSession } from '@/session/sessionPlanner';
import { populationNormContrast } from '@/progress/norms';
import type { ContrastCondition, GoalType, PlannedBlock, ThresholdEstimate } from '@/types';

import {
  FIRST_SESSION_QUEST_PARAMS,
  FIRST_VISIBLE_STIM_DURATION_MS,
  SECOND_VISIBLE_STIM_DURATION_MS,
} from './calibrationQuest';
import { GUIDED_STIM_DURATION_MS } from './sessionResult';

export type GuidedSessionBlock = {
  id: string;
  label: string;
  condition: ContrastCondition;
  role: PlannedBlock['role'];
  trialsPerBlock: number;
  questParams: QuestParameters;
  showBreak: boolean;
  plannedBlock: PlannedBlock;
};

export type GuidedSessionPlanInput = {
  sessionsCompleted: number;
  thresholds: ThresholdEstimate[];
  visionGoal: GoalType | 'unspecified';
};

const POST_BASELINE_FALLBACK_GOAL: GoalType = 'sports-vision';
const THRESHOLD_LOCKED_SD = 0.18;
const THRESHOLD_LOCKED_RANGE = 0.9;

function firstSessionBlocks(): GuidedSessionBlock[] {
  const firstBlocks: Array<{
    condition: ContrastCondition;
    label: string;
    role: PlannedBlock['role'];
    questParams: QuestParameters;
  }> = [
    {
      condition: {
        paradigm: 'contrast-detection',
        spatialFrequencyCpd: 1,
        orientationDeg: 0,
        trialsPerBlock: 10,
        durationMs: FIRST_VISIBLE_STIM_DURATION_MS,
        gaborSizeDeg: 8,
      },
      label: 'Calibration · 1 cpd',
      role: 'warm-up',
      questParams: FIRST_SESSION_QUEST_PARAMS[0],
    },
    {
      condition: {
        paradigm: 'contrast-detection',
        spatialFrequencyCpd: 2,
        orientationDeg: 90,
        trialsPerBlock: 10,
        durationMs: SECOND_VISIBLE_STIM_DURATION_MS,
        gaborSizeDeg: 6,
      },
      label: 'Calibration · 2 cpd',
      role: 'assessment',
      questParams: FIRST_SESSION_QUEST_PARAMS[1],
    },
  ];

  return firstBlocks.map((block) => {
    const id = `block-${uuid()}`;
    const plannedBlock = createPlannedBlock(id, block.label, block.condition, block.role);

    return {
      id,
      label: block.label,
      condition: block.condition,
      role: block.role,
      trialsPerBlock: block.condition.trialsPerBlock,
      questParams: block.questParams,
      showBreak: false,
      plannedBlock,
    };
  });
}

export function buildGuidedSessionBlocks(input: GuidedSessionPlanInput): GuidedSessionBlock[] {
  if (input.sessionsCompleted === 0) return firstSessionBlocks();

  const goal = input.visionGoal === 'unspecified' ? POST_BASELINE_FALLBACK_GOAL : input.visionGoal;
  return planSession(input.sessionsCompleted, input.thresholds, goal).map((plannedBlock) => ({
    id: plannedBlock.id,
    label: plannedBlock.label,
    condition: plannedBlock.condition,
    role: plannedBlock.role,
    trialsPerBlock: plannedBlock.condition.trialsPerBlock,
    questParams: questParamsForCondition(plannedBlock.condition, input.thresholds),
    showBreak: true,
    plannedBlock,
  }));
}

export function questParamsForCondition(
  condition: ContrastCondition,
  thresholds: ThresholdEstimate[]
): QuestParameters {
  const source = bestThresholdForCondition(condition, thresholds);
  const tGuess = source
    ? projectThresholdToCondition(source, condition)
    : Math.log10(populationNormContrast(condition.spatialFrequencyCpd, condition.paradigm));

  return {
    tGuess,
    tGuessSd: THRESHOLD_LOCKED_SD,
    pThreshold: 0.79,
    beta: 3.5,
    delta: 0.03,
    gamma: 0.5,
    grain: 0.01,
    range: THRESHOLD_LOCKED_RANGE,
  };
}

function bestThresholdForCondition(
  condition: ContrastCondition,
  thresholds: ThresholdEstimate[]
): ThresholdEstimate | null {
  const sorted = [...thresholds].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const keys = [
    conditionKey(
      condition.spatialFrequencyCpd,
      condition.orientationDeg,
      condition.paradigm,
      condition.durationMs,
      condition.gaborSizeDeg
    ),
    conditionKey(
      condition.spatialFrequencyCpd,
      condition.orientationDeg,
      condition.paradigm,
      condition.durationMs
    ),
    conditionKey(condition.spatialFrequencyCpd, condition.orientationDeg, condition.paradigm),
  ];
  const exact = sorted.find((threshold) => keys.includes(threshold.conditionKey));
  if (exact) return exact;

  const sameParadigm = sorted.filter((threshold) => threshold.paradigm === condition.paradigm);
  const pool = sameParadigm.length > 0 ? sameParadigm : sorted;
  return pool.sort((a, b) => {
    const distanceA = Math.abs(a.spatialFrequencyCpd - condition.spatialFrequencyCpd);
    const distanceB = Math.abs(b.spatialFrequencyCpd - condition.spatialFrequencyCpd);
    return distanceA - distanceB || b.createdAt.localeCompare(a.createdAt);
  })[0] ?? null;
}

function projectThresholdToCondition(
  source: ThresholdEstimate,
  condition: ContrastCondition
): number {
  const sourceNorm = populationNormContrast(source.spatialFrequencyCpd, source.paradigm);
  const targetNorm = populationNormContrast(condition.spatialFrequencyCpd, condition.paradigm);

  return source.thresholdLog10 + Math.log10(targetNorm / sourceNorm);
}

function createPlannedBlock(
  id: string,
  label: string,
  condition: ContrastCondition,
  role: PlannedBlock['role']
): PlannedBlock {
  return {
    id,
    label,
    paradigm: condition.paradigm,
    condition,
    role,
  };
}
