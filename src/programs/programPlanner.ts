import { conditionKey } from '../core/displayCalibration';
import type { ContrastCondition } from '../tasks/contrastDetection';
import { getParadigmModule } from '../tasks/paradigmRegistry';
import type { PlannedBlock } from '../session/sessionPlanner';
import type { GoalType, Orientation, ParadigmId, ThresholdEstimate } from '../types';
import { computeDurationMs, getPhaseForSession, getProgramConfig } from './programConfig';

export function planProgramSession(
  goalType: GoalType,
  sessionNumber: number,
  thresholds: ThresholdEstimate[]
): PlannedBlock[] {
  const config = getProgramConfig(goalType);
  const phase = getPhaseForSession(config, sessionNumber);
  const durationMs = computeDurationMs(config, sessionNumber);

  const conditions = buildConditionPool(config.spatialFrequencies, config.orientations, phase.paradigms, durationMs);

  const warmUpCondition = conditions.find((condition) => condition.paradigm === 'contrast-detection') ?? conditions[0];
  const blocks: PlannedBlock[] = [
    createPlannedBlock('Warm-up', { ...warmUpCondition, trialsPerBlock: 20 }, 'warm-up')
  ];

  const trainingBudget = config.trialsPerSession - 50;
  const paradigmTrials = distributeTrials(phase.paradigmWeights, trainingBudget, config.trialsPerBlock);

  let blockIndex = 0;
  for (const [paradigmId, trials] of paradigmTrials) {
    const paradigmConditions = conditions.filter((condition) => condition.paradigm === paradigmId);
    if (paradigmConditions.length === 0) continue;

    const blockCount = Math.max(1, Math.round(trials / config.trialsPerBlock));
    for (let i = 0; i < blockCount; i += 1) {
      const condition = selectDeficitCondition(thresholds, paradigmConditions);
      blocks.push(createPlannedBlock(`Training ${String.fromCharCode(65 + blockIndex)}`, condition, 'training'));
      blockIndex += 1;
    }
  }

  const assessCondition = selectDeficitCondition(thresholds, conditions);
  blocks.push(createPlannedBlock('Assessment', { ...assessCondition, trialsPerBlock: 30 }, 'assessment'));

  return blocks;
}

function buildConditionPool(
  spatialFrequencies: number[],
  orientations: Orientation[],
  paradigms: ParadigmId[],
  durationMs: number
): ContrastCondition[] {
  const conditions: ContrastCondition[] = [];
  for (const paradigm of paradigms) {
    const module = getParadigmModule(paradigm);
    for (const spatialFrequencyCpd of spatialFrequencies) {
      for (const orientationDeg of orientations) {
        const existing = module.conditions.find(
          (condition) =>
            condition.spatialFrequencyCpd === spatialFrequencyCpd && condition.orientationDeg === orientationDeg
        );
        if (existing) {
          conditions.push({ ...existing, durationMs });
        }
      }
    }
  }
  return conditions;
}

function distributeTrials(
  weights: Partial<Record<ParadigmId, number>>,
  totalTrials: number,
  blockSize: number
): Array<[ParadigmId, number]> {
  const entries = Object.entries(weights) as Array<[ParadigmId, number]>;
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  return entries.map(([paradigm, weight]) => {
    const raw = (weight / totalWeight) * totalTrials;
    const rounded = Math.round(raw / blockSize) * blockSize;
    return [paradigm, Math.max(blockSize, rounded)];
  });
}

function selectDeficitCondition(
  thresholds: ThresholdEstimate[],
  conditions: ContrastCondition[]
): ContrastCondition {
  if (thresholds.length === 0) return conditions[0];

  const latestByKey = new Map<string, ThresholdEstimate>();
  for (const threshold of thresholds) {
    latestByKey.set(threshold.conditionKey, threshold);
  }

  let worst: ContrastCondition | null = null;
  let worstScore = -Infinity;
  for (const condition of conditions) {
    const key = conditionKey(condition.spatialFrequencyCpd, condition.orientationDeg, condition.paradigm);
    const threshold = latestByKey.get(key);
    const score = threshold ? threshold.thresholdContrast : 1;
    if (score > worstScore) {
      worstScore = score;
      worst = condition;
    }
  }
  return worst ?? conditions[0];
}

function createPlannedBlock(
  label: string,
  condition: ContrastCondition,
  role: PlannedBlock['role']
): PlannedBlock {
  return {
    id: `block-${crypto.randomUUID()}`,
    label,
    paradigm: condition.paradigm,
    condition,
    role
  };
}
