import { buildBeforeAfterCsf, buildLatestCsf, improvementPercent } from '@/progress/csf';
import { populationNormContrast } from '@/progress/norms';
import type { SessionLog, ThresholdEstimate } from '@/types';
import { computeStreak, localDayKeyFromIso, weekdayShortFromIso } from '@/utils/clock';
import { todayIndex } from '@/utils/clock';

import type { ProgressView, TodayView, Verdict } from './types';

function round(value: number, dp: number): number {
  const factor = 10 ** dp;
  return Math.round(value * factor) / factor;
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

  const latest = buildLatestCsf(thresholds);
  if (latest.length === 0) {
    return {
      contrastSensitivity: 0,
      dailyProgress: 0,
      streakDays,
      sessionDoneToday,
      todayIndex: index,
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
    nextTargetLabel: recent ? `${formatCpd(recent.spatialFrequencyCpd)} cpd · 4 min` : '6 cpd · 4 min',
    verdict: verdictFromPercent(improvementPercent(thresholds)),
  };
}

export function deriveProgressView(
  sessions: SessionLog[],
  thresholds: ThresholdEstimate[],
  _now: Date
): ProgressView {
  const references = [
    { label: 'Target', sensitivity: 200 },
    { label: 'Norm', sensitivity: 120 },
  ];
  if (thresholds.length === 0) {
    return {
      headlineAcuity: 0,
      previousAcuity: 0,
      verdict: 'holding',
      delta: 0,
      sparkline: [],
      csf: [],
      csfReferences: references,
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
    norm: round(1 / populationNormContrast(point.spatialFrequencyCpd, 'contrast-detection'), 1),
  }));

  return {
    headlineAcuity,
    previousAcuity,
    verdict,
    delta,
    sparkline,
    csf,
    csfReferences: references,
    contributors,
  };
}
