import type { Loadable, TodayView } from './types';

// TODO(phase4): wire to the real zustand/sqlite store
export function useTodayData(): Loadable<TodayView> {
  return {
    data: {
      contrastSensitivity: 1.82,
      dailyProgress: 0.62,
      streakDays: 7,
      sessionDoneToday: false,
      nextTargetLabel: '6 cpd · 4 min',
      verdict: 'improving',
    },
    isLoading: false,
  };
}
