import type { ParadigmId } from '@/types';

const baselineNorms = new Map<number, number>([
  [1.5, 0.018],
  [3, 0.012],
  [6, 0.016],
  [12, 0.04],
]);

const paradigmMultiplier: Record<ParadigmId, number> = {
  'contrast-detection': 1,
  'lateral-masking': 1.25,
  'spatial-masking': 1.7,
  'backward-masking': 8,
  'pedestal-discrimination': 0.6,
};

export function populationNormContrast(spatialFrequencyCpd: number, paradigm: ParadigmId): number {
  return (baselineNorms.get(spatialFrequencyCpd) ?? 0.03) * (paradigmMultiplier[paradigm] ?? 1);
}
