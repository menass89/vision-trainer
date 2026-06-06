import type { GoalType, Orientation, ParadigmId } from '../types';

export type ProgramPhase = {
  sessionRange: [number, number];
  paradigms: ParadigmId[];
  paradigmWeights: Partial<Record<ParadigmId, number>>;
};

export type ProgramConfig = {
  goalType: GoalType;
  label: string;
  spatialFrequencies: number[];
  orientations: Orientation[];
  durationStartMs: number;
  durationFloorMs: number;
  durationStepMs: number;
  gaborSizeDeg: number;
  trialsPerSession: number;
  trialsPerBlock: number;
  phases: ProgramPhase[];
};

const MYOPIA_CONFIG: ProgramConfig = {
  goalType: 'myopia',
  label: 'Myopia Program',
  spatialFrequencies: [6, 12],
  orientations: [0, 45, 90, 135],
  durationStartMs: 160,
  durationFloorMs: 80,
  durationStepMs: 20,
  gaborSizeDeg: 4,
  trialsPerSession: 100,
  trialsPerBlock: 40,
  phases: [
    {
      sessionRange: [1, 2],
      paradigms: ['contrast-detection'],
      paradigmWeights: { 'contrast-detection': 1 }
    },
    {
      sessionRange: [3, 10],
      paradigms: ['lateral-masking', 'contrast-detection'],
      paradigmWeights: { 'lateral-masking': 0.7, 'contrast-detection': 0.3 }
    },
    {
      sessionRange: [11, 20],
      paradigms: ['lateral-masking', 'contrast-detection', 'backward-masking'],
      paradigmWeights: { 'lateral-masking': 0.5, 'contrast-detection': 0.2, 'backward-masking': 0.3 }
    },
    {
      sessionRange: [21, 30],
      paradigms: ['lateral-masking', 'contrast-detection', 'backward-masking'],
      paradigmWeights: { 'lateral-masking': 0.5, 'contrast-detection': 0.2, 'backward-masking': 0.3 }
    }
  ]
};

const PRESBYOPIA_CONFIG: ProgramConfig = {
  goalType: 'presbyopia',
  label: 'Presbyopia Program',
  spatialFrequencies: [3, 6],
  orientations: [0, 45, 90, 135],
  durationStartMs: 200,
  durationFloorMs: 100,
  durationStepMs: 20,
  gaborSizeDeg: 4,
  trialsPerSession: 100,
  trialsPerBlock: 40,
  phases: [
    {
      sessionRange: [1, 2],
      paradigms: ['contrast-detection'],
      paradigmWeights: { 'contrast-detection': 1 }
    },
    {
      sessionRange: [3, 5],
      paradigms: ['lateral-masking', 'contrast-detection'],
      paradigmWeights: { 'lateral-masking': 0.7, 'contrast-detection': 0.3 }
    },
    {
      sessionRange: [6, 20],
      paradigms: ['lateral-masking', 'contrast-detection', 'backward-masking'],
      paradigmWeights: { 'lateral-masking': 0.5, 'contrast-detection': 0.2, 'backward-masking': 0.3 }
    },
    {
      sessionRange: [21, 30],
      paradigms: ['lateral-masking', 'contrast-detection', 'backward-masking'],
      paradigmWeights: { 'lateral-masking': 0.4, 'contrast-detection': 0.2, 'backward-masking': 0.4 }
    }
  ]
};

const SPORTS_CONFIG: ProgramConfig = {
  goalType: 'sports-vision',
  label: 'Sports Vision Program',
  spatialFrequencies: [1.5, 3, 6, 12],
  orientations: [0, 45, 90, 135],
  durationStartMs: 120,
  durationFloorMs: 40,
  durationStepMs: 20,
  gaborSizeDeg: 3,
  trialsPerSession: 100,
  trialsPerBlock: 40,
  phases: [
    {
      sessionRange: [1, 2],
      paradigms: ['contrast-detection'],
      paradigmWeights: { 'contrast-detection': 1 }
    },
    {
      sessionRange: [3, 7],
      paradigms: ['contrast-detection', 'backward-masking'],
      paradigmWeights: { 'contrast-detection': 0.4, 'backward-masking': 0.6 }
    },
    {
      sessionRange: [8, 20],
      paradigms: ['contrast-detection', 'backward-masking', 'spatial-masking', 'pedestal-discrimination'],
      paradigmWeights: {
        'contrast-detection': 0.2,
        'backward-masking': 0.3,
        'spatial-masking': 0.25,
        'pedestal-discrimination': 0.25
      }
    },
    {
      sessionRange: [21, 30],
      paradigms: ['contrast-detection', 'backward-masking', 'spatial-masking', 'pedestal-discrimination'],
      paradigmWeights: {
        'contrast-detection': 0.2,
        'backward-masking': 0.3,
        'spatial-masking': 0.25,
        'pedestal-discrimination': 0.25
      }
    }
  ]
};

const PROGRAMS = new Map<GoalType, ProgramConfig>([
  ['myopia', MYOPIA_CONFIG],
  ['presbyopia', PRESBYOPIA_CONFIG],
  ['sports-vision', SPORTS_CONFIG]
]);

export function getProgramConfig(goalType: GoalType): ProgramConfig {
  const config = PROGRAMS.get(goalType);
  if (!config) {
    throw new Error(`Unknown goal type: ${goalType}`);
  }
  return {
    ...config,
    spatialFrequencies: [...config.spatialFrequencies],
    orientations: [...config.orientations],
    phases: config.phases.map((phase) => ({
      ...phase,
      sessionRange: [...phase.sessionRange] as [number, number],
      paradigms: [...phase.paradigms],
      paradigmWeights: { ...phase.paradigmWeights }
    }))
  };
}

function assertValidSessionNumber(sessionNumber: number): void {
  if (!Number.isFinite(sessionNumber) || !Number.isInteger(sessionNumber) || sessionNumber < 1) {
    throw new Error(`Invalid session number: ${sessionNumber}`);
  }
}

export function getPhaseForSession(config: ProgramConfig, sessionNumber: number): ProgramPhase {
  assertValidSessionNumber(sessionNumber);
  if (config.phases.length === 0) {
    throw new Error(`Program ${config.goalType} has no phases`);
  }
  const lastPhase = config.phases[config.phases.length - 1];
  if (sessionNumber < config.phases[0].sessionRange[0]) {
    return config.phases[0];
  }
  if (sessionNumber > lastPhase.sessionRange[1]) {
    return lastPhase;
  }
  for (const phase of config.phases) {
    if (sessionNumber >= phase.sessionRange[0] && sessionNumber <= phase.sessionRange[1]) {
      return phase;
    }
  }
  throw new Error(`No phase configured for session ${sessionNumber} in program ${config.goalType}`);
}

export function computeDurationMs(config: ProgramConfig, sessionNumber: number): number {
  assertValidSessionNumber(sessionNumber);
  const reductions = Math.floor(Math.max(0, sessionNumber - 2) / 3);
  return Math.max(config.durationFloorMs, config.durationStartMs - reductions * config.durationStepMs);
}
