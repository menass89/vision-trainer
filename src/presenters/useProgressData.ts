import type { Loadable, ProgressView } from './types';

// TODO(phase4): wire to the real zustand/sqlite store
export function useProgressData(): Loadable<ProgressView> {
  return {
    data: {
      headlineAcuity: 1.82,
      previousAcuity: 1.74,
      verdict: 'improving',
      delta: +0.08,
      sparkline: [
        { day: 'Mon', value: 1.64 },
        { day: 'Tue', value: 1.68 },
        { day: 'Wed', value: 1.71 },
        { day: 'Thu', value: 1.7 },
        { day: 'Fri', value: 1.77 },
        { day: 'Sat', value: 1.8 },
        { day: 'Sun', value: 1.82 },
      ],
      csf: [
        { spatialFrequency: 0.5, sensitivity: 20 },
        { spatialFrequency: 1, sensitivity: 82 },
        { spatialFrequency: 2, sensitivity: 168 },
        { spatialFrequency: 4, sensitivity: 180 },
        { spatialFrequency: 6, sensitivity: 142 },
        { spatialFrequency: 8, sensitivity: 104 },
        { spatialFrequency: 12, sensitivity: 60 },
      ],
      csfReferences: [
        { label: 'Target', sensitivity: 200 },
        { label: 'Norm', sensitivity: 120 },
      ],
      contributors: [
        { label: '0.5 cpd', sensitivity: 20, norm: 40 },
        { label: '1 cpd', sensitivity: 82, norm: 70 },
        { label: '2 cpd', sensitivity: 168, norm: 110 },
        { label: '4 cpd', sensitivity: 180, norm: 120 },
        { label: '6 cpd', sensitivity: 142, norm: 100 },
        { label: '8 cpd', sensitivity: 104, norm: 80 },
        { label: '12 cpd', sensitivity: 60, norm: 55 },
      ],
    },
    isLoading: false,
  };
}
