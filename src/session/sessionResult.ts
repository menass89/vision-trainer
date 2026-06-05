import { conditionKey } from '@/core/displayCalibration';
import { uuid } from '@/core/uuid';
import { contrastFromLog10 } from '@/psychophysics/quest';
import type { QuestEstimate } from '@/psychophysics/quest';
import type { Orientation, PlannedBlock, SessionLog, ThresholdEstimate } from '@/types';

export const GUIDED_STIM_DURATION_MS = 150;

export type BlockThresholdInput = {
  sessionId: string;
  blockId: string;
  spatialFrequencyCpd: number;
  orientationDeg: Orientation;
  durationMs?: number;
  estimate: QuestEstimate;
  gaborSizeDeg?: number;
  trialCount: number;
  lapseRate: number;
  createdAtIso: string;
};

export function buildBlockThreshold(input: BlockThresholdInput): ThresholdEstimate {
  return {
    id: `threshold-${uuid()}`,
    sessionId: input.sessionId,
    blockId: input.blockId,
    conditionKey: conditionKey(
      input.spatialFrequencyCpd,
      input.orientationDeg,
      'contrast-detection',
      input.durationMs ?? GUIDED_STIM_DURATION_MS,
      input.gaborSizeDeg
    ),
    paradigm: 'contrast-detection',
    spatialFrequencyCpd: input.spatialFrequencyCpd,
    orientationDeg: input.orientationDeg,
    thresholdContrast: contrastFromLog10(input.estimate.thresholdLog10),
    thresholdLog10: input.estimate.thresholdLog10,
    ciLow: contrastFromLog10(input.estimate.ciLowLog10),
    ciHigh: contrastFromLog10(input.estimate.ciHighLog10),
    trialCount: input.trialCount,
    lapseRate: input.lapseRate,
    createdAt: input.createdAtIso,
  };
}

export type GuidedSessionLogInput = {
  id: string;
  startedAtIso: string;
  completedAtIso: string;
  calibrationId: string;
  plannedBlocks: PlannedBlock[];
  completedTrials: number;
};

export function buildGuidedSessionLog(input: GuidedSessionLogInput): SessionLog {
  return {
    id: input.id,
    startedAt: input.startedAtIso,
    completedAt: input.completedAtIso,
    status: 'completed',
    eyeMode: 'both',
    sessionType: 'guided',
    calibrationId: input.calibrationId,
    protocolVersion: 'mvp-0.2',
    plannedBlocks: input.plannedBlocks,
    completedTrials: input.completedTrials,
    metadata: { targetSessionMinutes: 30, targetCadencePerWeek: 3 },
  };
}
