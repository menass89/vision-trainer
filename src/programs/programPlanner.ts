import { conditionKey } from '../core/displayCalibration';
import { uuid } from '../core/uuid';
import type { ContrastCondition } from '../tasks/contrastDetection';
import { getParadigmModule } from '../tasks/paradigmRegistry';
import { populationNormContrast } from '../session/sessionPlanner';
import type { GoalType, Orientation, ParadigmId, PlannedBlock, ThresholdEstimate } from '../types';
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
    let availableConditions = paradigmConditions;
    for (let i = 0; i < blockCount; i += 1) {
      if (availableConditions.length === 0) {
        availableConditions = paradigmConditions;
      }
      const condition = selectDeficitCondition(thresholds, availableConditions);
      blocks.push(
        createPlannedBlock(
          `Training ${String.fromCharCode(65 + blockIndex)}`,
          { ...condition, trialsPerBlock: config.trialsPerBlock },
          'training'
        )
      );
      availableConditions = availableConditions.filter((candidate) => candidate !== condition);
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

function selectDeficitCondition(
  thresholds: ThresholdEstimate[],
  conditions: ContrastCondition[]
): ContrastCondition {
  const latestByKey = new Map<string, ThresholdEstimate>();
  for (const threshold of thresholds) {
    const current = latestByKey.get(threshold.conditionKey);
    if (!current || threshold.createdAt > current.createdAt) {
      latestByKey.set(threshold.conditionKey, threshold);
    }
  }

  const exactThresholdFor = (condition: ContrastCondition): ThresholdEstimate | undefined => {
    const fullKey = conditionKey(
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
    return [fullKey, durationLegacyKey, legacyKey]
      .map((key) => latestByKey.get(key))
      .filter((value): value is ThresholdEstimate => Boolean(value))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  };
  const nearestThresholdFor = (condition: ContrastCondition): ThresholdEstimate | undefined => {
    const exact = exactThresholdFor(condition);
    if (exact) return exact;

    return thresholds
      .filter((threshold) => threshold.paradigm === condition.paradigm)
      .sort((a, b) => {
        const distanceA = Math.abs(a.spatialFrequencyCpd - condition.spatialFrequencyCpd);
        const distanceB = Math.abs(b.spatialFrequencyCpd - condition.spatialFrequencyCpd);
        return distanceA - distanceB || b.createdAt.localeCompare(a.createdAt);
      })[0];
  };

  const unseen = conditions.filter((condition) => nearestThresholdFor(condition) === undefined);
  if (unseen.length > 0) {
    return unseen[Math.floor(Math.random() * unseen.length)];
  }

  let worst: ContrastCondition | null = null;
  let worstScore = -Infinity;
  for (const condition of conditions) {
    const threshold = nearestThresholdFor(condition);
    if (!threshold) continue;
    const sourceNorm = populationNormContrast(threshold.spatialFrequencyCpd, threshold.paradigm);
    const targetNorm = populationNormContrast(condition.spatialFrequencyCpd, condition.paradigm);
    if (!Number.isFinite(sourceNorm) || !Number.isFinite(targetNorm) || sourceNorm <= 0 || targetNorm <= 0) {
      continue;
    }
    const projectedThreshold = threshold.thresholdContrast * (targetNorm / sourceNorm);
    const score = projectedThreshold / targetNorm;
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
