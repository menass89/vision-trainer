import type { Loadable, TodayView } from './types';

// TODO(phase4): wire to the real zustand/sqlite store
export function useTodayData(): Loadable<TodayView> {
  return {
    data: {
      contrastSensitivity: 1.82,
      dailyProgress: 0.62,
      streakDays: 7,
      sessionDoneToday: false,
      todayIndex: 3, // TODO(phase4): derive from real clock + locale week start
      nextTargetLabel: '6 cpd · 4 min',
      verdict: 'improving',
    },
    isLoading: false,
  };
}
