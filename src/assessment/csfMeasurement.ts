import type { AssessmentPoint, EyeMode, GaborStimulus, Orientation, TrialInterval } from '../types';
import { uuid } from '../core/uuid';

export type AssessmentTrialPlan = {
  id: string;
  spatialFrequencyCpd: number;
  orientationDeg: Orientation;
  contrast: number;
  targetInterval: TrialInterval;
  stimulus: GaborStimulus;
};

export type AssessmentResponse = {
  plan: AssessmentTrialPlan;
  responseInterval: TrialInterval;
  correct: boolean;
};

const frequencies = [1.5, 3, 6, 12] as const;
const contrastLevels = [0.005, 0.008, 0.013, 0.022, 0.038, 0.068, 0.12];
const orientations: Orientation[] = [0, 45, 90, 135];

export function createAssessmentTrials(): AssessmentTrialPlan[] {
  const trials: AssessmentTrialPlan[] = [];
  for (const spatialFrequencyCpd of frequencies) {
    for (const contrast of contrastLevels) {
      for (let repetition = 0; repetition < 5; repetition += 1) {
        const orientationDeg = orientations[(repetition + frequencies.indexOf(spatialFrequencyCpd)) % orientations.length];
        trials.push({
          id: `assessment-trial-${uuid()}`,
          spatialFrequencyCpd,
          orientationDeg,
          contrast,
          targetInterval: Math.random() < 0.5 ? 1 : 2,
          stimulus: {
            spatialFrequencyCpd,
            orientationDeg,
            contrast,
            phaseRad: Math.random() * Math.PI * 2,
            durationMs: 80,
            backgroundLuminanceCdM2: 40
          }
        });
      }
    }
  }
  return shuffle(trials);
}

export function fitVisionProfile(responses: AssessmentResponse[]): AssessmentPoint[] {
  return frequencies.map((spatialFrequencyCpd) => {
    const rows = responses.filter((response) => response.plan.spatialFrequencyCpd === spatialFrequencyCpd);
    const thresholdContrast = fitWeibullThreshold(rows);
    return {
      spatialFrequencyCpd,
      thresholdContrast,
      sharpnessScore: 1 / thresholdContrast
    };
  });
}

export function estimateAcuityChange(points: AssessmentPoint[], previous?: AssessmentPoint[]): string {
  if (!previous || previous.length === 0) {
    return 'Baseline recorded';
  }
  const currentHighDetail = points.find((point) => point.spatialFrequencyCpd === 12);
  const previousHighDetail = previous.find((point) => point.spatialFrequencyCpd === 12);
  if (!currentHighDetail || !previousHighDetail) {
    return 'Needs another assessment';
  }
  const improvement = currentHighDetail.sharpnessScore / previousHighDetail.sharpnessScore - 1;
  const acuityLines = Math.max(-2, Math.min(2, improvement * 3));
  return `${acuityLines >= 0 ? '+' : ''}${acuityLines.toFixed(1)} estimated acuity lines`;
}

export function buildAssessmentResult(
  startedAt: string,
  eyeMode: EyeMode,
  responses: AssessmentResponse[],
  previous?: AssessmentPoint[]
) {
  const points = fitVisionProfile(responses);
  return {
    id: `assessment-${uuid()}`,
    startedAt,
    completedAt: new Date().toISOString(),
    eyeMode,
    points,
    estimatedAcuityChange: estimateAcuityChange(points, previous)
  };
}

function fitWeibullThreshold(responses: AssessmentResponse[]): number {
  const grouped = contrastLevels.map((contrast) => {
    const rows = responses.filter((response) => response.plan.contrast === contrast);
    const correctRate = rows.length === 0 ? 0.5 : rows.filter((response) => response.correct).length / rows.length;
    return { contrast, correctRate };
  });
  let best = { threshold: 0.03, slope: 2, error: Number.POSITIVE_INFINITY };
  for (let threshold = 0.004; threshold <= 0.18; threshold *= 1.08) {
    for (let slope = 1.2; slope <= 5; slope += 0.3) {
      const error = grouped.reduce((sum, point) => {
        const predicted = weibull(point.contrast, threshold, slope);
        return sum + (predicted - point.correctRate) ** 2;
      }, 0);
      if (error < best.error) {
        best = { threshold, slope, error };
      }
    }
  }
  return best.threshold;
}

function weibull(contrast: number, threshold: number, slope: number): number {
  const chance = 0.5;
  const lapse = 0.02;
  return chance + (1 - chance - lapse) * (1 - Math.exp(-((contrast / threshold) ** slope)));
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
