import type { ParadigmId, ThresholdEstimate } from '../types';

export type CsfPoint = {
  paradigm: ParadigmId;
  spatialFrequencyCpd: number;
  sensitivity: number;
  thresholdContrast: number;
  createdAt: string;
};

export type CsfSeries = {
  label: string;
  points: CsfPoint[];
};

export function buildLatestCsf(thresholds: ThresholdEstimate[]): CsfPoint[] {
  const latest = new Map<number, ThresholdEstimate>();
  for (const threshold of thresholds) {
    const current = latest.get(threshold.spatialFrequencyCpd);
    if (!current || current.createdAt < threshold.createdAt) {
      latest.set(threshold.spatialFrequencyCpd, threshold);
    }
  }
  return [...latest.values()]
    .sort((a, b) => a.spatialFrequencyCpd - b.spatialFrequencyCpd)
    .map(toPoint);
}

export function buildBeforeAfterCsf(thresholds: ThresholdEstimate[]): CsfSeries[] {
  const byFrequency = new Map<number, ThresholdEstimate[]>();
  for (const threshold of thresholds) {
    const values = byFrequency.get(threshold.spatialFrequencyCpd) ?? [];
    values.push(threshold);
    byFrequency.set(threshold.spatialFrequencyCpd, values);
  }

  const before: CsfPoint[] = [];
  const after: CsfPoint[] = [];
  for (const values of byFrequency.values()) {
    values.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const first = values[0];
    const last = values.at(-1);
    if (first) {
      before.push(toPoint(first));
    }
    if (last) {
      after.push(toPoint(last));
    }
  }

  const sortedBefore = before.sort(sortByFrequency);
  const sortedAfter = after.sort(sortByFrequency);
  if (sameCurve(sortedBefore, sortedAfter)) {
    return [{ label: 'Current', points: sortedAfter }];
  }
  return [
    { label: 'First session', points: sortedBefore },
    { label: 'Latest session', points: sortedAfter }
  ];
}

export function improvementPercent(thresholds: ThresholdEstimate[]): number {
  const series = buildBeforeAfterCsf(thresholds);
  const baseline = series[0]?.points ?? [];
  const latest = series[1]?.points ?? [];
  if (baseline.length === 0 || latest.length === 0) {
    return 0;
  }
  const ratios = baseline.flatMap((point) => {
    const match = latest.find((candidate) => candidate.spatialFrequencyCpd === point.spatialFrequencyCpd);
    return match ? [1 - match.thresholdContrast / point.thresholdContrast] : [];
  });
  if (ratios.length === 0) {
    return 0;
  }
  return Math.round((ratios.reduce((sum, value) => sum + value, 0) / ratios.length) * 100);
}

function toPoint(threshold: ThresholdEstimate): CsfPoint {
  return {
    paradigm: threshold.paradigm,
    spatialFrequencyCpd: threshold.spatialFrequencyCpd,
    thresholdContrast: threshold.thresholdContrast,
    sensitivity: 1 / threshold.thresholdContrast,
    createdAt: threshold.createdAt
  };
}

function sortByFrequency(a: CsfPoint, b: CsfPoint): number {
  return a.spatialFrequencyCpd - b.spatialFrequencyCpd;
}

function sameCurve(first: CsfPoint[], second: CsfPoint[]): boolean {
  if (first.length !== second.length) {
    return false;
  }
  return first.every((point, index) => point.createdAt === second[index]?.createdAt);
}
