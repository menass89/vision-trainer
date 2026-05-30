import type { Loadable, ProgressView } from './types';

// TODO(phase4): wire to the real zustand/sqlite store
export function useProgressData(): Loadable<ProgressView> {
  return {
    data: {
      headlineAcuity: 1.82,
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
    },
    isLoading: false,
  };
}
