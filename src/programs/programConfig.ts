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
  trialsPerSession: 250,
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
  trialsPerSession: 250,
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
  trialsPerSession: 250,
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
  return config;
}

export function getPhaseForSession(config: ProgramConfig, sessionNumber: number): ProgramPhase {
  for (const phase of config.phases) {
    if (sessionNumber >= phase.sessionRange[0] && sessionNumber <= phase.sessionRange[1]) {
      return phase;
    }
  }
  return config.phases[config.phases.length - 1];
}

export function computeDurationMs(config: ProgramConfig, sessionNumber: number): number {
  const reductions = Math.floor(Math.max(0, sessionNumber - 2) / 3);
  return Math.max(config.durationFloorMs, config.durationStartMs - reductions * config.durationStepMs);
}
