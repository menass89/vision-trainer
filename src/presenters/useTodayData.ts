import { useAppStore } from '@/store/useAppStore';
import { now } from '@/utils/clock';

import { deriveTodayView } from './derive';
import type { Loadable, TodayView } from './types';

export function useTodayData(): Loadable<TodayView> {
  const hydrated = useAppStore((state) => state.hydrated);
  const sessions = useAppStore((state) => state.sessions);
  const thresholds = useAppStore((state) => state.thresholds);
  return { data: deriveTodayView(sessions, thresholds, now()), isLoading: !hydrated };
}
