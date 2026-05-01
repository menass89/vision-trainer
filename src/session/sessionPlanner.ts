import type { EyeMode, GoalType, ParadigmId, SessionLog, SessionType, ThresholdEstimate } from '../types';
import { conditionKey } from '../core/displayCalibration';
import { planProgramSession } from '../programs/programPlanner';
import { type ContrastCondition } from '../tasks/contrastDetection';
import { getParadigmModule } from '../tasks/paradigmRegistry';

export type PlannedBlock = {
  id: string;
  label: string;
  paradigm: ParadigmId;
  condition: ContrastCondition;
  role: 'warm-up' | 'training' | 'assessment';
};

export function createSessionLog(
  calibrationId: string,
  plannedBlocks: ParadigmId[] = ['contrast-detection'],
  eyeMode: EyeMode = 'both',
  sessionType: SessionType = 'guided'
): SessionLog {
  return {
    id: `session-${crypto.randomUUID()}`,
    startedAt: new Date().toISOString(),
    status: 'in-progress',
    eyeMode,
    sessionType,
    calibrationId,
    protocolVersion: 'mvp-0.1',
    plannedBlocks,
    completedTrials: 0,
    metadata: {
      targetSessionMinutes: 30,
      targetCadencePerWeek: 3
    }
  };
}

export function planSession(
  sessionsCompleted: number,
  thresholds: ThresholdEstimate[],
  goalType?: GoalType
): PlannedBlock[] {
  if (goalType) {
    return planProgramSession(goalType, sessionsCompleted + 1, thresholds);
  }

  const warmUp = getParadigmModule('contrast-detection').conditions[0];
  const blocks: PlannedBlock[] = [
    createBlock('Warm-up', { ...warmUp, trialsPerBlock: 10 }, 'warm-up')
  ];
  const deficitCondition = selectDeficitCondition(thresholds, getParadigmModule('contrast-detection').conditions);
  blocks.push(createBlock('Training A', { ...deficitCondition, trialsPerBlock: 40 }, 'training'));
  blocks.push(createBlock('Assessment', { ...deficitCondition, trialsPerBlock: 16 }, 'assessment'));
  return blocks;
}

function createBlock(
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

function selectDeficitCondition(
  thresholds: ThresholdEstimate[],
  conditions: ContrastCondition[]
): ContrastCondition {
  const latestByCondition = new Map<string, ThresholdEstimate>();
  for (const threshold of thresholds) {
    latestByCondition.set(threshold.conditionKey, threshold);
  }

  const ranked = [...conditions].sort((a, b) => {
    return deficitScore(b, latestByCondition) - deficitScore(a, latestByCondition);
  });
  return ranked[0];
}

function deficitScore(
  condition: ContrastCondition,
  latestByCondition: Map<string, ThresholdEstimate>
): number {
  const threshold = latestByCondition.get(blockConditionKey(condition));
  const expected = populationNormContrast(condition.spatialFrequencyCpd, condition.paradigm);
  const observed = threshold?.thresholdContrast ?? expected * 2;
  return observed / expected;
}

function blockConditionKey(condition: ContrastCondition): string {
  return conditionKey(condition.spatialFrequencyCpd, condition.orientationDeg, condition.paradigm);
}

function populationNormContrast(spatialFrequencyCpd: number, paradigm: ParadigmId): number {
  const baselineNorms = new Map<number, number>([
    [1.5, 0.018],
    [3, 0.012],
    [6, 0.016],
    [12, 0.04]
  ]);
  const paradigmMultiplier: Record<ParadigmId, number> = {
    'contrast-detection': 1,
    'lateral-masking': 1.25,
    'spatial-masking': 1.7,
    'backward-masking': 8,
    'pedestal-discrimination': 0.6,
    'dichoptic-contrast': 1.5
  };
  return (baselineNorms.get(spatialFrequencyCpd) ?? 0.03) * paradigmMultiplier[paradigm];
}
