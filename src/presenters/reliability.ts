import type { SessionLog, ThresholdEstimate } from '@/types';

export type MeasurementConfidenceTier = 'provisional' | 'reliable' | 'needs-retest';

export type MeasurementConfidenceView = {
  tier: MeasurementConfidenceTier;
  label: string;
  detail: string;
  canDriveTrend: boolean;
  baselineStep: number;
  baselineTarget: number;
  latestSessionSuspicious: boolean;
};

const RELIABLE_SESSION_COUNT = 3;
const MAX_USABLE_LAPSE_RATE = 0.15;
const MAX_USABLE_CI_RATIO = 8;
const MIN_USABLE_TRIALS = 10;

export function isThresholdSuspicious(threshold: ThresholdEstimate): boolean {
  const ciRatio = threshold.ciLow > 0 ? threshold.ciHigh / threshold.ciLow : Number.POSITIVE_INFINITY;
  return (
    threshold.trialCount < MIN_USABLE_TRIALS ||
    threshold.lapseRate > MAX_USABLE_LAPSE_RATE ||
    threshold.ciLow <= 0 ||
    ciRatio > MAX_USABLE_CI_RATIO
  );
}

export function usableThresholds(thresholds: ThresholdEstimate[]): ThresholdEstimate[] {
  return thresholds.filter((threshold) => !isThresholdSuspicious(threshold));
}

export function humanBandLabel(spatialFrequencyCpd: number): string {
  if (spatialFrequencyCpd <= 1.5) return 'Broad shapes';
  if (spatialFrequencyCpd <= 6) return 'Everyday detail';
  return 'Fine detail';
}

function completedSessionsWithUsableThresholds(
  sessions: SessionLog[],
  thresholds: ThresholdEstimate[]
): SessionLog[] {
  const usableSessionIds = new Set(usableThresholds(thresholds).map((threshold) => threshold.sessionId));
  return sessions.filter((session) => session.status === 'completed' && usableSessionIds.has(session.id));
}

function latestCompletedSessionId(sessions: SessionLog[]): string | null {
  return [...sessions]
    .filter((session) => session.status === 'completed')
    .sort((a, b) => (b.completedAt ?? b.startedAt).localeCompare(a.completedAt ?? a.startedAt))[0]?.id ?? null;
}

export function deriveMeasurementConfidence(
  sessions: SessionLog[],
  thresholds: ThresholdEstimate[],
  latestSessionId = latestCompletedSessionId(sessions)
): MeasurementConfidenceView {
  const latestThresholds = latestSessionId
    ? thresholds.filter((threshold) => threshold.sessionId === latestSessionId)
    : [];
  const latestSessionSuspicious =
    latestThresholds.length > 0 && latestThresholds.some(isThresholdSuspicious);
  const usableSessionCount = completedSessionsWithUsableThresholds(sessions, thresholds).length;
  const baselineStep = Math.min(usableSessionCount, RELIABLE_SESSION_COUNT);
  const remaining = Math.max(0, RELIABLE_SESSION_COUNT - baselineStep);

  if (latestSessionSuspicious) {
    return {
      tier: 'needs-retest',
      label: 'Retest recommended',
      detail: 'This reading should be repeated before it counts toward your trend.',
      canDriveTrend: false,
      baselineStep,
      baselineTarget: RELIABLE_SESSION_COUNT,
      latestSessionSuspicious: true,
    };
  }

  if (usableSessionCount < RELIABLE_SESSION_COUNT) {
    return {
      tier: 'provisional',
      label: `Building baseline ${baselineStep}/${RELIABLE_SESSION_COUNT}`,
      detail: `${remaining} more clean session${remaining === 1 ? '' : 's'} before trends become reliable.`,
      canDriveTrend: false,
      baselineStep,
      baselineTarget: RELIABLE_SESSION_COUNT,
      latestSessionSuspicious: false,
    };
  }

  return {
    tier: 'reliable',
    label: 'Reliable reading',
    detail: 'Enough clean sessions are available to compare your trend.',
    canDriveTrend: true,
    baselineStep,
    baselineTarget: RELIABLE_SESSION_COUNT,
    latestSessionSuspicious: false,
  };
}
