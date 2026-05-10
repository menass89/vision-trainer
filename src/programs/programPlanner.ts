import { conditionKey } from '../core/displayCalibration';
import { uuid } from '../core/uuid';
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

  const conditions = buildConditionPool(
    config.spatialFrequencies,
    config.orientations,
    phase.paradigms,
    durationMs,
    config.gaborSizeDeg
  );
  if (conditions.length === 0) {
    throw new Error(`Program phase ${phase.sessionRange.join('-')} produced no matching conditions`);
  }

  const warmUpCondition = conditions.find((condition) => condition.paradigm === 'contrast-detection') ?? conditions[0];
  const blocks: PlannedBlock[] = [
    createPlannedBlock('Warm-up', { ...warmUpCondition, trialsPerBlock: 20 }, 'warm-up')
  ];

  const trainingBudget = config.trialsPerSession - 50;
  const paradigmTrials = distributeTrials(phase.paradigmWeights, trainingBudget, config.trialsPerBlock);

  let blockIndex = 0;
  for (const [paradigmId, trials] of paradigmTrials) {
    const paradigmConditions = conditions.filter((condition) => condition.paradigm === paradigmId);
    if (paradigmConditions.length === 0) {
      throw new Error(`Program phase ${phase.sessionRange.join('-')} has no conditions for ${paradigmId}`);
    }

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
  durationMs: number,
  gaborSizeDeg: number
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
          conditions.push({ ...existing, durationMs, gaborSizeDeg });
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
  const entries = (Object.entries(weights) as Array<[ParadigmId, number]>).filter(([, weight]) => weight > 0);
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (totalWeight <= 0) {
    throw new Error('Program phase has no positive paradigm weights');
  }

  const totalBlocks = Math.floor(totalTrials / blockSize);
  if (totalBlocks <= 0) {
    return [];
  }
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const allocations = new Map<ParadigmId, number>();
  let remainingBlocks = totalBlocks;

  if (remainingBlocks >= sorted.length) {
    for (const [paradigm] of sorted) {
      allocations.set(paradigm, 1);
      remainingBlocks -= 1;
    }
  } else {
    for (const [paradigm] of sorted.slice(0, remainingBlocks)) {
      allocations.set(paradigm, 1);
    }
    remainingBlocks = 0;
  }

  const remainders = sorted
    .filter(([paradigm]) => allocations.has(paradigm))
    .map(([paradigm, weight]) => {
      const raw = (weight / totalWeight) * totalBlocks;
      return { paradigm, fraction: raw - Math.floor(raw), weight };
    })
    .sort((a, b) => b.fraction - a.fraction || b.weight - a.weight);

  for (let i = 0; i < remainingBlocks; i += 1) {
    const target = remainders[i % remainders.length];
    allocations.set(target.paradigm, (allocations.get(target.paradigm) ?? 0) + 1);
  }

  return entries
    .map(([paradigm]) => [paradigm, (allocations.get(paradigm) ?? 0) * blockSize] as [ParadigmId, number])
    .filter(([, trials]) => trials > 0);
}

const PARADIGM_BASELINES = new Map<ParadigmId, Map<number, number>>([
  ['contrast-detection', new Map([[1.5, 0.018], [3, 0.012], [6, 0.016], [12, 0.04]])],
  ['lateral-masking', new Map([[1.5, 0.024], [3, 0.018], [6, 0.022], [12, 0.05]])],
  ['spatial-masking', new Map([[1.5, 0.024], [3, 0.018], [6, 0.022], [12, 0.05]])],
  ['backward-masking', new Map([[1.5, 0.030], [3, 0.024], [6, 0.030], [12, 0.06]])],
  ['pedestal-discrimination', new Map([[1.5, 0.022], [3, 0.016], [6, 0.020], [12, 0.045]])]
]);

const expectedContrast = (condition: ContrastCondition): number => {
  const paradigmMap = PARADIGM_BASELINES.get(condition.paradigm);
  return paradigmMap?.get(condition.spatialFrequencyCpd) ?? 0.03;
};

function selectDeficitCondition(
  thresholds: ThresholdEstimate[],
  conditions: ContrastCondition[]
): ContrastCondition {
  if (thresholds.length === 0) return conditions[0];

  const latestByKey = new Map<string, ThresholdEstimate>();
  for (const threshold of thresholds) {
    const current = latestByKey.get(threshold.conditionKey);
    if (!current || threshold.createdAt > current.createdAt) {
      latestByKey.set(threshold.conditionKey, threshold);
    }
  }

  let worst: ContrastCondition | null = null;
  let worstScore = -Infinity;
  for (const condition of conditions) {
    const key = conditionKey(
      condition.spatialFrequencyCpd,
      condition.orientationDeg,
      condition.paradigm,
      condition.durationMs,
      condition.gaborSizeDeg
    );
    const durationLegacyKey = conditionKey(
      condition.spatialFrequencyCpd,
      condition.orientationDeg,
      condition.paradigm,
      condition.durationMs
    );
    const legacyKey = conditionKey(condition.spatialFrequencyCpd, condition.orientationDeg, condition.paradigm);
    const threshold = latestByKey.get(key) ?? latestByKey.get(durationLegacyKey) ?? latestByKey.get(legacyKey);
    const expected = expectedContrast(condition);
    const observed = threshold?.thresholdContrast ?? expected * 2;
    const score = observed / expected;
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
    id: `block-${uuid()}`,
    label,
    paradigm: condition.paradigm,
    condition,
    role
  };
}
