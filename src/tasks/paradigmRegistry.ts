import type { ParadigmId, TrialInterval, TrialRecord } from '../types';
import type { QuestStaircase } from '../psychophysics/quest';
import {
  buildTrialRecord as buildContrastTrialRecord,
  CONTRAST_DETECTION_CONDITIONS,
  createContrastTrial,
  type ContrastCondition,
  type ContrastTrialPlan
} from './contrastDetection';
import {
  buildTrialRecord as buildLateralMaskingTrialRecord,
  createLateralMaskingTrial,
  LATERAL_MASKING_CONDITIONS
} from './lateralMasking';
import {
  buildTrialRecord as buildSpatialMaskingTrialRecord,
  createSpatialMaskingTrial,
  SPATIAL_MASKING_CONDITIONS
} from './spatialMasking';
import {
  BACKWARD_MASKING_CONDITIONS,
  buildTrialRecord as buildBackwardMaskingTrialRecord,
  createBackwardMaskingTrial
} from './backwardMasking';
import {
  buildTrialRecord as buildPedestalDiscriminationTrialRecord,
  createPedestalDiscriminationTrial,
  PEDESTAL_DISCRIMINATION_CONDITIONS
} from './pedestalDiscrimination';

export type ParadigmModule = {
  id: ParadigmId;
  label: string;
  status: 'active' | 'scaffolded';
  conditions: ContrastCondition[];
  createTrial: (
    staircase: QuestStaircase,
    condition: ContrastCondition,
    blockId: string,
    trialIndex: number
  ) => ContrastTrialPlan;
  buildTrialRecord: (
    sessionId: string,
    plan: ContrastTrialPlan,
    responseInterval: TrialInterval | null,
    reactionTimeMs: number | null
  ) => TrialRecord;
};

export const PARADIGM_LIBRARY: ParadigmModule[] = [
  {
    id: 'contrast-detection',
    label: 'Contrast Detection',
    status: 'active',
    conditions: CONTRAST_DETECTION_CONDITIONS,
    createTrial: createContrastTrial,
    buildTrialRecord: buildContrastTrialRecord
  },
  {
    id: 'lateral-masking',
    label: 'Lateral Masking',
    status: 'active',
    conditions: LATERAL_MASKING_CONDITIONS,
    createTrial: createLateralMaskingTrial,
    buildTrialRecord: buildLateralMaskingTrialRecord
  },
  {
    id: 'spatial-masking',
    label: 'Spatial Masking',
    status: 'active',
    conditions: SPATIAL_MASKING_CONDITIONS,
    createTrial: createSpatialMaskingTrial,
    buildTrialRecord: buildSpatialMaskingTrialRecord
  },
  {
    id: 'backward-masking',
    label: 'Backward Masking',
    status: 'active',
    conditions: BACKWARD_MASKING_CONDITIONS,
    createTrial: createBackwardMaskingTrial,
    buildTrialRecord: buildBackwardMaskingTrialRecord
  },
  {
    id: 'pedestal-discrimination',
    label: 'Pedestal Discrimination',
    status: 'active',
    conditions: PEDESTAL_DISCRIMINATION_CONDITIONS,
    createTrial: createPedestalDiscriminationTrial,
    buildTrialRecord: buildPedestalDiscriminationTrialRecord
  }
];

export const PARADIGM_BY_ID = new Map(PARADIGM_LIBRARY.map((module) => [module.id, module]));

export function getParadigmModule(id: ParadigmId): ParadigmModule {
  const module = PARADIGM_BY_ID.get(id);
  if (!module) {
    throw new Error(`Unknown paradigm ${id}`);
  }
  return module;
}
