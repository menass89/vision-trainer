import type { EyeMode, ParadigmId, SessionLog, SessionType, ThresholdEstimate } from '../types';
import { conditionKey } from '../core/displayCalibration';
import { type ContrastCondition } from '../tasks/contrastDetection';
import { PARADIGM_LIBRARY, getParadigmModule } from '../tasks/paradigmRegistry';

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

export function planSession(sessionsCompleted: number, thresholds: ThresholdEstimate[]): PlannedBlock[] {
  const availableParadigms = paradigmsForSession(sessionsCompleted + 1);
  const conditionPool = availableParadigms.flatMap((paradigm) => {
    const module = getParadigmModule(paradigm);
    const trainedSessions = sessionsOnParadigm(thresholds, paradigm);
    const frequencyCount = Math.min(module.conditions.length, Math.max(1, trainedSessions + 1));
    return module.conditions.slice(0, frequencyCount);
  });
  const warmUp = getParadigmModule('contrast-detection').conditions[0];
  const blocks: PlannedBlock[] = [
    createBlock('Warm-up', { ...warmUp, trialsPerBlock: 10 }, 'warm-up')
  ];

  let previousKey = blockConditionKey(blocks[0].condition);
  for (const label of ['Training A', 'Training B', 'Training C']) {
    const condition = selectDeficitCondition(thresholds, conditionPool, previousKey);
    blocks.push(createBlock(label, { ...condition, trialsPerBlock: 32 }, 'training'));
    previousKey = blockConditionKey(condition);
  }

  const assessmentCondition = selectDeficitCondition(thresholds, conditionPool, previousKey);
  blocks.push(createBlock('Cool-down assessment', { ...assessmentCondition, trialsPerBlock: 16 }, 'assessment'));

  return blocks;
}

export function planDichopticSession(sessionsCompleted: number): PlannedBlock[] {
  const baseCondition = {
    ...getParadigmModule('dichoptic-contrast').conditions[Math.min(3, Math.max(0, sessionsCompleted - 5) % 4)],
    trialsPerBlock: 28
  };
  const warmUp = { ...getParadigmModule('contrast-detection').conditions[0], trialsPerBlock: 8 };
  return [
    createBlock('Warm-up', warmUp, 'warm-up'),
    createBlock('Two-eye Training A', baseCondition, 'training'),
    createBlock('Two-eye Training B', { ...baseCondition, orientationDeg: 90 }, 'training'),
    createBlock('Balance Check', { ...baseCondition, trialsPerBlock: 14 }, 'assessment')
  ];
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

function paradigmsForSession(sessionNumber: number): ParadigmId[] {
  const milestones: Array<[number, ParadigmId]> = [
    [1, 'contrast-detection'],
    [6, 'lateral-masking'],
    [11, 'spatial-masking'],
    [16, 'backward-masking'],
    [21, 'pedestal-discrimination']
  ];
  return milestones
    .filter(([firstSession]) => sessionNumber >= firstSession)
    .map(([, paradigm]) => paradigm);
}

function sessionsOnParadigm(thresholds: ThresholdEstimate[], paradigm: ParadigmId): number {
  const sessionIds = new Set(
    thresholds
      .filter((threshold) => threshold.paradigm === paradigm)
      .map((threshold) => threshold.sessionId)
  );
  return sessionIds.size;
}

function selectDeficitCondition(
  thresholds: ThresholdEstimate[],
  conditions: ContrastCondition[],
  previousKey?: string
): ContrastCondition {
  const latestByCondition = new Map<string, ThresholdEstimate>();
  for (const threshold of thresholds) {
    latestByCondition.set(threshold.conditionKey, threshold);
  }

  const ranked = [...conditions].sort((a, b) => {
    return deficitScore(b, latestByCondition) - deficitScore(a, latestByCondition);
  });
  return ranked.find((condition) => blockConditionKey(condition) !== previousKey) ?? ranked[0];
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

export function activeParadigmsForSession(sessionsCompleted: number): ParadigmId[] {
  const active = new Set(paradigmsForSession(sessionsCompleted + 1));
  return PARADIGM_LIBRARY
    .filter((module) => active.has(module.id))
    .map((module) => module.id);
}
