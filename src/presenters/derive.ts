import { buildBeforeAfterCsf, buildLatestCsf, improvementPercent } from '@/progress/csf';
import { populationNormContrast } from '@/progress/norms';
import type { SessionLog, ThresholdEstimate } from '@/types';
import { computeStreak, localDayKeyFromIso, weekCompletion, weekdayShortFromIso } from '@/utils/clock';
import { todayIndex } from '@/utils/clock';

import type { PostSessionInsightView, ProgressView, TodayView, Verdict } from './types';

const TARGET_SENSITIVITY_MULTIPLIER = 1.15;
const RELIABLE_SESSION_COUNT = 3;
const MAX_USABLE_LAPSE_RATE = 0.15;
const MAX_USABLE_CI_RATIO = 8;
const MIN_USABLE_TRIALS = 10;

function round(value: number, dp: number): number {
  const factor = 10 ** dp;
  return Math.round((value + 1e-10) * factor) / factor;
}

function formatCpd(cpd: number): string {
  return Number.isInteger(cpd) ? String(cpd) : cpd.toFixed(1);
}

function peakSensitivity(points: { sensitivity: number }[]): number {
  return points.reduce((max, p) => (p.sensitivity > max ? p.sensitivity : max), 0);
}

function verdictFromPercent(percent: number): Verdict {
  if (percent > 2) return 'improving';
  if (percent < -2) return 'regressing';
  return 'holding';
}

function completedSessionDayKeys(sessions: SessionLog[]): string[] {
  return sessions
    .filter((session) => session.status === 'completed')
    .map((session) => localDayKeyFromIso(session.startedAt));
}

function latestThreshold(thresholds: ThresholdEstimate[]): ThresholdEstimate | null {
  return thresholds.reduce<ThresholdEstimate | null>((latest, candidate) => {
    if (!latest || candidate.createdAt > latest.createdAt) return candidate;
    return latest;
  }, null);
}

function completedSessionsWithThresholds(
  sessions: SessionLog[],
  thresholds: ThresholdEstimate[]
): SessionLog[] {
  const sessionIdsWithThresholds = new Set(thresholds.map((threshold) => threshold.sessionId));
  return sessions.filter(
    (session) => session.status === 'completed' && sessionIdsWithThresholds.has(session.id)
  );
}

function measuredBandsLabel(thresholds: ThresholdEstimate[]): string {
  const bands = [...new Set(thresholds.map((threshold) => threshold.spatialFrequencyCpd))]
    .sort((a, b) => a - b)
    .map(formatCpd);

  if (bands.length === 0) return 'No bands';
  if (bands.length === 1) return `${bands[0]} cpd`;
  return `${bands.slice(0, -1).join(', ')} and ${bands[bands.length - 1]} cpd`;
}

function hasSuspiciousQuality(thresholds: ThresholdEstimate[]): boolean {
  return thresholds.some((threshold) => {
    const ciRatio = threshold.ciLow > 0 ? threshold.ciHigh / threshold.ciLow : Number.POSITIVE_INFINITY;
    return (
      threshold.trialCount < MIN_USABLE_TRIALS ||
      threshold.lapseRate > MAX_USABLE_LAPSE_RATE ||
      ciRatio > MAX_USABLE_CI_RATIO
    );
  });
}

function previousMatchedThreshold(
  current: ThresholdEstimate,
  thresholds: ThresholdEstimate[]
): ThresholdEstimate | null {
  return thresholds
    .filter(
      (threshold) =>
        threshold.sessionId !== current.sessionId &&
        threshold.conditionKey === current.conditionKey &&
        threshold.createdAt < current.createdAt
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

function sessionDeltaPercent(
  sessionThresholds: ThresholdEstimate[],
  allThresholds: ThresholdEstimate[]
): number | null {
  const deltas = sessionThresholds.flatMap((current) => {
    const previous = previousMatchedThreshold(current, allThresholds);
    if (!previous) return [];
    const currentSensitivity = 1 / current.thresholdContrast;
    const previousSensitivity = 1 / previous.thresholdContrast;
    return ((currentSensitivity - previousSensitivity) / previousSensitivity) * 100;
  });

  if (deltas.length === 0) return null;
  return round(deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length, 0);
}

function deltaLabel(deltaPercent: number | null): PostSessionInsightView['deltaLabel'] {
  if (deltaPercent === null) return 'Uncertain';
  if (deltaPercent > 2) return 'Improving';
  if (deltaPercent < -2) return 'Dropped';
  return 'Steady';
}

export function derivePostSessionInsight(
  sessions: SessionLog[],
  thresholds: ThresholdEstimate[],
  sessionId: string
): PostSessionInsightView {
  const sessionThresholds = thresholds.filter((threshold) => threshold.sessionId === sessionId);
  const reliableSessionCount = completedSessionsWithThresholds(sessions, thresholds).length;
  const sessionsUntilReliable = Math.max(0, RELIABLE_SESSION_COUNT - reliableSessionCount);
  const bands = measuredBandsLabel(sessionThresholds);

  if (sessionThresholds.length === 0 || hasSuspiciousQuality(sessionThresholds)) {
    return {
      status: 'needs-retest',
      title: 'Retest recommended',
      confidenceLabel: 'Needs retest',
      measuredBandsLabel: bands,
      summary: 'This session had an unusual response pattern.',
      detail: 'Fatigue, lighting, missed taps, or a rushed run can make the estimate unreliable. Repeat the session before trusting this reading.',
      deltaLabel: 'Uncertain',
      deltaPercent: null,
      sessionsUntilReliable,
    };
  }

  if (reliableSessionCount < RELIABLE_SESSION_COUNT) {
    return {
      status: 'provisional',
      title: 'Baseline started',
      confidenceLabel: 'Provisional',
      measuredBandsLabel: bands,
      summary: `Measured ${bands}.`,
      detail: `Complete ${sessionsUntilReliable} more session${sessionsUntilReliable === 1 ? '' : 's'} this week for a reliable starting point. This trains contrast sensitivity; it is not a medical test.`,
      deltaLabel: 'Uncertain',
      deltaPercent: null,
      sessionsUntilReliable,
    };
  }

  const deltaPercent = sessionDeltaPercent(sessionThresholds, thresholds);
  const label = deltaLabel(deltaPercent);

  return {
    status: 'reliable',
    title: 'Session insight',
    confidenceLabel: 'Reliable',
    measuredBandsLabel: bands,
    summary:
      deltaPercent === null
        ? `Measured ${bands}.`
        : `${bands} is ${label.toLowerCase()}${deltaPercent === 0 ? '' : ` by ${Math.abs(deltaPercent)}%`}.`,
    detail: 'Your next session keeps working near the edge of what you can see, so perfect scores should still lead to harder contrast.',
    deltaLabel: label,
    deltaPercent,
    sessionsUntilReliable: 0,
  };
}

export function deriveTodayView(
  sessions: SessionLog[],
  thresholds: ThresholdEstimate[],
  now: Date
): TodayView {
  const dayKeys = completedSessionDayKeys(sessions);
  const todayKey = localDayKeyFromIso(now.toISOString());
  const streakDays = computeStreak(dayKeys, now);
  const sessionDoneToday = dayKeys.includes(todayKey);
  const index = todayIndex(now);
  const weekDays = weekCompletion(dayKeys, now);

  const latest = buildLatestCsf(thresholds);
  if (latest.length === 0) {
    return {
      contrastSensitivity: 0,
      dailyProgress: 0,
      streakDays,
      sessionDoneToday,
      todayIndex: index,
      weekDays,
      nextTargetLabel: 'First session · 4 min',
      verdict: 'holding',
    };
  }

  const peak = peakSensitivity(latest);
  const recent = latestThreshold(thresholds);
  return {
    contrastSensitivity: round(Math.log10(Math.max(peak, 1)), 2),
    dailyProgress: sessionDoneToday ? 1 : 0,
    streakDays,
    sessionDoneToday,
    todayIndex: index,
    weekDays,
    nextTargetLabel: recent ? `${formatCpd(recent.spatialFrequencyCpd)} cpd · 4 min` : '6 cpd · 4 min',
    verdict: verdictFromPercent(improvementPercent(thresholds)),
  };
}

export function deriveProgressView(
  sessions: SessionLog[],
  thresholds: ThresholdEstimate[],
  _now: Date
): ProgressView {
  if (thresholds.length === 0) {
    return {
      headlineAcuity: 0,
      previousAcuity: 0,
      verdict: 'holding',
      delta: 0,
      sparkline: [],
      csf: [],
      csfReferences: [],
      contributors: [],
    };
  }

  const latest = buildLatestCsf(thresholds);
  const peak = peakSensitivity(latest);
  const headlineAcuity = round(Math.log10(Math.max(peak, 1)), 2);

  const beforeAfter = buildBeforeAfterCsf(thresholds);
  const firstPoints = beforeAfter[0]?.points ?? [];
  const previousPeak = firstPoints.length > 0 ? peakSensitivity(firstPoints) : peak;
  const previousAcuity = round(Math.log10(Math.max(previousPeak, 1)), 2);
  const delta = round(headlineAcuity - previousAcuity, 2);
  const verdict: Verdict = delta > 0.01 ? 'improving' : delta < -0.01 ? 'regressing' : 'holding';

  // Per-session hero metric over time → sparkline.
  const thresholdsBySession = new Map<string, ThresholdEstimate[]>();
  for (const threshold of thresholds) {
    const bucket = thresholdsBySession.get(threshold.sessionId) ?? [];
    bucket.push(threshold);
    thresholdsBySession.set(threshold.sessionId, bucket);
  }
  const sparkline = sessions
    .filter((session) => session.status === 'completed')
    .map((session) => ({ session, points: thresholdsBySession.get(session.id) ?? [] }))
    .filter((entry) => entry.points.length > 0)
    .map((entry) => ({
      day: weekdayShortFromIso(entry.session.startedAt),
      value: round(
        Math.log10(Math.max(peakSensitivity(entry.points.map((t) => ({ sensitivity: 1 / t.thresholdContrast }))), 1)),
        2
      ),
    }));

  const csf = latest.map((point) => ({
    spatialFrequency: point.spatialFrequencyCpd,
    sensitivity: round(point.sensitivity, 1),
  }));

  const contributors = latest.map((point) => ({
    label: `${formatCpd(point.spatialFrequencyCpd)} cpd`,
    sensitivity: round(point.sensitivity, 1),
    norm: round(1 / populationNormContrast(point.spatialFrequencyCpd, point.paradigm), 1),
  }));
  const referenceBasePoints = latest.map((point) => {
    const norm = 1 / populationNormContrast(point.spatialFrequencyCpd, point.paradigm);

    return {
      spatialFrequency: point.spatialFrequencyCpd,
      norm,
    };
  });
  const normPoints = referenceBasePoints.map((point) => ({
    spatialFrequency: point.spatialFrequency,
    sensitivity: round(point.norm, 1),
  }));
  const targetPoints = referenceBasePoints.map((point) => ({
    spatialFrequency: point.spatialFrequency,
    sensitivity: round(point.norm * TARGET_SENSITIVITY_MULTIPLIER, 1),
  }));

  return {
    headlineAcuity,
    previousAcuity,
    verdict,
    delta,
    sparkline,
    csf,
    csfReferences: [
      { label: 'Target', points: targetPoints },
      { label: 'Norm', points: normPoints },
    ],
    contributors,
  };
}
